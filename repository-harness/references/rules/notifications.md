<!-- Generated from docs/notifications.md by scripts/build_skill.py. Edit the source document. -->

# Discord·Slack 알림

## 전송 준비

- Discord 또는 Slack 중 사용할 서비스의 incoming Webhook과 전송 대상·권한을 확인
- 기존 전송 명령이나 자동화가 있으면 유지. 없으면 스킬에 포함된 `scripts/notify.mjs`를 대상 프로젝트의 `scripts/harness-notify.mjs`로 복사하여 사용
- 기본 스크립트는 Node.js 20 이상 필요. 별도 npm 패키지 설치는 불필요
- Discord는 `DISCORD_WEBHOOK_URL`, Slack은 `SLACK_WEBHOOK_URL` 환경변수 사용. 기존 설정 이름은 `--webhook-env 이름`으로 지정
- URL은 기존 비밀정보 관리 방식으로 실행 환경에 주입. 스크립트가 `.env`를 자동으로 읽지는 않음
- URL 원문을 명령 인자, 문서, 작업 이력에 기록하지 않음. `project.md`에는 서비스, 대상, 환경변수 이름, 실제 전송 명령과 권한만 기록

## 설정 확인

대상 프로젝트 루트에서 실행한다. 복사 전 준비 확인은 설치된 스킬의 `scripts/notify.mjs` 경로로 실행한다.

```bash
node scripts/harness-notify.mjs --provider discord --message "연동 설정 확인" --dry-run
```

- Slack은 `--provider slack` 사용
- `--dry-run`은 환경변수·URL 형식·본문만 검사하며 네트워크 요청을 보내지 않음
- 성공해도 인증 유효성이나 실제 수신 성공을 확인한 것은 아님. 전송 대상·권한은 별도 근거로 확인하고 실제 전송 검증 여부를 구분하여 기록
- 시험 전송은 사용자 요청과 실행 환경의 권한을 확인한 경우에만 진행

## PR 알림 전송

PR 생성·갱신 후 아래 정보를 UTF-8 JSON 파일로 작성한다. 저장소·제목·URL·브랜치는 Git 원격과 실제 PR 메타데이터로 확인하고, 작업 요약과 검증 결과는 해당 작업의 실제 내용으로 작성한다. 외부 입력을 셸 명령 문자열에 직접 삽입하지 않고 파일로 전달한다.

| 항목 | 작성 기준 |
| --- | --- |
| `repository` | 소유자를 포함한 `owner/repo`. 여러 저장소 알림을 구분할 수 있도록 표시 |
| `title`, `url` | 실제 PR 제목과 HTTPS URL. URL의 저장소 경로 일치 확인. 인증정보·query·fragment 없는 기본 PR URL 사용 |
| `action` | 신규 PR은 `created`, 기존 PR 수정은 `updated` |
| `head`, `base` | 실제 작업 브랜치와 PR 대상 브랜치 |
| `summary` | 주요 변경 1~3개를 배열로 작성. 변경 파일·영역과 달라진 동작을 구체적으로 기록 |
| `checks` | 검증별 `name`·`status`·`detail`. 실제 명령 또는 검사 대상, 결과와 확인 근거 기록 |
| `review` | 사람이 검토할 위치와 기대 동작을 배열로 기록. 단순히 검토 요청으로 끝내지 않음 |
| `remaining` | 미실행 검증·후속 조치와 이유를 배열로 기록. 남은 작업이 없으면 빈 배열 |

`checks.status`는 `passed`(통과), `failed`(실패), `not_run`(미실행), `not_applicable`(비적용) 중 하나다. 실행하지 않은 테스트를 통과로 기록하지 않으며 미실행·비적용에는 사유를 적는다. 링크만 보내거나 여러 검증을 한 문장으로 합쳐 전체 통과처럼 보이게 하지 않는다.

- 제목·메타 정보·변경·검증·리뷰·남은 작업 사이에 빈 줄을 두고 섹션 제목은 굵게 표시. Discord는 `**제목**`, Slack은 `*제목*` 형식 적용
- 변경·리뷰·남은 작업은 항목별 줄바꿈. 항목 안의 여러 줄과 문단도 보존하고 이어지는 줄은 들여쓰기. 본문 전체의 공백을 정리하면서 줄바꿈까지 제거하지 않음
- 검증은 상태·검사명을 첫 줄에 쓰고 결과·사유는 다음 줄에 들여쓰기. 검사 항목 사이에도 빈 줄을 두어 긴 명령과 설명이 한 줄에 몰리지 않도록 작성
- JSON 문자열 안의 줄바꿈은 `\n`으로 작성하면 파싱 후 실제 개행으로 전달됨. 완성된 본문을 다시 문자열로 감싸거나 `\\n`으로 치환하여 화면에 문자 그대로 표시하지 않음

아래는 하네스 문서 구성 작업의 작성 예시다. 저장소와 PR 정보, 검증 결과는 실제 작업에 맞춰 작성한다.

