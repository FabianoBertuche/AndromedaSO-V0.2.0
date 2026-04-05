# Requirements: OpenAI Codex User Documentation

## Problem

The repository already contains technical OpenAI Codex sign-in material in `docs/suporte/logincodex.md`, but it is not a beginner-friendly setup guide for someone who just needs to configure `OPENAI_CODEX_WEB_CLIENT_ID`, use the correct redirect URI, and safely verify the sign-in flow.

The current product behavior also makes this documentation gap visible to users because the backend error message for missing configuration explicitly points to `docs/suporte/logincodex.md`.

## Goal

Add documentation-only guidance for the existing `openai-codex` sign-in flow so a beginner can:

1. configure `OPENAI_CODEX_WEB_CLIENT_ID` correctly,
2. use the exact redirect URI path expected by the app,
3. follow a local step-by-step setup flow,
4. run a safe manual test checklist without changing code,
5. troubleshoot the most common failure modes.

## Scope

This spec covers documentation files only.

## Out of Scope

- Any backend, frontend, env validation, routing, OAuth, or UI code changes
- Any change to API contracts
- Any automation or test code changes
- Any redirect URI behavior changes in the application

## Functional Requirements

### FR1: Beginner guide in the support docs area
- The implementation MUST add a beginner-friendly user guide under the existing `docs/suporte/` structure.
- The guide MUST explain that `OPENAI_CODEX_WEB_CLIENT_ID` is required by the backend for web OAuth.
- The guide MUST show the exact local configuration location: `core/kernel/.env`.
- The guide MUST include an exact editable snippet using:

```dotenv
OPENAI_CODEX_WEB_CLIENT_ID=your_openai_web_client_id
```

- The guide MUST instruct the user to restart the kernel after changing `core/kernel/.env`.

### FR2: Exact redirect URI documentation
- The documentation MUST state that the application expects the callback path `/oauth/callback`.
- The documentation MUST include the exact development redirect URI example:
  - `http://localhost:5173/oauth/callback`
- The documentation MUST include the exact production redirect URI example:
  - `https://app.example.com/oauth/callback`
- The documentation MUST clearly warn users not to use a different callback path such as `/auth/callback`.

### FR3: Step-by-step local setup for beginners
- The documentation MUST provide a numbered local setup flow suitable for non-technical or junior users.
- The setup flow MUST include:
  1. where to obtain the OpenAI web client ID,
  2. where to place `OPENAI_CODEX_WEB_CLIENT_ID`,
  3. how to confirm the frontend runs on `http://localhost:5173`,
  4. how to start or restart the backend and frontend locally,
  5. where in the UI to start the `openai-codex` sign-in flow.

### FR4: Safe manual test checklist for non-technical users
- The documentation MUST include a manual test checklist written for non-technical users.
- The checklist MUST avoid requiring developer tools, network tracing, or code edits.
- The checklist MUST cover the safe happy path:
  - app opens,
  - `openai-codex` provider option is visible,
  - the sign-in button starts the OpenAI flow,
  - the browser returns to `/oauth/callback`,
  - the app completes sign-in and returns to the models tab,
  - a new `openai-codex` provider entry appears.
- The checklist MUST include at least one safety reminder telling users not to paste tokens or secrets into chat, tickets, or screenshots.

### FR5: Troubleshooting section for common failures
- The documentation MUST include a troubleshooting section with plain-language explanations and next steps for:
  1. missing `OPENAI_CODEX_WEB_CLIENT_ID`,
  2. wrong redirect URI,
  3. workspace entitlement failure (`missing_codex_entitlement`).
- The missing env var troubleshooting MUST reference the user-facing backend message that configuration is required.
- The wrong redirect URI troubleshooting MUST explain that the app only accepts `/oauth/callback`.
- The workspace entitlement troubleshooting MUST explain that the user may need a workspace administrator to enable Codex access.

### FR6: Correct repo placement and cross-references
- The implementation MUST use the existing repository documentation structure instead of inventing a new top-level docs area.
- The implementation MUST update `docs/suporte/logincodex.md` so users who land there from existing references are directed to the beginner-friendly setup guidance.
- The implementation MUST update `docs/local-dev.md` with a short OpenAI Codex local setup reference that points to the main support guide and repeats the exact local redirect URI.
- The implementation MUST update `docs/implemented-features.md` if needed so the documentation work is discoverable from the documentation index/reference layer.

## Non-Functional Requirements

### NFR1: Documentation-only change
- The implementation MUST modify only Markdown documentation files.
- No application source code, tests, configs, package manifests, or environment example files may be changed.

### NFR2: Existing project terminology and language
- The new documentation MUST match the repository’s current docs structure and terminology.
- The new user-facing setup instructions MUST be written in clear, beginner-friendly Portuguese to match the surrounding docs.

### NFR3: Implementation-specific spec quality
- The design MUST name the exact documentation files to create or update.
- The tasks MUST be ordered, actionable, and start unchecked.

## Acceptance Criteria

1. A primary beginner-friendly OpenAI Codex setup guide exists in `docs/suporte/`.
2. The guide documents `OPENAI_CODEX_WEB_CLIENT_ID` with the exact local file location `core/kernel/.env`.
3. The guide includes the exact redirect URI examples `http://localhost:5173/oauth/callback` and `https://app.example.com/oauth/callback`.
4. The guide includes a safe manual test checklist for non-technical users.
5. The guide includes troubleshooting for missing env var, wrong redirect URI, and workspace entitlement issues.
6. `docs/suporte/logincodex.md` directs readers to the beginner-friendly guide.
7. `docs/local-dev.md` contains a short Codex-specific cross-reference for local setup.
8. `docs/implemented-features.md` is updated if required by the chosen docs structure.
9. No non-documentation files are changed.
