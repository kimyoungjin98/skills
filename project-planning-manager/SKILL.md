---
name: project-planning-manager
description: Maintain this repository's domain-centered planning and product documents in docs. Use when the user asks to organize, summarize, formalize, update, or reconcile planning notes, feature ideas, requirements, PRDs, domain feature needs, product policies, or business context for this project.
---

# Project Planning Manager

## Workflow

1. Discover planning context before writing:
   - Read relevant `docs/**`, `README*`, issue templates, `.agents/**`, `.codex/**`, domain docs, ADRs, existing PRDs, and nearby implementation only when it clarifies current product behavior.
   - Also check Codex history sources such as `/home/user/.codex/log`, `/home/user/.codex/logs_2.sqlite`, and `/home/user/.codex/memories/rollout_summaries/**` when they can clarify prior product decisions or planning context.
   - Prefer `rg --files` and targeted `rg` searches for terms such as `prd`, `planning`, `requirement`, `scope`, `user story`, `flow`, `acceptance`, `decision`, `question`, `todo`, `roadmap`, `feature`, and project-specific domain terms.
   - Keep `docs/client-rule.md` and `docs/server-rule.md` as implementation policy inputs, not product-planning sources, unless the plan explicitly changes implementation rules.

2. Extract core planning domains:
   - Always identify the project's core planning domains before creating or reorganizing planning docs.
   - Start from explicit user-provided domains, then compare them with existing planning docs, shared contracts, database models, top-level product modules, API resources, and repeated product nouns.
   - Prefer durable business/product objects with independent lifecycle, ownership, state, and user-visible meaning.
   - Reject workflow steps, screens, pages, controllers, services, external providers, implementation packages, and transient process stages as standalone domains unless they are also durable product objects.
   - Merge candidates that only describe one lifecycle under different stages. For example, search, planning, generation, review, and upload usually belong under the content domain instead of becoming separate domains.
   - If the repository has `docs/plan/README.md`, use it as the current project-specific domain index and update it when the extracted core domains change.
   - If candidate domains conflict and the right boundary cannot be inferred, document the ambiguity in the response and ask before rewriting domain files.

3. Separate planning content from policy and implementation:
   - Capture only durable product-planning essentials organized by domain: requirements, goals, features, and product policies.
   - Put workflow steps such as search, planning, generation, upload, and review under the owning domain instead of making them separate planning domains.
   - Do not add MVP scope, implementation notes, current implementation notes, retrospective notes, roadmap notes, acceptance criteria, open questions, or decision logs unless the user explicitly asks for that document shape.
   - Exclude low-level code explanations, transient debug notes, command output, Codex log chatter, and implementation details that do not affect product behavior.
   - Do not invent requirements. If a requirement is inferred from code, screenshots, or behavior, label it as an inference or ask before treating it as decided.

4. Choose the document shape:
   - Update an existing planning doc before creating a new one.
   - Use `docs/plan/` as the default location for planning docs when no stronger repository convention exists.
   - Prefer one markdown file per product domain, named `docs/plan/<domain>.md`.
   - Keep `docs/plan/README.md` as a concise index when there are multiple domain docs.
   - Keep planning docs separate from policy docs such as `docs/client-rule.md` and `docs/server-rule.md`.
   - Length alone is not a mandatory split rule. If a markdown file becomes hard to scan, split only when there is a clear domain or product boundary.
   - Use roughly 200 lines or 6+ domain sections as a review trigger, not as an automatic split threshold.
   - When splitting, keep `docs/plan/README.md` as a concise domain index, then move each large domain section into `docs/plan/<domain>.md`.
   - Split by product domain, not by template heading. Do not create separate files just for `요구사항`, `목표`, `기능`, or `정책`.
   - Do not split by workflow step, page, controller, service, API provider, or external integration when those belong to a larger domain.
   - Each split domain document must still use the same domain-centered shape: domain first, then `요구사항`, `목표`, `기능`, `정책`.
   - Keep only cross-domain policies in the parent document; domain-specific requirements, goals, features, and policies belong in the domain document.

5. Normalize ambiguous notes:
   - Convert rough ideas into explicit domain requirements, domain goals, domain features, and domain policies.
   - Preserve unresolved ambiguity only when the user asks for questions to be tracked.
   - Express prohibitions and scope boundaries as domain policies instead of separate `Out of Scope` sections unless requested.

6. Write concise docs for future implementation:
   - Preserve the repository's primary language and terminology. If nearby planning docs are Korean, continue in Korean.
   - Prefer product-facing language over technical jargon.
   - Include concrete actors, workflows, states, permissions, data concepts, and expected outcomes inside the relevant domain.
   - Avoid file paths and code snippets unless the planning decision is explicitly about a technical boundary.
   - Use a domain-centered default shape: each domain file contains `요구사항`, `목표`, `기능`, and `정책`.

7. Validate the result:
   - Re-read the edited docs against the gathered planning sources.
   - Verify that the planning docs are organized around the extracted core domains.
   - Check that each domain contains only requirements, goals, features, and policies, not notes, MVP plans, or implementation status.
   - If a planning doc crosses the length review trigger, check whether domain splitting would improve scanability without duplicating requirements.
   - Verify that implementation policies remain in policy docs, while planning requirements remain in planning docs.
   - Report changed files and source inputs used.

## Document Templates

Use the smallest template that fits the request.

### Feature Planning

```markdown
# <Feature Name>

# <도메인>

## 요구사항

## 목표

## 기능

## 정책
```
