# Tasks — Chat Console Documentation Registration

- [x] 1. Review the delivered behavior and upstream specs before editing docs
  - Read `.kiro/specs/backend-model-chat-endpoint/requirements.md` and `.kiro/specs/frontend-chat-separate-page/requirements.md`
  - Confirm the delivered state to document is:
    - `Models` remains the provider/model management console
    - chat is separately reachable via `?tab=chat`
    - backend provides `POST /api/providers/chat`
  - Confirm this spec remains docs-only

- [x] 2. Update `docs/implemented-features.md`
  - Add a concise completed-feature entry for `chat-console-docs`
  - Reference `.kiro/specs/chat-console-docs/`
  - Register that Models and Chat are separate surfaces
  - Register the backend chat prerequisite at a high level via `POST /api/providers/chat`
  - Avoid documenting any out-of-scope chat capabilities

- [x] 3. Update `docs/local-dev.md`
  - Add a short local-usage note for the separated chat flow
  - Mention `?tab=models` for provider/model management
  - Mention `?tab=chat` for chat usage/testing
  - Mention at a high level that chat uses `POST /api/providers/chat`
  - Document the caveat that frontend API auto-target resolution happens at startup and frontend restart may be needed after backend changes

- [x] 4. Perform final documentation scope review
  - Confirm only Markdown documentation files were changed
  - Confirm the documentation is concise and limited to delivered behavior
  - Confirm no streaming, persistence, multi-chat, tools, or attachments were documented
  - Confirm no new support doc was created outside the files named in the design
