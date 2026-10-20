<!-- Generated from docs/code-base/design-system.md by scripts/build_skill.py. Edit the source document. -->

# 디자인 시스템

## 개요

- 모노레포에 프론트엔드 프로젝트가 있거나 단일 프로젝트인데 프론트엔드 프로젝트일 경우에 필요
- 기존 디자인 시스템이 있으면 해당 규칙과 컴포넌트를 우선 사용
- 기존 디자인 시스템이 없고 사용자가 화면 제작이나 직접 구성을 요청한 경우 에이전트가 구성하고 선택 근거를 기록
- 사용자 요청과 기존 화면으로 결정할 수 없는 브랜드나 디자인 요구사항이 있을 경우 필요한 항목을 모아서 확인

## 규칙

- 타이포그래피(Typography)
- 컬러(Color)
- 크기(Size)
- 둥글기(Rounded)
- 그림자(Shadow)
- 레이아웃(Layout)

## 공통

- 규칙을 참조하여 디자인 시스템 지정
- (React에서 직접 구현일 경우) `shadcn`, `radix-ui` 컴포넌트를 기본 후보로 사용. 다른 프레임워크는 해당 환경에 맞는 컴포넌트 사용
