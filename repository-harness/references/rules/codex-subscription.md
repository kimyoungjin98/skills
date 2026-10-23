<!-- Generated from docs/codex-subscription.md by scripts/build_skill.py. Edit the source document. -->

# Codex 구독 계정의 GitHub 작업 자동화

## 적용 범위

- 서버에 설치·로그인된 Codex CLI를 전용 Linux self-hosted runner에서 재사용. 비공개 GitHub 저장소와 신뢰할 수 있는 코드·사용자에만 적용하며 공개·오픈소스 저장소에서는 실행하지 않음
- Actions는 이벤트와 실행을 연결하고 서버의 영구 `auth.json`은 Codex 인증을 담당. OpenAI API 키와 GitHub 저장소 인증은 별개
- 이 베이스에는 배포용 템플릿만 포함. 파일 배치, 외부 설정 준비, 기본 브랜치 반영, 실제 이벤트 실행, PR·댓글 전달 검증을 각각 기록
- 구독 사용 권한·한도·인증 갱신 조건을 적용. 파일 설치나 Draft 전달을 검증 통과 또는 완전한 작업 완료로 보고하지 않음

## 구성 시 사용 여부 확인

- 최초 구성은 실행 승인 선택 이후 이슈·PR 댓글 자동화를 함께 구성할지 확인. 이미 요청하거나 선택한 범위는 재확인 없이 진행
- 갱신 시 기존 사용 여부, 발행 정책, 기준 브랜치, 검증 명령, 인증 방식·경로, 환경변수 이름, 러너·알림 설정과 override를 보존. 명시적인 미사용 선택은 다시 묻지 않음
- 자동화를 선택하면 최초 구성에서 `draft-on-incomplete` 또는 `verified-only` 발행 정책을 확정. 기존 명시적인 정책을 우선하고 없는 항목만 확인. 답변 전에는 해당 적용을 보류하며 독립적인 조사는 진행
- 준비 부족과 사용하지 않음은 구분. 부족한 조치만 모아서 안내하고 실제 적용 완료로 처리하지 않음

## Actions flow 필수 준비

| 항목 | 확인 내용 |
| --- | --- |
| 저장소 접근·push | 실행 토큰과 Git 원격 인증의 읽기·쓰기 권한, 저장소·브랜치 보호 규칙 확인 |
| workflow 파일 push | 일반 코드 push와 별도 확인. 토큰 방식에 따른 workflow 변경 권한, 조직 승인·SSO와 보호 규칙 확인 |
| 조직 조회 | 조직 러너·그룹 조회 권한을 별도 확인. 권한 부족·빈 결과는 미확인으로 기록하고 조직 러너 부재로 단정하지 않음 |
| Actions PR 생성 | 조직·저장소의 Actions PR 생성 허용 정책과 workflow의 `contents`·`issues`·`pull-requests` 권한을 각각 확인 |
| 러너 | 해당 저장소의 러너 그룹 접근 범위, 라벨 일치, 온라인 상태와 단일 작업 직렬 실행 확인 |
| 실행 환경 | 아래 사전 점검을 실제 서비스 계정·실행 환경에서 확인. 로그인 셸의 성공만으로 대체하지 않음 |
| 발행·복구 | 발행 정책, 보호 파일, 영구 작업·상태 경로, 알림 수신 확인과 수동 복구 담당·절차 확인 |
| 활성화 | 기본 브랜치의 workflow와 제어 파일 반영 커밋, 실제 이벤트·결과 전달 확인 |

- 준비 확인용 push·PR 생성·시험 알림은 임의 실행하지 않음. 설정과 실행 검증을 구분
- 조직·저장소의 **Allow GitHub Actions to create and approve pull requests**는 workflow 권한 선언과 별도 확인. 이 설정이 PR 승인·merge 권한까지 자동화에 부여하는 것은 아님
- 인증 Secret 갱신 토큰이 필요한 프로젝트는 코드 push·PR용 토큰과 분리하고 Secret 갱신 권한·대상·만료·승인 범위를 별도 확인

## 러너와 구독 인증 준비

