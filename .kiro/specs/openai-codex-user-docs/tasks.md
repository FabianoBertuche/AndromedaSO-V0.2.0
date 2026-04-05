# Tasks: OpenAI Codex User Documentation

## Overview

Create a documentation-only beginner guide for the existing `openai-codex` sign-in flow, place it in the support docs area, and add the minimum supporting cross-references in existing documentation files. No application code changes are allowed.

## Tasks

- [x] 1. Create the primary beginner guide in `docs/suporte/openai-codex-setup.md`
  - Write the guide in Portuguese for beginners.
  - Include the exact env var setup for `OPENAI_CODEX_WEB_CLIENT_ID` in `core/kernel/.env`.
  - Include the exact redirect URI examples:
    - `http://localhost:5173/oauth/callback`
    - `https://app.example.com/oauth/callback`
  - Include a numbered local configuration flow.
  - Include a markdown checkbox-based manual test checklist for non-technical users.
  - Include troubleshooting subsections for missing env var, wrong redirect URI, and workspace entitlement issues.
  - _Requirements: FR1, FR2, FR3, FR4, FR5, NFR2_

- [x] 2. Update `docs/suporte/logincodex.md` to route beginners to the new guide
  - Add a short note near the top of the file.
  - Mention `docs/suporte/openai-codex-setup.md` by exact path.
  - Explain that `logincodex.md` remains the detailed technical reference, while the new guide is the practical setup document.
  - _Requirements: FR6, NFR2_

- [x] 3. Update `docs/local-dev.md` with a concise OpenAI Codex cross-reference
  - Add a short Codex-specific subsection without turning `docs/local-dev.md` into a duplicate full guide.
  - Mention `OPENAI_CODEX_WEB_CLIENT_ID` in `core/kernel/.env`.
  - Repeat the exact local redirect URI `http://localhost:5173/oauth/callback`.
  - Point readers to `docs/suporte/openai-codex-setup.md` for the full walkthrough and troubleshooting.
  - _Requirements: FR3, FR6_

- [x] 4. Update `docs/implemented-features.md`
  - Add a new documentation-only entry for `openai-codex-user-docs`.
  - Reference `.kiro/specs/openai-codex-user-docs/`.
  - Summarize the new support guide, local-dev reference, and troubleshooting/manual-test coverage.
  - _Requirements: FR6, NFR1_

- [x] 5. Final documentation verification
  - Confirm only Markdown documentation files were changed.
  - Confirm the new support guide contains the exact env var name `OPENAI_CODEX_WEB_CLIENT_ID`.
  - Confirm the new support guide contains both exact redirect URI examples.
  - Confirm the manual checklist is written for non-technical users and uses checkboxes.
  - Confirm the troubleshooting section includes the three required failure modes.
  - Confirm `docs/suporte/logincodex.md`, `docs/local-dev.md`, and `docs/implemented-features.md` all reference the new documentation appropriately.
  - _Requirements: FR1, FR2, FR4, FR5, FR6, NFR1, NFR3_
