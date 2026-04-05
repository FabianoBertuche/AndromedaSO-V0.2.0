# Tasks — Frontend Chat on Separate Page

- [x] 1. Read the corrective spec and confirm restoration-first scope
  - Read `requirements.md`, `design.md`, and `tasks.md` for this spec before modifying code
  - Confirm the goal is to restore the Models console and move chat to a separate page entry
  - Confirm no backend work is included beyond reusing the existing chat endpoint

- [x] 2. Restore the Models page entry to the provider/model management console
  - Update `frontend/src/pages/LlmConnectionConsole.tsx` so it no longer hosts the chat-first UI
  - Restore/preserve the approved provider/model management experience in this page
  - Update `frontend/src/pages/ModelProviders.tsx` only as needed to remain aligned with the restored Models console behavior
  - Do not add new provider-management scope beyond restoration

- [x] 3. Create a separate chat page using the existing chat implementation pieces
  - Create `frontend/src/pages/ModelChatConsole.tsx`
  - Reuse `frontend/src/hooks/useModelChatConsole.ts`
  - Reuse the existing chat components under `frontend/src/components/chat/`
  - Keep chat scope limited to model selector, send message, response display, in-memory history, loading/error, and clear conversation

- [x] 4. Update app navigation/routing so Models and Chat are separate entries
  - Update `frontend/src/App.tsx`
  - Preserve `?tab=models` for the restored Models console
  - Add a distinct `?tab=chat` entry for the new chat page
  - Keep routing changes minimal and consistent with the current app-shell pattern

- [x] 5. Restore and add frontend tests for the corrected page split
  - Update `frontend/src/pages/__tests__/LlmConnectionConsole.test.tsx` to assert Models console restoration and absence of chat-first replacement behavior
  - Create `frontend/src/pages/__tests__/ModelChatConsole.test.tsx` for separate chat page behavior
  - Update any related app/page tests needed to verify `models` and `chat` resolve to different page entries
  - Keep existing chat hook/component tests passing with minimal necessary adjustments

- [x] 6. Verify frontend compilation after the restoration and page split
  - Run `cd frontend && npx tsc --noEmit`
  - Fix any TypeScript errors introduced by the page split before continuing

- [x] 7. Verify relevant frontend tests for both restored Models and separate Chat behavior
  - Run the relevant frontend Vitest coverage for the impacted pages/hooks/components
  - Confirm the restored Models page tests pass
  - Confirm the separate chat page tests pass
  - Confirm no regression in the existing chat hook/component tests caused by moving chat to its own page

- [x] 8. Final scope review
  - Confirm `Models` remains the provider/model management console
  - Confirm chat is reachable only through its separate page entry
  - Confirm the existing backend endpoint `POST /api/providers/chat` was reused without backend expansion
  - Confirm no unintended provider-management redesign or unrelated UI churn was introduced