1. 기존 Linux 러너가 있으면 소속 조직·저장소, 설치 위치와 서비스 이름·상태, 실행 계정, 그룹·라벨·접근 범위를 확인하고 재사용 가능 여부 판단. 다른 작업의 러너를 임의 교체하지 않음
2. 조직으로 재등록해야 하면 기존 실행 작업 종료와 변경 권한을 확인한 뒤 해당 서비스 정지 → 기존 등록 해제 → 조직 설정에서 새 등록 → 그룹·라벨·저장소 접근 지정 → 동일 실행 계정으로 서비스 설치·시작 순서 적용. 등록 토큰은 로그나 문서에 남기지 않으며 같은 디렉터리를 동시에 중복 등록하지 않음
3. 서비스를 설치·관리하는 관리자 계정과 실제 작업 실행 계정을 구분. 작업 디렉터리·영구 경로의 소유권과 쓰기 권한을 실행 계정에 맞춤. 서비스의 PATH·HOME·CODEX_HOME과 로그인 셸의 초기화 파일·환경변수 차이 확인
4. 기존 CLI 재사용이면 실행 계정의 실제 PATH·실행 파일·버전을 확인. workflow 설치 방식이면 기존 설치 절차와 프로젝트 버전 정책을 적용하며 매 실행 설치를 강제하지 않음. 포함 템플릿은 기존 CLI 재사용 방식
5. 실행 계정으로 저장소 밖 영구 Codex 설정 경로를 지정하고 `cli_auth_credentials_store = "file"` 방식의 자동화 전용 로그인 준비. 해당 계정·경로에서 `codex login status` 확인. 개발자의 일상 인증 사본을 동시 공유하지 않음
6. 모델 호출 전에 Git·Bash·프로젝트 도구의 실행, Codex PATH·버전, 인증 파일의 읽기·갱신 권한·인증 방식, 실제 작업 위치의 샌드박스 실행 가능 여부를 점검. 실패 시 모델을 호출하지 않고 조치·Actions 요약과 가능한 이슈 댓글을 남김

- `sandboxProbe`는 설치된 CLI의 도움말로 확인한 `codex sandbox linux` 인자를 지정. 템플릿 예시는 모델 호출 없이 `workspace-write`에서 명령 실행을 확인하며, Codex 구현도 같은 제한으로 실행. 오류를 해결하기 위해 제한을 임의 해제하거나 네트워크 허용을 강제하지 않음
- 인증 원문, 토큰, Webhook은 출력·커밋·artifact·cache 저장 금지. 문서에는 경로·방식·설정 이름·준비 상태만 기록
- 같은 구독 인증의 갱신과 영구 작업 기록 접근은 전용 러너 한 개 또는 동등한 외부 잠금으로 직렬화. 대기 요청을 취소하는 concurrency 설정을 추가하지 않음
- 영구 `auth.json`은 Codex가 갱신한 파일을 유지하며 매 실행 초기 사본으로 덮어쓰지 않음. 템플릿은 Secret 복원·저장을 구현하지 않음
- Secret을 인증 기준으로 사용하는 기존 프로젝트는 복원 → Codex 실행 → 유효한 갱신 파일 저장을 직렬화. 모델 실패 후에도 파일이 갱신될 수 있으므로 저장 확인. 빈 파일·손상 파일로 Secret을 덮어쓰지 않으며 저장 실패는 별도 보고
- 갱신용 GitHub 토큰은 저장 단계에만 제공하고 모델·검증에는 전달하지 않음. 조직 Secret과 저장소 Secret의 권한·허용 저장소를 구분. 해당 방식은 프로젝트 workflow 구현과 다음 실행의 복원 검증이 필요
- 전용 러너의 신뢰 조건은 환경변수 필터로 대체되지 않음. 검증에는 운영 비밀정보가 없는 서비스 환경·파일 접근 범위를 준비

## 프로젝트 설정과 템플릿 배치

| 스킬 원본 | 대상 위치 |
| --- | --- |
| `assets/codex-subscription/workflow.yml` | `.github/workflows/codex-subscription.yml` |
| `assets/codex-subscription/automation.mjs` | `.github/codex/automation.mjs` |
| `assets/codex-subscription/project.example.json` | 프로젝트에서 정한 설정 파일 |
| `scripts/notify.mjs` | 기존 전송 도구가 없을 때 `scripts/harness-notify.mjs` |

