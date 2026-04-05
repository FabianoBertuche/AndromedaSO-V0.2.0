# Design: OpenAI Codex User Documentation

## Overview

This is a documentation-only feature. The implementation adds one new beginner-facing guide and updates three existing Markdown files so the current `openai-codex` sign-in flow is understandable from both the support docs and the local development guide.

No application code changes are allowed.

## Documentation Files

### 1. Create `docs/suporte/openai-codex-setup.md`

This is the primary beginner-friendly guide.

#### Purpose
- Give non-technical users a simple setup path for the existing `openai-codex` sign-in flow.
- Isolate practical setup steps from the much longer technical research document in `docs/suporte/logincodex.md`.

#### Required structure

The file must contain these sections in this order:

1. `# Configurar login OpenAI Codex no Andromeda SO`
2. `## Quando usar este guia`
3. `## Antes de começar`
4. `## Configurar OPENAI_CODEX_WEB_CLIENT_ID`
5. `## Redirect URIs exatas`
6. `## Passo a passo local`
7. `## Checklist de teste manual`
8. `## Solução de problemas`
9. `## Quando pedir ajuda`

#### Required content by section

##### `## Antes de começar`
- Explain in plain Portuguese that the flow depends on:
  - backend running,
  - frontend running,
  - a valid OpenAI web client ID,
  - the exact callback path `/oauth/callback`.
- Add a short safety note telling users not to share client IDs, access tokens, refresh tokens, or screenshots that expose secrets.

##### `## Configurar OPENAI_CODEX_WEB_CLIENT_ID`
- State that the variable must be configured in `core/kernel/.env`.
- Include this exact snippet:

```dotenv
OPENAI_CODEX_WEB_CLIENT_ID=your_openai_web_client_id
```

- Add a short explanatory bullet list:
  - what the value is,
  - that it comes from the OpenAI-side web OAuth app setup,
  - that the kernel must be restarted after saving the file.

##### `## Redirect URIs exatas`
- Include a two-row table with these exact examples:

| Ambiente | Redirect URI |
|---|---|
| Desenvolvimento local | `http://localhost:5173/oauth/callback` |
| Produção (exemplo) | `https://app.example.com/oauth/callback` |

- Add a warning callout in prose:
  - the app only accepts `/oauth/callback`,
  - `/auth/callback` is wrong for this repository.

##### `## Passo a passo local`
- Provide a numbered list that specifically instructs the user to:
  1. confirm the frontend origin is `http://localhost:5173`,
  2. add `OPENAI_CODEX_WEB_CLIENT_ID` to `core/kernel/.env`,
  3. restart the kernel,
  4. open the app,
  5. go to the providers/models screen,
  6. choose `OpenAI Codex (Sign in)`,
  7. click `Sign in with OpenAI Codex`,
  8. finish the OpenAI consent flow,
  9. wait for the app to return to the models tab.

##### `## Checklist de teste manual`
- Use markdown checkboxes.
- The checklist must be safe for non-technical users and must not require browser devtools.
- Include these exact verification points in beginner language:
  - `http://localhost:5173` opens successfully.
  - The app loads without asking the user to edit code.
  - The provider list shows `OpenAI Codex (Sign in)`.
  - Clicking the sign-in button opens an OpenAI page.
  - After approval, the browser returns to a URL ending with `/oauth/callback`.
  - The app finishes processing and returns to the main screen.
  - A provider named like `openai-codex:<email>` appears.
  - No secret values are copied into chat, tickets, or screenshots.

##### `## Solução de problemas`
- Create three subsections with these exact headings:
  - `### OPENAI_CODEX_WEB_CLIENT_ID ausente`
  - `### Redirect URI incorreta`
  - `### Codex não habilitado no workspace`
- Each subsection must contain:
  - what the user will probably see,
  - what it means,
  - what to do next.
- The redirect URI subsection must explicitly mention the expected path `/oauth/callback`.
- The workspace subsection must explicitly mention `missing_codex_entitlement` and tell the user to contact the workspace administrator.

### 2. Update `docs/suporte/logincodex.md`

#### Purpose
- Preserve the existing technical reference document.
- Prevent users from getting lost when they follow the backend error message that already points to this file.

#### Required change
- Add a short note near the top of the file, before the long technical analysis, with this intent:
  - beginners should start with `docs/suporte/openai-codex-setup.md`,
  - `logincodex.md` remains the detailed technical reference.

#### Required note content
- Mention the exact filename `docs/suporte/openai-codex-setup.md`.
- Mention that the beginner guide includes:
  - `OPENAI_CODEX_WEB_CLIENT_ID` setup,
  - redirect URI examples,
  - manual testing,
  - troubleshooting.

### 3. Update `docs/local-dev.md`

#### Purpose
- Connect the existing local development guide to the new Codex-specific setup guide.

#### Required change
- Add a short subsection near the environment variables or verification area.
- The subsection title must explicitly mention OpenAI Codex.

#### Required content
- State that OpenAI Codex sign-in also requires `OPENAI_CODEX_WEB_CLIENT_ID` in `core/kernel/.env`.
- Repeat the exact local redirect URI:
  - `http://localhost:5173/oauth/callback`
- Link or refer readers to `docs/suporte/openai-codex-setup.md` for the full walkthrough and troubleshooting.
- Keep the change concise; `docs/local-dev.md` should remain a general local setup guide, not a duplicate full Codex manual.

### 4. Update `docs/implemented-features.md`

#### Purpose
- Make the documentation work discoverable from the existing implementation/reference document.

#### Required change
- Add a new section for `openai-codex-user-docs`.
- Mark it as a documentation-only feature.
- Reference the spec path `.kiro/specs/openai-codex-user-docs/`.
- Summarize the new guide, local-dev cross-reference, and troubleshooting coverage.

## Content Constraints

- Only these four Markdown files may be created or updated:
  - `docs/suporte/openai-codex-setup.md` (new)
  - `docs/suporte/logincodex.md` (update)
  - `docs/local-dev.md` (update)
  - `docs/implemented-features.md` (update)
- No code, tests, config, or env example files may be modified.
- The new beginner-facing text must be written in Portuguese.
- The tone must be practical, calm, and safe for non-technical users.

## Implementation Notes

- The documentation must reflect the current application behavior already present in the repo:
  - backend env var name: `OPENAI_CODEX_WEB_CLIENT_ID`
  - callback path: `/oauth/callback`
  - local frontend origin example: `http://localhost:5173`
  - resulting provider naming pattern: `openai-codex:<email>`
- The manual checklist must focus on observable UI behavior rather than internal request details.
