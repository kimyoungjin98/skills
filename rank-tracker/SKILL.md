---
name: rank-tracker
description: "Use or extend the Rank Tracker API, including tracking priority, synchronous collection and timeout handling, from an unfamiliar project, or work on its NestJS server, Prisma schema, schedules, and Chrome MV3 collector while preserving domain invariants."
---

# Rank Tracker

이 스킬은 이 저장소의 순위 추적 기능을 추가·수정·디버깅할 때 사용한다. 작업 전에 [docs/code-guide.md](../../../docs/code-guide.md)와 관련 모듈을 확인한다.

다른 프로젝트에서 API를 소비하는 요청이면 [references/api-consumer.md](references/api-consumer.md)를 먼저 읽고, 서버 코드를 수정하기보다 해당 프로젝트에 호출 코드·환경 변수·응답 상태 처리를 추가한다.

프로젝트는 NestJS API와 Chrome MV3 수집기로 구성된다. `Tracking`은 키워드·대상·모드·상태·일정을 정의하고, `CollectionRun`은 KST 날짜별 회차, `CollectionJob`은 수집기 한 대에 배정되는 작업이다. 순위 결과는 `RankObservation`으로 저장한다.

변경 시 다음 불변 조건을 유지한다.

- 모든 DB 생성·배정·결과 저장은 `src/prisma/transaction.ts`의 직렬화 트랜잭션 경계를 따른다. 트랜잭션 안에서 HTTP나 브라우저 조작을 호출하지 않는다.
- 같은 추적의 하루 회차는 하나이며 `trackingId + scheduledDate` 유니크 제약으로 중복을 막는다. 한 회차에서 이미 배정된 작업의 대상 snapshot은 변경하지 않는다.
- 작업 배정은 아래 우선순위 규칙을 따른다. PAUSED·ENDED 추적은 새 작업을 배정하지 않지만 실행 중 작업의 결과 제출은 허용한다.
- `PERIODIC` 추적의 `scheduleHour`는 KST 6·9·12 중 하나다. 생략 시 생성 시 무작위 배정하며, 등록 당일 자동 회차는 만들지 않고 다음 날부터 매일 실행한다.
- 서버 스케줄러는 `@nestjs/schedule`의 `ScheduleModule.forRoot()`와 `@Cron(CronExpression.EVERY_MINUTE)`를 사용해 `TrackingsService.enqueueDueRuns()`를 호출한다. 크론은 DB 큐 생성만 담당하고 실제 네이버 수집은 익스텐션이 담당한다.

## 우선순위

