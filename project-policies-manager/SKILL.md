---
name: project-policies-manager
description: Maintain this repository's project policies in docs. Use when the user asks to collect, organize, formalize, update, clarify, or reconcile project rules, coding conventions, team policies, architecture decisions, operational rules, AGENTS.md instructions, or scattered repository guidance into docs for this project.
---

# Project Policies Manager

## Workflow

1. Discover authoritative policy sources before editing:
   - Read `AGENTS.md`, `.agents/**`, `.codex/**`, `CONTRIBUTING*`, `README*`, existing `docs/**`, issue templates, and package-level rule files when present.
   - Also check Codex history sources such as `/home/user/.codex/log`, `/home/user/.codex/logs_2.sqlite`, and `/home/user/.codex/memories/rollout_summaries/**` when they can clarify prior repository rules, workflow decisions, or repeated user instructions.
   - Inspect nearby configuration only to infer explicit policies that are already enforced, such as lint, formatter, test, build, framework, package manager, or deployment conventions.
   - Prefer `rg --files` and targeted `rg` searches for terms such as `rule`, `policy`, `convention`, `guideline`, `architecture`, `ADR`, `client`, `server`, `frontend`, `backend`, `deploy`, and `test`.

2. Separate policy from implementation detail:
   - Capture durable rules, precedence, naming conventions, ownership boundaries, workflow expectations, validation requirements, and architectural decisions.
   - For this repository, organize durable rules against the "Repository Policy Coverage" section before writing docs.
   - Exclude transient task notes, one-off bug context, command output, Codex log chatter, backlog items, and low-level implementation explanations unless they define a repeatable rule.
   - Do not invent policies. If a policy is an inference from config or code, mark it as an inference or ask before making it normative.
   - Exception: when the repository has no markdown policy docs comparable to `docs/project-rule.md`, `docs/client-rule.md`, or `docs/server-rule.md`, create a minimal default policy seed from the "Default Policy Seed" section below. Treat it as a starting policy, not as an inferred project convention.

3. Choose the smallest docs change that makes the policy findable:
   - Update existing policy docs before creating new files.
   - Use `docs/` as the default location when no stronger repository convention exists.
   - Prefer a small set of clear files such as `docs/client-rule.md`, `docs/server-rule.md`, `docs/project-rule.md`, `docs/architecture-rule.md`, or `docs/workflow-rule.md`.
   - Do not create README-style companion docs, quick references, or changelogs for policy output unless the repository already uses them for policies.

4. Resolve conflicts explicitly:
   - Preserve declared precedence from files such as `AGENTS.md`.
   - When two policies conflict, document the higher-priority rule and mention the superseded source only if it helps future maintainers.
   - Ask the user when precedence cannot be discovered and the conflict changes behavior.

5. Write policy docs for agents and maintainers:
   - Use concise imperative rules.
   - Keep headings domain-oriented: `Common`, `Client`, `Server`, `DTO`, `Testing`, `Deployment`, `Architecture`, `Docs`, or similar.
   - In this repository, prefer Korean headings and Korean imperative bullets because the authoritative policy docs are Korean.
   - Preserve the repository's primary language and terminology. If existing policy docs are Korean, continue in Korean.
   - Include concrete file paths, package names, command names, and allowed method names when they are part of the rule.
   - Avoid generic best practices that are not specific to the project.

6. Validate the result:
   - Re-read the edited docs against the discovered sources.
   - Check that new rules are not duplicated across files unless precedence requires it.
   - Run formatting or docs checks when the repository provides them.
   - Report the files changed, the source policy inputs used, and any unresolved ambiguity.

## 작업 원칙

- 기본적으로 메인 에이전트가 혼자 끝까지 작업한다.
- 하위 에이전트는 작업이 명확히 분리되고 실제로 시간이나 정확도에 큰 도움이 될 때만 사용한다.
- 같은 코드 검토나 테스트를 여러 에이전트에게 중복시키지 않는다.
- 요청한 문제만 최소한으로 수정하고 관련 테스트를 실행한다.
- 큰 변경일 때만 마지막에 전체 테스트를 한 번 실행한다.
- 완료 후 필요한 문서 갱신과 커밋까지 처리한다.

## Output Shape

For each policy doc, prefer this shape:

```markdown
# <Domain> Rule

## <Policy Group>

- <Imperative project-specific rule>
- <Imperative project-specific rule>
```

Add a short precedence section only when multiple sources define ordering. Add source notes only when they prevent ambiguity; avoid turning policy docs into audit logs.

## Repository Policy Coverage

When updating this repository's policy docs, classify the rules into the smallest useful set of these buckets. Do not force every bucket into a separate file; use `docs/project-rule.md`, `docs/client-rule.md`, and `docs/server-rule.md` unless a stronger convention already exists.

