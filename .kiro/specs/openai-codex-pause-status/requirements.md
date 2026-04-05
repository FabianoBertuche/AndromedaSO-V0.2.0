# Requirements: OpenAI Codex Pause Status Documentation Updates

## Problem

The repository already documents and implements a manual `openai-codex` authentication flow. That work should remain documented as the current implemented state of the repo.

However, this line of work is being paused for now.

The current docs do not yet formally communicate a clear pause/defer status, the practical blocker behind that pause, or a concise reminder of where future work should resume. Without that clarification, future readers may incorrectly assume this is still an active track or may restart the effort without first revisiting the implemented manual-flow spec, current support/status docs, and the unresolved auth-model problem.

## Goal

Create a documentation-only spec that updates the repository documentation so it clearly states that OpenAI Codex work is paused/deferred for now, while preserving the record of what is already implemented and leaving a precise reminder for future return.

## Scope

This spec covers Markdown documentation updates only.

## Out of Scope

- Any backend, frontend, provider, OAuth, routing, or persistence code changes
- Any config, environment, Docker, dependency, or package changes
- Any test changes
- Any rewrite, deletion, or falsification of historical implementation claims
- Any redesign or implementation of a new authentication model

## Functional Requirements

### FR1: Documentation-only scope must be explicit
- The implementation MUST change only Markdown documentation/spec/reference files.
- The updated docs MUST explicitly state that this is a pause/defer documentation update only.
- The spec MUST forbid code, config, and test changes.

### FR2: Current implemented state must remain accurately documented
- The updated docs MUST preserve the fact that the repository currently contains an implemented manual `openai-codex` flow.
- The docs MUST NOT remove or contradict existing implementation claims.
- The docs MUST continue to distinguish between what is already implemented and what is not.

### FR3: Pause/defer status must be clear and discoverable
- The docs/reference layer MUST clearly state that OpenAI Codex work is currently **paused** or **deferred**.
- The pause/defer wording MUST be easy to find in the canonical status/reference material.
- The docs MUST make clear that this pause applies to further progress on this line of work, not to the existence of the already implemented/manual flow.

### FR4: Practical blocker must be documented honestly
- The docs MUST explain that the work is paused pending a future redesign and/or investigation of a viable authentication/client model.
- The docs MUST state that the unresolved blocker is the lack of a practical auth model that does not rely on impractical assumptions.
- The docs MUST avoid pretending that the current blocker is resolved.
- The docs MUST avoid promising a timeline for resumption.

### FR5: Future-return reminder must be explicit
- The updated docs MUST leave a concise reminder of where future work should resume.
- That reminder MUST point future readers to:
  1. `.kiro/specs/openai-codex-manual-auth-flow/`,
  2. `docs/suporte/openai-codex-setup.md`,
  3. `docs/suporte/openai-codex-auth-status.md`, and
  4. the unresolved need to obtain or validate a viable client/auth model.
- The reminder MUST be written so a future maintainer can quickly recover the current state before restarting the effort.

### FR6: Existing docs must be updated in place using current structure
- The implementation MUST prefer the existing docs structure under `docs/suporte/` and the existing repository index/reference docs.
- The design MUST name the exact documentation files to update.
- At least one existing support/reference document MUST act as the canonical pause/defer status note.

### FR7: Status and reference docs must separate four ideas
- The updated docs MUST clearly separate:
  1. what is implemented today,
  2. what is paused/deferred,
  3. what practical blocker remains unresolved, and
  4. where to resume later.
- The docs MUST keep this distinction concise enough for support and future maintainers.

## Non-Functional Requirements

### NFR1: Terminology accuracy
- The docs MUST use precise wording for:
  - “implemented today,”
  - “paused/deferred,”
  - “practical blocker,” and
  - “future-return reminder.”
- The docs MUST avoid overstating feasibility or readiness.

### NFR2: Consistency with current documentation style
- The updates MUST fit the current repository docs structure and cross-reference style.
- End-user/support-facing documentation updates SHOULD be written in Portuguese to match nearby support docs.
- Spec content may remain in English, consistent with other Kiro specs in the repo.

### NFR3: Task quality
- `tasks.md` MUST contain ordered, actionable tasks.
- All tasks MUST start unchecked.
- Tasks MUST reflect a documentation-only execution sequence.

## Acceptance Criteria

1. A docs-only spec exists under `.kiro/specs/openai-codex-pause-status/`.
2. The spec requires no code, config, or test changes.
3. The spec preserves the record that a manual `openai-codex` flow is already implemented/documented.
4. The spec requires current docs to state that further OpenAI Codex work is paused/deferred.
5. The spec requires current docs to describe the unresolved practical blocker around a viable client/auth model.
6. The spec requires current docs to leave a concise reminder of where future work should resume.
7. The design names the exact documentation/reference files to update.
8. The tasks are ordered and begin unchecked.
