<!-- Generated from docs/code-base/back-end.md by scripts/build_skill.py. Edit the source document. -->

# Backend

## Stack

- Typescript의 경우 `Nestjs`
- Python의 경우 `FastAPI`

## DB

- 기본 DB는 `PostgreSQL` 사용 (사용자의 요청 시 변경이 가능)
- TypeScript의 신규 구성은 ORM으로 `Prisma`를 사용 (사용자의 요청 시 변경이 가능)
- Python은 기존 ORM과 마이그레이션 도구를 우선 사용. 신규 구성은 프로젝트 요구사항에 맞게 선택하고 선택 근거를 기록

## CRUD

### Method 순서

- search : 필터 또는 페이지네이션 목록 검색
- searchCursor : 필터 또는 페이지네이션 목록 검색(Cursor 기준)
- findAll : 모든 목록 검색 (필터링 고려)
- findById : 단일 리소스 조회
- create : 등록 작업
- update : 수정 작업
- remove(delete) : 삭제 작업

### HTTP Method 순서

- GET
- POST
- PUT
- PATCH
- DELETE
