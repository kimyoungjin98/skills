---
name: project-planning-manager
description: Maintain this repository's planning and product documents in docs. Use when the user asks to organize, summarize, formalize, update, or reconcile planning notes, feature ideas, requirements, PRDs, domain feature needs, or business context for this project.
---

# Project Planning Manager

## Workflow

1. Discover planning context before writing:
   - Read relevant `docs/**`, `README*`, issue templates, `.agents/**`, `.codex/**`, domain docs, ADRs, existing PRDs, and nearby implementation only when it clarifies current product behavior.
   - Also check Codex history sources such as `/home/user/.codex/log`, `/home/user/.codex/logs_2.sqlite`, and `/home/user/.codex/memories/rollout_summaries/**` when they can clarify prior product decisions or planning context.
   - Prefer `rg --files` and targeted `rg` searches for terms such as `prd`, `planning`, `requirement`, `scope`, `user story`, `flow`, `acceptance`, `decision`, `question`, `todo`, `roadmap`, `feature`, and project-specific domain terms.
   - Keep `docs/client-rule.md` and `docs/server-rule.md` as implementation policy inputs, not product-planning sources, unless the plan explicitly changes implementation rules.

2. Separate planning content from policy and implementation:
   - Capture only durable product-planning essentials: goals, requirements, and domain-by-domain needed features.
   - Do not add MVP scope, implementation notes, current implementation notes, retrospective notes, roadmap notes, acceptance criteria, open questions, or decision logs unless the user explicitly asks for that document shape.
   - Exclude low-level code explanations, transient debug notes, command output, Codex log chatter, and implementation details that do not affect product behavior.
   - Do not invent requirements. If a requirement is inferred from code, screenshots, or behavior, label it as an inference or ask before treating it as decided.

3. Choose the document shape:
   - Update an existing planning doc before creating a new one.
   - Use `docs/` as the default location when no stronger repository convention exists.
   - Prefer names such as `docs/prd-<feature>.md` or `docs/planning-<feature>.md`.
   - Keep planning docs separate from policy docs such as `docs/client-rule.md` and `docs/server-rule.md`.
   - Length alone is not a mandatory split rule. If a markdown file becomes hard to scan, split only when there is a clear domain or product boundary.
   - Use roughly 200 lines or 6+ domain sections as a review trigger, not as an automatic split threshold.
   - When splitting, keep the parent planning doc as a concise index with shared `목표` and cross-domain `요구사항`, then move each large domain section into `docs/planning-<domain>.md`.
   - Split by product domain, not by template heading. Do not create separate files just for `목표`, `요구사항`, or `도메인별 필요 기능`.
   - Each split domain document must still use the same compact shape: `목표`, `요구사항`, `도메인별 필요 기능`.
   - Keep only requirements that are shared across multiple domains in the parent document; domain-specific requirements belong in the domain document.

4. Normalize ambiguous notes:
   - Convert rough ideas into explicit goals, requirements, and domain feature needs.
   - Preserve unresolved ambiguity only when the user asks for questions to be tracked.
   - Express prohibitions and scope boundaries as requirements instead of separate `Out of Scope` sections unless requested.

5. Write concise docs for future implementation:
   - Preserve the repository's primary language and terminology. If nearby planning docs are Korean, continue in Korean.
   - Prefer product-facing language over technical jargon.
   - Include concrete actors, workflows, states, permissions, data concepts, and expected outcomes when relevant.
   - Avoid file paths and code snippets unless the planning decision is explicitly about a technical boundary.
   - Use a compact default shape: `목표`, `요구사항`, `도메인별 필요 기능`.

6. Validate the result:
   - Re-read the edited docs against the gathered planning sources.
   - Check that requirements and domain feature needs are not mixed with notes, MVP plans, or implementation status.
   - If a planning doc crosses the length review trigger, check whether domain splitting would improve scanability without duplicating requirements.
   - Verify that implementation policies remain in policy docs, while planning requirements remain in planning docs.
   - Report changed files and source inputs used.

## Document Templates

Use the smallest template that fits the request.

### Feature Planning

```markdown
# <Feature Name>

## 목표

## 요구사항

## 도메인별 필요 기능
```