- 기존 파일은 보존하고 기존 명령·경로·버전·환경변수 이름을 설정과 override로 연결. 예시의 빈 값은 실제 프로젝트 문서·스크립트·변경 영역의 근거로 채움. 공통 코드에서 프로젝트 경로·브랜치·도구 버전·검증 명령을 추정하지 않음
- 발행 정책은 `publicationPolicy`, 작업 기준은 `baseBranch`, 작업 브랜치 접두사는 `branchPrefix`로 지정. 자동화의 브랜치 규격이 기존 전략과 다르면 명시적인 override로 기록. 접두사 뒤의 이슈 번호로 원본 요청을 연결
- `codexExecutable`은 실제 서비스 PATH에서 확인한 실행 파일. `toolChecks`는 도구 버전 등 모델을 호출하지 않는 실행 파일·인자 배열. CLI 설치 명령이나 프로젝트 검증을 임의로 공통 기본값에 넣지 않음
- `authHome`, `stateRoot`, `workRoot`는 서비스 계정이 접근 가능한 저장소 밖 영구 절대 경로로 미리 준비. 상태 경로는 모델 작업·추가 쓰기 경로와 분리하고 실행 계정만 관리. 일회성 `RUNNER_TEMP`에 복구 기록을 두지 않음
- `prepareCommand`는 기존 의존성·프로젝트 준비 명령, `verifyCommand`는 실제 필수 검증 명령. 실행 위치는 작업 루트로 두고 영역별 경로는 프로젝트 명령에 명시
- `testEnvironment`는 테스트 전용 값만 명시적으로 지정. 모델과 자동화 재검증이 같은 환경을 사용하고 `${runtime}`을 쓰기 가능한 작업별 경로로 치환. TMPDIR·캐시 경로도 함께 제공. 추가 산출물 경로는 이 설정과 기존 도구 옵션으로 지정
- `protectedPaths`에는 프로젝트 보호 파일·권한 설정·자동화 설정 경로를 기록. workflow·제어 파일·실제 자동화 설정 파일·Codex 권한 설정·알림 실행 파일·`.gitmodules`는 기본 보호 대상. 서브모듈 내부 변경은 이 템플릿에서 자동 커밋하지 않고 보존 후 수동 처리
- `notifyScript`, `notifyProvider`, `webhookEnv`는 기존 전송 도구·서비스·설정 이름에 맞춤. 포함된 도구는 `--pr-file`·`--webhook-env` 지원이 필요하며 기존 도구는 해당 호출을 맞춰 연결
- workflow의 `CODEX_AUTH_RUNS_ON`과 `CODEX_WORK_RUNS_ON`은 실제 허용된 러너·그룹·라벨의 JSON 값으로 지정. `CODEX_AUTOMATION_CONFIG`는 실제 설정 파일 경로. workflow의 Webhook 입력 이름도 `webhookEnv`와 기존 Secret 이름에 맞춤. 예시 이름을 기존 프로젝트에 강제하지 않음
- 배치 파일의 실제 경로·SHA-256을 설치 상태의 `installed_templates`에 기록. 설정과 override는 프로젝트 소유로 유지하고 새 예시로 덮어쓰지 않음. 갱신은 스킬의 `references/update.md` 갱신 기준 적용

## 작업·검증·전달과 복구