Required buckets requested for this repository:

- `폴더 구조`: module, route-local, package, and shared folder ownership; allowed depth; when a folder is justified.
- `DTO, 타입 정책`: shared contracts, server DTOs, client-only view models, generated types, and naming rules.
- `Client: Form 정책`: form state library, validation location, field component structure, submit/reset/error/loading behavior.
- `Server: 모듈 분리 정책`: NestJS module ownership, provider/controller/service boundaries, when to create submodules.
- `Client: Dialog 정책`: dialog ownership, root/content split rules, confirmation dialogs, state and submit flow placement.
- `Client: 컴포넌트 정책`: page-local vs shared components, single-use components, UI primitive reuse, naming and import policy.
- `Client: API 호출 정책`: generated client usage, react-query ownership, API fetch wrapper, request/response type source of truth.
- `Server: CRUD 파일 이름 / 순서 정책`: CRUD method names, file names, controller route order, service/repository operation order.
- `Server: Service 분리 정책`: service responsibility, utility extraction limits, transaction boundaries, repository/prisma access placement.
- `Client: 디자인 시스템 정책`: `DESIGN.md`, `packages/ui`, tokens, allowed variants, color/style limits, responsive and accessibility expectations.

Recommended additional buckets to consider when the sources support them:

- `검증/테스트 정책`: required lint, typecheck, build, unit/e2e, generated-client validation commands, and when each command is mandatory.
- `상태 관리 정책`: local state vs Zustand/global state, reset/lifetime ownership, query cache vs client store boundaries.
- `에러/로딩/빈 상태 정책`: client-visible error handling, disabled/loading states, empty states, toast/alert usage, retry expectations.
- `보안/환경 정책`: environment variables, secrets, CORS, auth/session handling, rate limits, and deployment assumptions.
- `생성물 정책`: files that must not be hand-edited, generation commands, and follow-up docs/OpenAPI/client generation steps.
- `네이밍/Import 정책`: file naming, barrel files, path aliases, domain prefixes, public import boundaries, and index export rules.
- `문서/기획 분리 정책`: implementation rules stay in policy docs; product requirements stay under `docs/plan/**`.

Use these buckets as a coverage checklist, not as generic advice. If a requested bucket is not yet defined by the user or by authoritative sources, document it as `정의 필요` only when the user asked for a gap list; otherwise ask before making it normative.

## Default Policy Seed

Use this seed only when no durable markdown policy docs exist. Keep it framework- and library-independent, then adapt file names and package paths to the repository after inspecting its structure.

Recommended file split:

- Put cross-cutting rules in `docs/project-rule.md`.
- Put user-interface or client-application rules in `docs/client-rule.md` only when the repository has a client surface.
- Put API, worker, persistence, or backend rules in `docs/server-rule.md` only when the repository has a server surface.
- If the repository has neither a clear client nor server split, keep the seed in `docs/project-rule.md` and avoid creating empty companion files.

Baseline common rules:

- Keep code short, direct, and simple.
- Treat file size as a review signal, not as an automatic split rule.
- Split a file only when the new file has a clear responsibility, owner, and name.
- Keep cohesive code together when it belongs to one domain, one screen, one command, or one flow.
- Do not create files that contain only a single mapper, validator, constant, type alias, or wrapper unless that artifact is reused across multiple owners and has an explicit responsibility.
- Create subfolders only when they contain several meaningful files and the folder name explains a real responsibility.
- Avoid deep folder nesting for small parts, helpers, options, fields, controls, rows, or fragments.
- Keep generated artifacts, hand-written code, domain code, and infrastructure adapters visibly separated.
- Put repeated project commands, required validation steps, and environment assumptions in policy docs when they are discoverable.

Baseline architecture rules:

- Define ownership boundaries before adding files: shared code, application code, domain logic, infrastructure adapters, and generated artifacts must have clear homes.
- Keep domain logic independent from transport, persistence, UI, and third-party SDK details where practical.
- Put cross-boundary request, response, event, or command shapes in a shared contract location when multiple runtime surfaces use them.
- Do not duplicate cross-boundary types separately in client and server code; define one source of truth and adapt at the edges.
- Keep framework, database, network, and vendor-specific code at the outer edges of a module.
- Prefer shallow module structure. Create a folder only when it groups several meaningful files under a clear responsibility.
- Split files by responsibility and reading flow, not by arbitrary size thresholds.
- Avoid single-function helper files unless the helper is reused across multiple owners and has a stable name.
- Keep generated files out of hand edits; document the command that regenerates them when discoverable.
- Keep configuration, secrets, and environment assumptions explicit. Do not hard-code deployment-specific values in domain logic.
- Validate external input at system boundaries and keep internal domain code working with normalized data.
- Run the repository's existing lint, type, test, build, or formatting checks after policy-impacting changes when those commands are discoverable.