API 연동 시 [우선순위 지정과 변경](references/api-consumer.md#우선순위-지정과-변경)을 읽는다. 서버 수정 시 `CollectionsService.findOrCreateTracking`, `TrackingsService.updatePriority`·`enqueueDueRuns`, `JobsService.leaseNextJob`을 함께 확인한다.

- `priority`는 `Tracking`의 변경 가능한 속성이며 `HIGH`, `NORMAL`, `LOW`를 허용한다. 등록 시 생략하면 `NORMAL`이고, 숫자·소문자·`null`은 허용하지 않는다.
- 기존 대상 재요청은 우선순위를 추적 식별 조건에 넣지 않는다. 현재 구현은 키워드·플랫폼·매칭 기준·검색 프로필·모드·일정 조건이 같고 요청 대상이 하나라도 겹치는 ACTIVE·PAUSED 추적을 재사용하며, 요청의 `priority`로 저장값을 덮어쓰지 않는다. 다른 대상을 진행 중인 ACTIVE 추적에 합칠 때는 요청 우선순위(생략 시 `NORMAL`)까지 같아야 한다.
- 변경은 `PATCH /v1/trackings/{trackingId}/priority`로 처리한다. 작업에 우선순위를 복사하지 않고 배정 시 현재 `Tracking.priority`를 읽으므로 기존 대기 작업에도 다음 배정부터 반영된다. 새 추적·회차를 만들거나 완료된 회차를 재실행하지 않는다.
- 배정 가능한 작업은 `Tracking.priority DESC → CollectionJob.createdAt ASC → CollectionJob.id ASC` 순이다. 플랫폼·검색 프로필·ACTIVE 상태 필터, `nextAttemptAt` 재시도 대기, 유효한 임대 조건을 유지한다. HIGH로 올려도 실행 중인 작업을 선점하거나 재시도 대기를 건너뛰지 않는다.
- 예정 회차 생성은 실행 시각이 도래한 ACTIVE·PERIODIC 추적 중 `priority DESC → nextRunAt ASC → id ASC` 순으로 최대 50개를 조회한다. 높은 우선순위도 예정 시각보다 먼저 실행하지 않는다.
- PostgreSQL enum 선언 순서 `LOW, NORMAL, HIGH`가 내림차순 배정의 전제다. `prisma/migrations/20260907000000_tracking_priority/migration.sql`은 기존 추적도 `NORMAL`로 초기화한다. 배포 전에 `pnpm exec prisma migrate deploy`로 적용해야 한다.

우선순위 동작을 변경했다면 `test/collections.service.spec.ts`, `test/jobs.service.spec.ts`, `test/trackings.service.spec.ts`, `test/dto-validation.spec.ts`, `test/prisma-schema.spec.ts`의 관련 회귀 검증을 실행한다. 실제 DB enum 정렬과 재등록 동작은 `test/collection-lifecycle.integration.spec.ts`에서 검증하며, 별도 테스트 DB의 `TEST_DATABASE_URL`이 없으면 건너뛴다.

## Sync 수집

`POST /v1/collect/sync` 연동은 [API 소비 가이드](references/api-consumer.md#sync-수집과-타임아웃)를 읽는다. 서버 수정 시 `CollectionsService.createCollectionSync`, `SyncCollectionDto`, `SyncCollectionResponseDto`, `RanksService.getRunResults`를 함께 확인한다.

- 일반 `createCollection`으로 등록·병합한 뒤, 반환된 `runId`의 상태를 즉시 조회하고 1초 간격으로 재조회한다. 등록 트랜잭션이 끝난 뒤 대기하며, 실제 수집은 기존 Chrome 수집기가 수행한다.
- `timeoutSeconds`는 정수 1~300, 기본 120이다. 현재 구현은 등록 완료 후 대기 시간을 계산한다. HTTP 전체 처리 시간에는 등록·DB 조회·결과 조회와 마지막 폴링 시간도 포함된다.
- 종료 상태는 `COMPLETED`, `PARTIAL`, `FAILED`다. 대표 `jobId`의 완료가 아니라 회차 전체 상태로 대기를 종료한다. 이미 종료된 회차는 대기하지 않는다.
- 응답은 `runId`, `trackingId`, `jobId`, `status`, `timedOut`, `results`다. `timedOut`은 마지막으로 읽은 상태가 종료 상태가 아닐 때 true이며, 실패 상태 `FAILED`도 종료 상태이므로 false다.
- 결과는 `getRunResults(runId)`로 회차 전체 대상을 조회한다. 아직 관측값이 없는 대상은 `pending`으로 반환한다. 상태와 결과는 별도 조회이므로 하나의 원자적 snapshot으로 취급하지 않는다.
- 타임아웃은 HTTP 대기만 끝낸다. 회차나 작업을 취소·실패 처리하지 않으며, 이후 같은 `runId`로 조회를 이어간다.

주요 작업 위치:

- 입력과 추적·회차·작업 병합: `src/collections/collections.service.ts` 및 `dto`
- 예정 회차 생성과 pause/resume/end: `src/trackings/trackings.service.ts`
- 작업 lease, 재시도, 결과 멱등성: `src/jobs/jobs.service.ts`
- 네이버 페이지 판독: `extension/src/background/collector.ts`
- 스키마와 마이그레이션: `prisma/schema.prisma`, `prisma/migrations/`

검증은 변경 범위에 맞춰 `pnpm typecheck`, `pnpm exec jest --runInBand`, `pnpm build`, `pnpm extension:build`, `pnpm exec prisma validate`를 사용한다. 스키마 변경 후에는 새 migration을 만들고 Prisma Client를 생성한다.
