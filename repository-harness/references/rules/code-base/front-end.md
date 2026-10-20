<!-- Generated from docs/code-base/front-end.md by scripts/build_skill.py. Edit the source document. -->

# Frontend

## 스타일링

- [디자인시스템](./design-system.md)
- `TailwindCss v4` 사용
- 기존 컴포넌트/디자인 시스템을 우선 사용하고, 없을 경우 [디자인시스템](./design-system.md)의 결정 기준 적용
- 섹션·카드·반복 항목 사이의 간격은 margin 또는 padding으로 만들지 않고, 부모 `flex` 또는 `grid` 레이아웃의 `gap`으로 관리한다.
- margin과 padding은 각각 레이아웃의 외부 여백과 컴포넌트 내부 여백에만 사용한다.

### Tailwindcss 사용

- spacing과 radius는 Tailwind 기본 유틸리티를 사용한다.
- `bg-[#ffff]`, `text-[#...]`, `border-[#...]`, `p-[12px]`처럼 색상·간격·radius를 임의값(`[...]`) 유틸리티로 지정하는 패턴은 사용하지 않는다.

## React

### API Fetch

- 공통 fetch hooks 또는 함수를 만들어서 재사용
- `React`의 경우 `Tanstack Query`를 사용

### 상태 관리

- `Zustand`를 사용하여 전역 상태 관리
- `Zustand` + `context provider`를 사용하여 컴포넌트 내부 상태 관리 제작 가능

### 파일 구조

- `도메인` 폴더 안에 `components`, `page(list, form, detail.. 등)`, `dialog(modal)` 구성
- `store` , `hooks`는 따로 분리

### Form

- `Tanstack Form` 사용
- `submit`시에 중복 제출을 막고 loading 또는 disabled 상태 표시
- Validation(유효성 검증)은 필수
- 유효성 검증 후 에러 메세지를 사용자에게 표출해야함

## Angular, Vue

- 기존 프로젝트의 프레임워크와 도구를 유지
- 신규 구성에 필요한 기술 선택이 정해지지 않았을 경우 사용자 요청과 프로젝트 요구사항을 확인한 뒤 결정
