# Requirements: OpenAI Codex Manual Flow Documentation Updates

## Problem

The repository currently contains OpenAI Codex support and reference material that can be read as if the existing browser-based sign-in flow were generally equivalent to the experience used by openclaw/opencode or by the official Codex guidance.

That is no longer the conclusion we want the repository to communicate.

Today, the implemented repo behavior is still a **BYO web OAuth client** flow that depends on `OPENAI_CODEX_WEB_CLIENT_ID`. This is useful as the current implementation state, but it is **not** the desired long-term UX. The next planned direction is a **manual link/copy-return flow** for headless/CLI-style usage, inspired by official Codex guidance.

The documentation layer must make these distinctions easy to discover before any implementation work starts on the new manual flow.

## Goal

Create a documentation-only spec that updates the repository’s current docs/reference layer so readers can clearly distinguish:

1. the **current implemented behavior**,
2. the **current limitation**, and
3. the **planned next direction**.

## Scope

This spec covers Markdown documentation and reference updates only.

## Out of Scope

- Any backend, frontend, OAuth, routing, or provider code changes
- Any new manual login flow implementation
- Any API contract changes
- Any environment or `.env.example` changes
- Any attempt to rewrite or delete historical specs

## Functional Requirements

### FR1: Documentation-only scope must be explicit
- The implementation MUST change only Markdown documentation/spec/reference files.
- The updated docs MUST explicitly state that the new manual link/copy-return flow is a **planned next step**, not already implemented.
- The updated docs MUST NOT describe any unimplemented manual/headless flow as available in the current product.

### FR2: Current implemented behavior must be documented accurately
- Current-user-facing documentation for OpenAI Codex MUST state that the repo’s present implementation uses a **BYO web OAuth client** setup.
- The current behavior MUST continue to mention the existing requirement for `OPENAI_CODEX_WEB_CLIENT_ID` where setup guidance is discussed.
- The docs MUST describe the current flow as the repository’s implemented behavior, not as the desired end-state UX.

### FR3: Current limitation must be easy to find
- The docs/reference layer MUST clearly explain that the current browser/web flow is **not generally equivalent** to the openclaw/opencode experience.
- The docs MUST explain that requiring a BYO web OAuth client is a current limitation of this repo.
- The docs MUST avoid wording that implies “one-click web OAuth” in this repository already matches the official Codex CLI/headless approach.

### FR4: Planned next direction must be introduced clearly
- The docs MUST introduce the new intended direction as a **manual link/copy-return** authentication flow.
- The docs MUST characterize that direction as **headless/CLI-style** and **inspired by official Codex guidance**.
- The docs MUST explain, in current-reference wording, that this is the next documentation/implementation direction after the present BYO web-client behavior.
- The docs MUST not promise delivery dates or imply implementation completeness.

### FR5: Discoverability must separate current state vs future direction
- The implementation MUST update existing discoverability/reference docs so a reader can quickly identify:
  1. what is implemented now,
  2. why it is limited,
  3. what direction is planned next.
- At least one support/reference document MUST act as the canonical status note for this distinction.
- Existing support/setup docs MUST point to that status note rather than duplicating all context everywhere.

### FR6: Conflicting historical references must be contextualized
- The implementation MUST address conflicting references already present in the repo, including the historical hardcoded-client spec in `.kiro/specs/openai-codex-hardcoded-client/`.
- The implementation MUST NOT rewrite, delete, or falsify historical material.
- Instead, current docs/reference material MUST add clear **superseded / historical / not-current-direction** context where appropriate.
- Readers landing in current docs MUST understand that the hardcoded-client path is not the active documentation conclusion.

### FR7: Existing support docs must be updated in place
- The implementation MUST prefer the repository’s existing docs structure under `docs/` and `docs/suporte/`.
- The design MUST name the exact documentation/spec/reference files to create or update.
- The update set MUST include current support docs and discoverability/reference docs.
- A new support/reference note MAY be added if needed to centralize the status/limitations/next-direction explanation.

## Non-Functional Requirements

### NFR1: Terminology accuracy
- The docs MUST use precise wording for:
  - “current implemented behavior,”
  - “current limitation,”
  - “planned next direction.”
- The docs MUST avoid overstating equivalence with external tools or official flows.

### NFR2: Consistency with repository structure
- The documentation updates MUST fit the current repository structure and cross-reference style.
- New content intended for end users or support readers SHOULD be written in Portuguese to match nearby support docs.
- Spec content may remain in English, consistent with other Kiro specs in the repo.

### NFR3: Task quality
- `tasks.md` MUST contain ordered, actionable tasks.
- All tasks MUST start unchecked.
- Tasks MUST reflect a documentation-only implementation sequence.

## Acceptance Criteria

1. A docs-only spec exists under `.kiro/specs/openai-codex-manual-flow-docs/`.
2. The spec requires no application code changes.
3. The spec requires current docs to state that the implemented repo behavior is BYO web OAuth client setup.
4. The spec requires current docs to state that this is not the desired long-term UX.
5. The spec requires current docs to introduce the planned manual link/copy-return direction as a next step, not an implemented feature.
6. The spec requires discoverability docs to distinguish current behavior, current limitation, and planned next direction.
7. The spec requires contextual handling of the historical hardcoded-client spec without rewriting history.
8. The design names the exact documentation files to create/update.
9. The tasks are ordered and begin unchecked.
