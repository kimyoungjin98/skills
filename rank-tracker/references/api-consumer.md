# Rank Tracker API 소비 가이드

## 공통

- 기본 경로는 `${RANK_TRACKER_URL}/v1`이다.
- 보호 API에는 `Authorization: Bearer ${MASTER_TOKEN}`와 `Content-Type: application/json`을 보낸다.
- URL과 토큰은 호출 프로젝트의 환경 변수로 관리한다. 토큰을 프런트엔드 번들, 로그, 저장소에 넣지 않는다.
- `POST /collector/jobs/next`가 아니라 일반 연동 프로젝트는 `/collect`로 등록하고 `runId`·`trackingId`를 저장한다. Chrome 수집기만 `/collector/jobs/next`를 폴링한다.

## 등록

`POST /v1/collect`

```json
{
  "keyword": "노트북",
  "nvMid": "123456789",
  "scheduleType": "PERIODIC",
  "scheduleHour": 9,
  "mode": "A",
  "priority": "NORMAL"
}
```

대상은 `nvMid`, `nvMids`, `productUrl`, `priceComparisonMid`, `priceComparisonUrl` 중 하나 이상을 사용한다. `scheduleType`을 생략하면 `ONE_OFF`다. `PERIODIC`에서 `scheduleHour`를 생략하면 6·9·12시 중 서버가 무작위 배정하며, 등록 당일 자동 수집은 하지 않고 다음 날부터 실행한다.

응답의 `runId`는 이번 회차, `trackingId`는 지속 추적, `jobId`는 대표 작업 식별자다. 같은 회차에 여러 작업이 생길 수 있으므로 진행 상태는 `runId`로 조회한다.

## 우선순위 지정과 변경

등록 요청의 `priority`는 `HIGH`, `NORMAL`, `LOW` 중 하나이며 생략 시 `NORMAL`이다. `/collect/sync`와 `/collect/bulk`의 각 항목도 같은 규칙을 사용한다. 숫자, 소문자, `null`은 허용하지 않는다.

같은 키워드·수집 조건·일정의 기존 대상을 다시 등록하면 요청 우선순위와 관계없이 기존 추적을 재사용하고 저장된 우선순위를 유지한다. 일반 `/collect` 등록 응답의 `priority`로 실제 값을 확인한다. 다른 대상을 진행 중인 추적에 합칠 때는 우선순위도 같아야 한다.

기존 추적의 우선순위는 등록을 반복하는 대신, 공통 인증 헤더와 함께 다음 요청으로 변경한다.

```http
PATCH /v1/trackings/{trackingId}/priority
Content-Type: application/json

{"priority":"HIGH"}
```

응답은 변경된 추적 객체이며, 존재하지 않는 `trackingId`는 404다. 변경은 기존 대기 작업에도 다음 배정부터 반영된다. 배정 가능한 작업은 `HIGH → NORMAL → LOW`, 같은 우선순위에서는 작업 생성 시각 순으로 처리한다. 실행 중인 작업을 선점하지 않고 재시도 대기와 유효한 임대는 유지한다. 완료된 회차를 다시 실행하거나 예정 시각 전의 주기적 회차를 시작하는 기능은 아니다.

## 조회와 폴링

대기형 호출이 필요하면 아래 [Sync 수집과 타임아웃](#sync-수집과-타임아웃) 흐름을 사용한다.

- `GET /v1/runs/{runId}`: 회차와 작업 상태
- `GET /v1/runs/{runId}/results`: 해당 회차의 대상별 결과
- `GET /v1/trackings/{trackingId}/today`: 추적의 오늘 결과
- `GET /v1/ranks?keyword=...&nvMid=...`: 최신 결과

등록 직후 `QUEUED`이면 정상이다. `CollectionRun.status`는 `QUEUED`, `RUNNING`, `COMPLETED`, `PARTIAL`, `FAILED`를 사용한다. 결과의 `state`는 `pending`, `found`, `not_found`, `collection_failed`이며 `rank`가 없을 수 있다. 호출 프로젝트는 `COMPLETED`만 성공으로 단정하지 말고 `PARTIAL`과 대상별 state도 처리한다.

## Sync 수집과 타임아웃

`POST /v1/collect/sync`는 일반 등록과 같은 body에 `timeoutSeconds`(정수 1~300, 기본 120)를 추가한다. 즉시 한 번 수집하고 결과를 기다리는 요청은 `ONE_OFF`를 사용한다.

```json
{
  "keyword": "노트북",
  "nvMid": "123456789",
  "scheduleType": "ONE_OFF",
  "mode": "A",
  "timeoutSeconds": 120
}
```

서버는 등록 후 회차가 `COMPLETED`, `PARTIAL`, `FAILED` 중 하나가 될 때까지 기다린다. Chrome 수집기가 실행되어야 대기 중인 수집이 진행된다. 응답의 `runId`, `trackingId`, `jobId`를 저장하고 다음처럼 처리한다.

- `timedOut: false`: 회차가 종료되었다. `FAILED`도 포함하므로 성공으로 단정하지 말고 `status`와 대상별 `results[].state`를 확인한다.
- `timedOut: true`: 대기 시간이 끝났지만 수집은 계속된다. 현재 `results`를 반영하고, 같은 `runId`로 `GET /v1/runs/{runId}`를 일정 간격으로 조회한다. 종료되면 `GET /v1/runs/{runId}/results`로 결과를 갱신한다. 대기를 연장하려고 sync 등록을 반복하지 않는다.

`results`는 회차 전체 대상의 결과라서 병합된 다른 대상도 포함될 수 있다. 요청한 대상은 `targetType`과 `targetValue`로 찾고, `pending`이나 `rank: null`을 순위 밖(`not_found`)으로 바꾸지 않는다.

호출 측 HTTP·프록시 제한 시간은 `timeoutSeconds`에 등록·조회 처리 여유를 더해 설정한다. 긴 연결을 유지할 수 없는 환경에서는 `/collect` 등록 후 조회를 사용한다. HTTP 연결 오류는 `timedOut: true` 응답과 다르며, 서버 등록이나 수집 취소를 뜻하지 않는다. 이미 받은 `runId`가 있으면 조회를 이어가고, ID를 받지 못했으면 등록 여부를 확인한 뒤 재시도를 결정한다.

## 추적 제어

- `PATCH /v1/trackings/{trackingId}/priority` body `{ "priority": "HIGH" | "NORMAL" | "LOW" }`
- `POST /v1/trackings/{trackingId}/pause`
- `POST /v1/trackings/{trackingId}/resume`
- `POST /v1/trackings/{trackingId}/end`

멱등 재시도를 위해 등록 요청의 응답 ID를 저장하고, 네트워크 오류 때 무작정 새 추적을 만들지 않는다. HTTP 오류는 상태 코드와 응답 본문을 함께 기록하되 토큰은 기록하지 않는다.

## 최소 연동 흐름

```text
등록 POST /collect
  → runId/trackingId 저장
  → 주기적으로 GET /runs/{runId} 확인
  → 완료 시 GET /runs/{runId}/results
  → state/rank/collectedAt을 호출 프로젝트 모델에 저장
```

호출 프로젝트에서 Chrome 수집기를 직접 구현하지 않는 한 collector job endpoint를 호출하지 않는다. 수집기 운영이 필요하면 이 저장소의 `extension/`과 동일한 lease·result·fail 계약을 따른다.
