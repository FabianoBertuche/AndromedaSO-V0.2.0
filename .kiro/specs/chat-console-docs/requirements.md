# Requirements — Chat Console Documentation Registration

## Problem

The repository already delivered the separated chat behavior and its backend prerequisite, but that delivered state is not yet formally registered in the documentation layer.

The current documented truth should now reflect only the behavior that is already working:

- `Models` remains the provider/model management console.
- Chat is a separate page entry via `?tab=chat`.
- The backend exposes `POST /api/providers/chat` as the chat endpoint used by the frontend.

This spec exists only to register that delivered state concisely and accurately.

## Goal

Add a docs-only spec that updates the repository documentation so contributors can quickly understand:

1. that Models and Chat are separate surfaces,
2. that chat depends on the existing backend endpoint `POST /api/providers/chat`, and
3. how to use the feature locally at a high level, including the frontend restart caveat.

## Scope

This spec covers Markdown documentation changes only.

## Out of Scope

- Any frontend or backend code changes
- Any new API behavior or contract changes
- Deep user manual content beyond a short local usage flow
- Documentation of features not present in the delivered implementation, including:
  - streaming,
  - persistence,
  - multi-chat/session management,
  - tools/tool-calling,
  - attachments/files,
  - voice or multimodal behavior

## Functional Requirements

### FR1: Register the delivered chat/backend feature in the implemented-features index
- The implementation MUST update `docs/implemented-features.md`.
- The entry MUST register this as a delivered documentation update tied to `.kiro/specs/chat-console-docs/`.
- The entry MUST state at a high level that the backend provides `POST /api/providers/chat`.
- The entry MUST state that `Models` remains the provider/model management console and chat is available separately via `?tab=chat`.
- The entry MUST stay concise and describe only delivered behavior.

### FR2: Register the local usage flow in the local development guide
- The implementation MUST update `docs/local-dev.md`.
- The update MUST briefly explain the local usage flow for the delivered feature.
- The flow MUST mention, at minimum:
  1. start the kernel,
  2. start the frontend,
  3. use `?tab=models` for provider/model management,
  4. use `?tab=chat` for chat testing.
- The update MUST mention that chat uses the backend endpoint `POST /api/providers/chat` at a high level.

### FR3: Document the frontend/backend separation clearly
- The documentation MUST make clear that `Models` and `Chat` are different surfaces with different purposes.
- The documentation MUST avoid language that suggests chat replaced the Models console.
- The documentation MUST avoid language that suggests provider management happens inside the chat page.

### FR4: Register the local-development caveat
- The documentation MUST mention that the frontend API auto-target is resolved at startup.
- The documentation MUST mention that the frontend may need a restart after backend URL/availability changes during development.
- The caveat MUST be documented briefly, not as a long troubleshooting guide.

### FR5: Keep the scope documentation-only and narrow
- The implementation MUST modify only Markdown documentation files.
- The implementation MUST document only the delivered state already confirmed by the user as working.
- The implementation MUST NOT document speculative or future chat capabilities.

## Non-Functional Requirements

### NFR1: Correct repository placement
- The design MUST name the exact files to update or create.
- The implementation MUST use existing repository documentation locations.

### NFR2: Concision
- The resulting documentation MUST be concise.
- The resulting documentation MUST prefer high-level behavior over deep protocol details.

### NFR3: Accuracy
- The documentation MUST align with the delivered behavior already established by:
  - `.kiro/specs/backend-model-chat-endpoint/`
  - `.kiro/specs/frontend-chat-separate-page/`
- If current repository behavior appears inconsistent with those delivered specs, implementation MUST stop and request clarification instead of inventing new wording.

## Acceptance Criteria

1. `docs/implemented-features.md` records that chat is separate from Models and references `POST /api/providers/chat` at a high level.
2. `docs/local-dev.md` briefly explains how to use `?tab=models` and `?tab=chat` locally.
3. `docs/local-dev.md` includes the startup caveat that frontend API auto-targeting is resolved when the frontend starts and may require restart after backend changes.
4. No out-of-scope chat capabilities are documented.
5. No non-Markdown files are changed.