```json
{
  "repository": "team/shopping-tool",
  "title": "레포지토리 하네스 구성",
  "url": "https://github.com/team/shopping-tool/pull/1",
  "action": "created",
  "head": "feature/configure-harness",
  "base": "main",
  "summary": [
    "AGENTS.md에 프로젝트 하네스 규칙 연결",
    "PR 생성 후 Discord 알림 전송 명령 추가"
  ],
  "checks": [
    { "name": "문서 상대 링크", "status": "passed", "detail": "변경 문서의 참조 경로 확인" },
    { "name": "앱 테스트·빌드", "status": "not_applicable", "detail": "앱 코드 변경 없음" },
    { "name": "Webhook 수신", "status": "not_run", "detail": "실제 시험 전송 요청이 없어 미실행" }
  ],
  "review": ["기준 브랜치와 project.md의 검증 명령이 운영 방식에 맞는지 확인"],
  "remaining": ["권한 확인 후 실제 Webhook 수신 검증"]
}
```

작성한 파일의 실제 알림 본문을 먼저 확인한다. `--preview`는 선택한 서비스의 강조 형식·줄바꿈·길이를 적용하여 Webhook 설정 없이 본문을 출력하며 전송하지 않는다. `--dry-run`은 Webhook 설정까지 검사하지만 본문 대신 검사 결과를 출력한다.

```bash
node scripts/harness-notify.mjs --provider discord --pr-file /tmp/pr-notification.json --preview
node scripts/harness-notify.mjs --provider discord --pr-file /tmp/pr-notification.json --dry-run
```

기존 전송 권한에 따라 선택한 서비스에 한 번 전송한다. `--pr-file`은 저장소·제목·브랜치·변경·검증·리뷰·남은 작업을 구분해 본문으로 변환하며, 필수 정보가 없으면 전송 전에 실패한다.

```bash
node scripts/harness-notify.mjs --provider discord --pr-file /tmp/pr-notification.json
```

- Slack은 위 명령의 `discord`를 `slack`으로 변경
- PR 알림은 `--pr-file`을 기본으로 사용. 일반 메시지는 `--message "메시지"` 또는 `--message-file`을 유지. 세 입력 중 하나만 지정하며 파일 `-`는 표준 입력 사용
- 기존 전송 도구를 쓰는 프로젝트도 위 항목을 포함하는 본문을 작성. 현재 도구가 일반 텍스트만 받으면 동일한 항목과 구분을 유지해 전송
- 기존 스크립트에 `--pr-file`이 없으면 설치 해시와 사용자 변경을 확인하여 스크립트를 먼저 갱신. 자동화 템플릿의 새 입력을 적용할 때 전송 스크립트 지원 여부도 함께 확인
- 성공은 종료 코드 `0`과 `sent: true`로 확인. `dryRun: true`는 실제 전송 성공과 구분
- 오류는 종료 코드 `1`. PR 생성 성공과 알림 실패를 구분하여 보고

## 전송 기준과 실패 처리

- 요청 식별자별 알림 상태를 PR·댓글과 별도 기록. PR·일부 댓글 성공으로 알림을 완료 처리하지 않고 최초 오류도 보존
- 전송 응답 유실은 전달 여부 미확인으로 기록. GitHub API의 원격 조회 후 제한 재시도를 Webhook에 그대로 적용하지 않으며 수신 확인 없이 자동 재전송하지 않음
- 부분 전달 복구는 미전달 대상부터 진행. 알림이 미확인이면 수신 확인과 수동 재전송 판단을 남기고 전체 완료 처리를 보류


- Discord는 `wait=true`로 전송 확인 응답을 요청하고 메시지 ID를 확인. 자동 멘션은 비활성화
- Slack은 HTTP 200과 `ok` 응답을 확인. 본문의 명시적 멘션은 서비스에서 해석될 수 있으므로 전송 전 확인
- 스크립트의 본문 제한은 Discord 2,000자, Slack 4,000자(JavaScript 문자열 길이 기준). 초과하면 실패하며 임의로 자르거나 여러 번 나누어 보내지 않음
- 길이를 줄일 때 저장소·PR 식별 정보와 검증 상태는 유지하고 변경·리뷰 항목은 핵심 내용으로 정리. 상세 내용은 PR 본문에서 확인할 수 있도록 작성
- 기본 제한 시간은 10초. `--timeout-ms`로 1~60,000ms 사이 정수 지정 가능
- HTTP 오류, 429 요청 제한, 시간 초과는 자동 재시도하지 않음. 응답을 받지 못해도 메시지가 전달되었을 수 있으므로 채널 수신 여부와 서비스의 대기 시간을 확인한 뒤 재전송
- 공식 서비스의 HTTPS Webhook만 허용하고 리다이렉트를 따라가지 않음. 오류 응답 본문이나 URL을 로그에 출력하지 않음

API·서식 기준: [Discord Execute Webhook](https://discord.com/developers/docs/resources/webhook#execute-webhook), [Discord Markdown](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline), [Slack Incoming Webhooks](https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/), [Slack 메시지 서식](https://docs.slack.dev/messaging/formatting-message-text/).
