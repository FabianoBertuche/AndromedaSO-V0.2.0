# Requirements — Frontend Chat on Separate Page

## Problem Statement

The current frontend direction is wrong. The implementation replaced the existing `Models` experience (`frontend/src/pages/LlmConnectionConsole.tsx` and the Models tab flow) with a chat-first screen.

The user explicitly rejected that direction. The `Models` area must remain the existing provider/model management console, and chat must live on a separate page entry.

This corrective spec restores the approved separation of concerns:

- `Models` remains the provider/model console.
- Chat becomes a separate frontend page.
- Chat stays narrow in scope and reuses the already-created backend endpoint `POST /api/providers/chat`.

---

## Scope

### In scope

- Restore/preserve the existing Models console behavior
- Add a separate frontend page entry for chat
- Reuse the existing backend chat endpoint
- Keep chat limited to model selection, send message, show responses, in-memory history, loading/error, and clear conversation
- Add/update frontend tests that prove both the restoration and the new separation

### Out of scope

- Backend changes to `POST /api/providers/chat`
- Provider management redesign
- New provider creation/edit/delete/auth flows
- Router, benchmark, or dashboard changes
- Chat persistence, streaming, file upload, tools, images, or voice

---

## Requirements

### Requirement 1: Models page remains the provider/model management console

**User Story:** As an operator, I want the existing Models page to remain the provider/model management console, so I can continue managing connections and models without being forced into chat.

#### Acceptance Criteria

1. THE frontend SHALL keep the `Models` page as the existing provider/model management console rather than a chat-first screen.
2. THE implementation SHALL restore/preserve the behavior previously implemented for the LLM connection console / Models experience.
3. THE `Models` entry SHALL NOT be repurposed as the primary chat entry.
4. THE corrective change SHALL NOT remove or regress approved Models console capabilities already delivered for connection/provider/model management.

---

### Requirement 2: Chat uses a separate page/component entry

**User Story:** As an operator, I want chat on its own page, so conversation is available without replacing the Models workflow.

#### Acceptance Criteria

1. THE frontend SHALL expose chat through a separate page or route entry distinct from the `Models` page.
2. THE `Models` page and the chat page SHALL be independently reachable from the frontend navigation/routing structure.
3. THE chat entry SHALL reuse the existing neon matrix visual language and current frontend architecture.
4. THE routing/navigation change SHALL minimize churn by reusing the current app shell where possible.

---

### Requirement 3: Chat remains frontend-only and reuses the existing backend endpoint

**User Story:** As the team, we want the chat feature to stay narrow and frontend-only, so this correction fixes the UX direction without expanding scope.

#### Acceptance Criteria

1. THE chat page SHALL reuse the existing backend endpoint `POST /api/providers/chat`.
2. THE implementation SHALL NOT introduce new backend endpoints as part of this corrective spec.
3. THE chat page SHALL continue to discover selectable models from existing provider/catalog data already available in the frontend.
4. IF the real backend chat contract diverges from the frontend assumptions, THEN implementation SHALL stop and request alignment instead of inventing behavior.

---

### Requirement 4: Chat scope remains intentionally narrow

**User Story:** As an operator, I want a simple chat page, so I can test a model quickly without mixing it with provider management.

#### Acceptance Criteria

1. THE chat page SHALL provide a model selector populated from already-available models.
2. THE chat page SHALL allow sending a message to the selected model.
3. THE chat page SHALL show assistant responses in the same page.
4. THE chat page SHALL keep only the current conversation in memory for the active page session.
5. THE chat page SHALL show loading and error feedback for send operations.
6. THE chat page SHALL provide an explicit action to clear the current conversation.
7. THE chat page SHALL NOT add provider management features beyond restoring/reusing the existing Models page.

---

### Requirement 5: No regression to approved Models console behavior

**User Story:** As a product owner, I want this fix to correct direction without breaking the approved Models console, so previous work remains usable.

#### Acceptance Criteria

1. THE corrective implementation SHALL preserve the approved Models console behavior described by the existing LLM connection console work.
2. THE Models page SHALL still render its provider/model management UI after the correction.
3. THE chat addition SHALL NOT replace, hide, or degrade the Models console workflows.
4. THE implementation SHALL prefer restoration and reuse over rewriting the Models console.

---

### Requirement 6: Test coverage proves both restoration and separation

**User Story:** As the team, we want tests for both pages, so the incorrect replacement does not recur.

#### Acceptance Criteria

1. THE frontend test suite SHALL cover that the `Models` page renders/restores the provider/model console rather than the chat-first screen.
2. THE frontend test suite SHALL cover that the chat page is reachable through its separate entry.
3. THE frontend test suite SHALL cover core chat page behavior: model selection availability, send success/error handling, loading state, and clear conversation.
4. THE frontend test suite SHALL cover that adding the chat page does not regress the restored Models page behavior.
