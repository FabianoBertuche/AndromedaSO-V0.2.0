# Tasks: OpenAI Codex Manual Flow Documentation Updates

## Overview

Update the repository’s OpenAI Codex documentation/reference layer so it accurately separates the current implemented BYO web OAuth client behavior from the current limitation and the planned manual link/copy-return direction. This is a documentation-only change.

## Tasks

- [x] 1. Create the canonical status note in `docs/suporte/openai-codex-auth-status.md`
  - Write the file in Portuguese.
  - Add explicit sections for current implemented behavior, current limitation, and planned next direction.
  - State that the current repo behavior is BYO web OAuth client setup using `OPENAI_CODEX_WEB_CLIENT_ID`.
  - State that this is not the desired long-term UX and is not generally equivalent to openclaw/opencode.
  - Introduce the manual link/copy-return flow as a planned headless/CLI-style next step inspired by official Codex guidance.
  - Add historical-context wording that `.kiro/specs/openai-codex-hardcoded-client/` is an older reference, not the active current direction.
  - _Requirements: FR1, FR2, FR3, FR4, FR5, FR6, NFR1, NFR2_

- [x] 2. Update `docs/suporte/openai-codex-setup.md` to frame the current flow correctly
  - Add a concise note near the top saying the guide documents the current implemented BYO web OAuth client flow.
  - Clarify that this flow is not the planned long-term UX.
  - Link readers to `docs/suporte/openai-codex-auth-status.md` for limitation and next-direction context.
  - Keep the current setup instructions for `OPENAI_CODEX_WEB_CLIENT_ID` and `/oauth/callback` intact.
  - _Requirements: FR1, FR2, FR3, FR4, FR5, NFR1, NFR2_

- [x] 3. Update `docs/suporte/logincodex.md` with current-reference framing
  - Add a note near the top pointing readers to both `docs/suporte/openai-codex-setup.md` and `docs/suporte/openai-codex-auth-status.md`.
  - Clarify that `logincodex.md` remains the technical/reference layer.
  - Add wording that this file does not mean the current repo already implements the planned manual/headless flow.
  - Preserve the existing research/history content.
  - _Requirements: FR1, FR3, FR4, FR5, FR6, NFR1, NFR2_

- [x] 4. Update `docs/local-dev.md` for accurate local discoverability
  - Keep the `OPENAI_CODEX_WEB_CLIENT_ID` requirement and exact local redirect URI.
  - Add a short statement that the subsection describes the current implemented web flow only.
  - Point readers to `docs/suporte/openai-codex-auth-status.md` for the limitation and planned next direction.
  - Keep the change concise.
  - _Requirements: FR2, FR3, FR4, FR5, FR7, NFR2_

- [x] 5. Update `docs/implemented-features.md`
  - Add a new documentation-only entry for `openai-codex-manual-flow-docs`.
  - Reference `.kiro/specs/openai-codex-manual-flow-docs/`.
  - Summarize that the docs now distinguish current behavior, current limitation, and planned next direction.
  - Mention that conflicting historical references are now contextualized without rewriting history.
  - _Requirements: FR5, FR6, FR7, NFR2_

- [x] 6. Perform final documentation verification
  - Confirm only the allowed Markdown documentation files were created or updated.
  - Confirm the new status note explicitly distinguishes implemented behavior, limitation, and planned next direction.
  - Confirm current docs still document `OPENAI_CODEX_WEB_CLIENT_ID` as part of the current implementation.
  - Confirm no updated file implies that the planned manual link/copy-return flow is already implemented.
  - Confirm current docs no longer imply the existing web flow is generally equivalent to openclaw/opencode.
  - Confirm the historical hardcoded-client spec is contextualized from current docs without being rewritten.
  - _Requirements: FR1, FR2, FR3, FR4, FR5, FR6, FR7, NFR1, NFR3_