Baseline utility-function rules:

- Avoid extracting utility functions by default.
- Consider a utility function only when the same logic appears at least twice or when naming the operation clarifies a real domain concept.
- Do not extract a utility if it makes the caller harder to read by hiding simple conditionals, simple assignments, one-line aliases, or direct API calls.
- Keep one-off logic in the file or module that uses it.
- Keep route-, screen-, command-, or use-case-specific helpers local to that owner instead of moving them to a shared utility area.
- Create shared utility modules only for stable behavior used by multiple owners.
- Name shared utilities after the domain operation they perform, not after vague categories such as `helpers`, `utils`, `common`, or `misc` when a clearer name is available.
- Do not create single-function utility files unless the function is reused across multiple owners and has a stable, explicit responsibility.
- Keep utility functions free of hidden framework, network, persistence, UI, or environment side effects unless the utility's name and owning module make that boundary explicit.
- Prefer small pure functions for shared utilities, with inputs and outputs visible in the signature.

Baseline CRUD rules:

- Use stable CRUD operation names across a domain when the repository has no stronger convention.
- Prefer this CRUD method order for service, repository, handler, or equivalent domain APIs: `search`, `findAll`, `findById`, `create`, `update`, `remove`.
- Use `search` for filtered or paginated list retrieval.
- Use `findAll` for unfiltered collection retrieval.
- Use `findById` for single-resource lookup by identifier.
- Use `create`, `update`, and `remove` for state-changing operations.
- Keep create, update, and remove operations transaction-safe when they change multiple records, files, messages, or external resources that must stay consistent.
- Avoid mixing read, write, mapping, validation, and persistence concerns in one operation when the boundaries are already clear in the codebase.

Baseline operation-order rules:

- Keep public operation declarations in a stable order so files are easy to scan.
- For HTTP-like APIs, prefer this route or controller order: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`.
- Within the same operation group, keep list/search operations before single-resource lookup, then create, update, and remove.
- Keep private helper functions below the public operation that uses them unless the repository has an established file-order convention.

Baseline client rules:

- Keep screen or page code organized around one user flow.
- Keep data preparation, state handling, event handlers, and rendering in a top-to-bottom reading order.
- Split screen code only when a section has a clear role such as data loading, state management, repeated UI, form handling, table configuration, or API interaction.
- Keep screen-specific types, state, options, and request-building logic near the screen that owns them.
- Move components to a shared component area only when multiple screens actually reuse them.
- Keep small single-use UI pieces inside the parent screen or component instead of creating separate files.
- Create client subfolders only for clear owners such as components, data, hooks, state, styles, or utilities, and avoid deep nesting for small parts.
- Keep UI state local unless multiple screens or distant components need the same state.
- Use shared state only when ownership, lifetime, and reset behavior are clear.
- Keep server communication behind a small, consistent API or data-access layer when the repository has one.
- Use shared contracts for server request and response types; do not redeclare server DTOs as separate client-only types.
- Keep screen-only view models or UI state types local to the client owner.
- Do not hand-edit generated API clients or generated type files.
- Prefer the repository's design system, shared UI package, tokens, and existing component patterns before adding new UI primitives.
- Keep visual variants small and consistent. Avoid adding many semantic color or style variants unless the design system already defines them.
- Put modal, dialog, drawer, or overlay ownership in a dedicated component when it has its own state, validation, or submit flow.
- Keep client validation close to the form or boundary where user input enters the system.
- Keep accessibility-relevant labels, focus behavior, disabled states, loading states, and error states explicit in interactive UI.
- Check responsive layout when changing user-facing screens.

Baseline DTO and contract rules:

- Define request, response, event, command, or message shapes explicitly at system boundaries.
- Separate read/query DTOs from create/update DTOs when their fields or validation rules differ.
- For resource-oriented domains, keep at least one read DTO and one create/update DTO when the domain exposes both read and write operations.
- Keep other-purpose DTOs, such as bulk actions, imports, exports, auth payloads, or webhook payloads, named after their use case.
- Keep boundary validation and transformation rules attached to boundary DTOs or boundary adapters, not hidden in domain logic.
- When multiple runtime surfaces share a boundary shape, define the shared contract in one dependency-light location and have surface-specific DTOs adapt to it.
- Keep shared contracts free of UI framework, server framework, database, transport, and validation-library dependencies.
- Update generated API clients, schemas, or documentation whenever DTO changes alter the public boundary, using the repository's discovered generation command.
- Do not hand-edit generated API clients, generated schemas, or generated documentation unless the repository explicitly requires it.
