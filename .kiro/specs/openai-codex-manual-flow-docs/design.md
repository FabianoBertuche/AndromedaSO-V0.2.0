# Design: OpenAI Codex Manual Flow Documentation Updates

## Overview

This is a documentation-only change.

The implementation updates the current OpenAI Codex documentation/reference layer so the repository stops implying that the current web sign-in flow is generally equivalent to openclaw/opencode, and instead documents three distinct states:

1. **Current implemented behavior** — BYO web OAuth client setup using `OPENAI_CODEX_WEB_CLIENT_ID`
2. **Current limitation** — this web flow is not the desired long-term UX and is not generally equivalent to the official/headless CLI-style experience
3. **Planned next direction** — a manual link/copy-return flow inspired by official Codex guidance, not yet implemented

No application code, tests, configs, or environment files may be changed.

## Documentation Files

### 1. Create `docs/suporte/openai-codex-auth-status.md`

#### Purpose
- Provide the canonical current-status note for OpenAI Codex authentication in this repo.
- Give support readers one place that distinguishes implemented behavior, limitation, and next direction.
- Add current-context language for older conflicting references without modifying historical specs.

#### Required structure
The file must contain these sections in this order:

1. `# Status do login OpenAI Codex no Andromeda SO`
2. `## Resumo rápido`
3. `## Comportamento implementado hoje`
4. `## Limitação atual`
5. `## Próxima direção planejada`
6. `## Como ler as referências do repositório`

#### Required content by section

##### `## Resumo rápido`
- Include a short three-bullet summary covering:
  - current implemented behavior,
  - current limitation,
  - planned next direction.

##### `## Comportamento implementado hoje`
- State clearly that the repo currently implements a **BYO web OAuth client** flow.
- Mention `OPENAI_CODEX_WEB_CLIENT_ID` explicitly.
- Clarify that this is the currently implemented repository behavior.

##### `## Limitação atual`
- State clearly that this flow is **not** the desired long-term UX.
- State that the current web flow should **not** be described as generally equivalent to openclaw/opencode.
- Explain that the need for a user/workspace-provided web OAuth client is the main current limitation.

##### `## Próxima direção planejada`
- Introduce the next-step direction as a **manual link/copy-return** flow.
- Describe it as **headless/CLI-style** and inspired by official Codex guidance.
- Explicitly say that this direction is **planned** and **not yet implemented** in the repo.

##### `## Como ler as referências do repositório`
- Explain how readers should interpret the repo docs:
  - setup guide = how the current implementation works,
  - technical reference = deep background and research,
  - status note = current conclusion and next direction.
- Add a historical note mentioning `.kiro/specs/openai-codex-hardcoded-client/` as an older exploration/reference that is **not the active current direction**.
- Do not edit, deprecate, or alter the historical spec itself.

### 2. Update `docs/suporte/openai-codex-setup.md`

#### Purpose
- Keep this as the practical setup guide for the currently implemented behavior.
- Prevent the file from sounding like the current flow is the final intended UX.

#### Required changes
- Add a short status note near the top, after the introduction.
- State that this guide documents the **current implemented BYO web OAuth client flow**.
- State that this is **not** the planned long-term UX.
- Add a pointer to `docs/suporte/openai-codex-auth-status.md` for limitation and next-direction context.
- Preserve the setup instructions for `OPENAI_CODEX_WEB_CLIENT_ID` and `/oauth/callback` because they still describe the current implementation.

### 3. Update `docs/suporte/logincodex.md`

#### Purpose
- Keep the existing technical/reference document without implying that its conceptual OAuth analysis means the current repo already matches the official Codex/manual/headless flow.

#### Required changes
- Add a short note near the top explaining that:
  - `docs/suporte/openai-codex-setup.md` documents the current implemented BYO web OAuth client behavior,
  - `docs/suporte/openai-codex-auth-status.md` documents the current limitation and planned next direction,
  - `logincodex.md` remains the deeper technical/reference layer.
- Add wording that this file should not be read as proof that the current repo already implements the planned manual/headless flow.
- Preserve existing research/history content; only add framing/context.

### 4. Update `docs/local-dev.md`

#### Purpose
- Keep local development docs discoverable and accurate for someone testing the current behavior.

#### Required changes
- Update the existing `### OpenAI Codex` subsection.
- Keep the explicit current requirement for `OPENAI_CODEX_WEB_CLIENT_ID`.
- Keep the exact local redirect URI `http://localhost:5173/oauth/callback`.
- Add one concise sentence that this subsection describes the **current implemented web flow only**.
- Add a reference to `docs/suporte/openai-codex-auth-status.md` for limitation/planned-direction context.
- Do not expand `docs/local-dev.md` into a long roadmap document.

### 5. Update `docs/implemented-features.md`

#### Purpose
- Make the documentation update discoverable from the repository’s implementation/reference index.

#### Required changes
- Add a new entry for `openai-codex-manual-flow-docs`.
- Mark it as a documentation-only feature.
- Reference `.kiro/specs/openai-codex-manual-flow-docs/`.
- Summarize that the docs now distinguish:
  - the current BYO web OAuth client behavior,
  - the current limitation,
  - the planned manual link/copy-return direction.
- Mention that current docs now contextualize older conflicting references, including the hardcoded-client exploration, without rewriting history.

## Content Constraints

- Only these Markdown files may be created or updated:
  - `docs/suporte/openai-codex-auth-status.md` (new)
  - `docs/suporte/openai-codex-setup.md` (update)
  - `docs/suporte/logincodex.md` (update)
  - `docs/local-dev.md` (update)
  - `docs/implemented-features.md` (update)
- No code, tests, config, env, or package files may be modified.
- The new end-user/support-facing prose should be written in Portuguese.

## Implementation Notes

- The status note is the canonical place to explain the distinction between current implementation and next direction.
- The practical setup guide must continue to document what works today, even though that flow is not the desired end state.
- Historical references must be contextualized from current docs rather than retroactively rewritten.
- The wording must remain careful:
  - **implemented now** ≠ **desired long-term UX**
  - **planned next direction** ≠ **already available**