- 공통 발행·댓글·재시도 기준은 [워크플로우](./main.md#작업검증전달-상태) 적용. 템플릿은 요청별 영구 JSON 기록으로 구현, 모델 검증, 자동화 재검증, push, PR, 대상별 댓글, 알림을 분리하고 최초 오류를 보존
- 요청은 쓰기 권한 사용자의 이슈 작성·`codex` 라벨 또는 이슈·PR 일반 댓글의 `/codex` 명령. 외부 사용자·봇·fork PR·종료된 PR은 실행하지 않음. PR 후속 요청은 원본 이슈와 요청 PR 모두에 결과 링크·검증 상태를 기록
- 동일 요청은 댓글 ID 또는 이벤트 종류·이슈 번호·라벨 변경 시각로 식별. 같은 run 재실행은 동일 기록을 사용. 다른 run의 신규 요청은 새 작업으로 취급하며, 이전 실패 복구를 새 요청으로 대신하지 않음
- 모델이 결과를 남기지 못했거나 blocked를 보고해도 변경·브랜치 안전성이 확인되면 선택한 정책에 따라 Draft 전달 가능. 모델 결과 형식 오류·실패는 검증 미완료로 기록. 필수 검증 누락이나 기존 실패를 통과로 바꾸지 않음
- push 전 보호 파일·브랜치·HEAD·서브모듈 무결성 확인. 위반 시 Draft도 발행하지 않으며 변경과 최초 사유 보존
- PR 본문은 `codex-result` 관리 경계 안만 갱신. 경계가 없으면 사용자 본문 뒤에 추가하고 경계가 손상되거나 중복이면 자동 갱신 중단
- GitHub 쓰기는 원격 PR·댓글·브랜치 상태 확인 후에만 최대 3회, 짧은 지수 대기와 Retry-After를 적용해 재시도. 긴 요청 제한은 다음 실행으로 넘김. 조회 실패는 쓰기 반복으로 대체하지 않음
- push 후 실패는 동일 Actions run을 재실행하여 저장된 커밋·결과로 PR·미전달 댓글·알림 단계부터 복구. 원격 SHA가 바뀌면 자동 재개하지 않음. 전달 완료 댓글 하나만으로 나머지를 건너뛰지 않음
- Webhook은 별도 정책 적용. 전송 직전에 `unknown`을 기록하고 확인 응답만 `passed`로 변경. 시간 초과·응답 유실이면 자동 재전송하지 않으며 수신 확인 후 담당자가 `passed` 또는 미수신 확인 근거와 함께 `pending`으로 바꿔 같은 run 재실행. PR·댓글 재시도와 혼합하지 않음
- 모델 실행 중 중단되어 `implementation=running`이 남으면 자동 재실행하지 않음. 담당자가 요청·설정 해시·기준 SHA·작업 브랜치·diff를 확인해 원래 작업을 보존한 뒤 재개. 확인된 결과가 있으면 기록을 복원하고 전달만 재개하며, 구현이 실제 미완료일 때만 해당 상태를 `pending`으로 변경
- 상태 파일은 수동 복구 시 먼저 안전하게 보존하고 다른 요청 기록을 대신 사용하지 않음. 설정 변경으로 해시가 다르면 근거와 호환성을 검토한 뒤 수동 전환. 실패 상태를 성공으로 조작해 단계를 건너뛰지 않음
- 서브모듈은 모델 호출 전 초기화·인증하고 내부 미커밋 변경이나 기준 변경은 보존. 포함 템플릿은 성공 후에도 Worktree를 자동 삭제하지 않음. 원격 보존·미추적 파일·서브모듈·후속 복구를 [브랜치 전략](./git-branch.md)에 따라 확인한 뒤 수동 정리

## 기본 브랜치 반영과 적용 검증

1. 실제 기본 브랜치와 코드 작업 기준 브랜치를 별도 확인. workflow는 기본 브랜치에서 로드하고 모델 작업은 프로젝트의 `baseBranch`를 유지
2. 기본 브랜치 변경에 연결된 배포·릴리스·기존 자동화를 먼저 확인. 사용자 승인 범위와 프로젝트 절차 안에서 반영하며 파일 배치 권한을 merge·배포 권한으로 확대하지 않음
3. 파일 배치, 외부 준비, 기본 브랜치 반영 커밋, 실제 이벤트 실행, PR 생성·갱신, 원본 이슈·후속 PR 댓글, 알림 수신 상태를 각각 기록. 기본 브랜치 반영 전 이벤트는 자동 재처리된다고 안내하지 않음
4. 승인된 비공개 테스트 저장소에서 [평가 시나리오](./evaluation.md#자동화-실행과-복구-평가)를 실행. 정적 검증·실제 실행 검증·수동 복구를 분리하고 미실행은 통과로 표시하지 않음
5. 러너 오프라인·체크아웃·모듈 로딩 실패에서는 별도 실패 보고 job이 가능한 범위에서 댓글·Actions 요약 기록. GitHub 장애·토큰 부족·모든 러너 사용 불가·강제 중단에서는 전달할 수 없으므로 Actions 상태와 영구 기록으로 수동 확인

공식 기준: [Codex CI/CD 구독 인증](https://learn.chatgpt.com/docs/auth/ci-cd-auth), [Codex 비대화형 실행](https://learn.chatgpt.com/docs/non-interactive-mode), [GitHub 이벤트](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [조직 러너 조회](https://docs.github.com/en/rest/actions/self-hosted-runners#list-self-hosted-runners-for-an-organization), [러너 서비스](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/configure-the-application), [Actions 토큰](https://docs.github.com/en/actions/concepts/security/github_token).
