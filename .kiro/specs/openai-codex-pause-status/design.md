# Design: OpenAI Codex Pause Status Documentation Updates

## Overview

This is a documentation-only change.

The repository already has:

1. an implemented manual `openai-codex` flow,
2. support docs that explain how that flow works today, and
3. a status/reference layer describing the current state.

This design updates that documentation layer so the repo communicates a new formal conclusion:

1. the manual flow remains the current implemented state,
2. further OpenAI Codex work is paused/deferred for now,
3. the pause exists because the repo still lacks a viable auth/client model that avoids impractical assumptions, and
4. future readers get a concise reminder of exactly where to resume.

No application code, configs, environment files, or tests may be changed.

## Documentation Files

### 1. Update `docs/suporte/openai-codex-auth-status.md`

#### Purpose
- Keep this file as the canonical status note.
- Make it the primary place where the pause/defer state is explained.
- Preserve the current implemented/manual-flow record while adding the blocker and future-return reminder.

#### Required changes
- Add clear wording near the top that OpenAI Codex work is currently **paused/deferred**.
- Preserve the statement that the repository currently implements a manual `openai-codex` flow.
- Add or update a section that explains the practical blocker: the repo still needs a viable auth/client model that does not depend on impractical assumptions.
- Add a concise “where to resume” reminder that points future readers to:
  - `.kiro/specs/openai-codex-manual-auth-flow/`
  - `docs/suporte/openai-codex-setup.md`
  - `docs/suporte/openai-codex-auth-status.md`
  - the unresolved auth/client-model investigation
- State that the pause is pending future redesign/investigation, without promising dates.

#### Required structure
The file must clearly contain these ideas in a scannable order:

1. current implemented state,
2. current pause/defer status,
3. practical blocker,
4. future-return reminder.

### 2. Update `docs/suporte/openai-codex-setup.md`

#### Purpose
- Keep this file as the practical setup guide for what works today.
- Prevent readers from mistaking the presence of setup instructions as proof that this line of work is still actively advancing.

#### Required changes
- Add a concise note near the top that this guide documents the currently implemented manual flow only.
- State that broader OpenAI Codex work is currently paused/deferred.
- Point readers to `docs/suporte/openai-codex-auth-status.md` for the pause reason, blocker, and future-return reminder.
- Preserve the existing practical setup and troubleshooting instructions for the implemented flow.

### 3. Update `docs/suporte/logincodex.md`

#### Purpose
- Keep this file as the deeper technical/reference document.
- Add explicit framing so its research/history does not read like an active implementation roadmap.

#### Required changes
- Add a short note near the top stating that OpenAI Codex work is currently paused/deferred.
- Clarify that the repository still contains an implemented manual flow, but further work is paused pending a viable auth/client model.
- Point readers to `docs/suporte/openai-codex-auth-status.md` for the canonical current conclusion and return reminder.
- Preserve the existing research/history content; only add framing/context.

### 4. Update `docs/local-dev.md`

#### Purpose
- Keep local-development discoverability accurate for someone testing the current implementation.

#### Required changes
- Keep the existing local setup details for the implemented manual flow.
- Add one concise sentence that this subsection documents the current implemented flow, while broader OpenAI Codex work is paused/deferred.
- Add or keep a pointer to `docs/suporte/openai-codex-auth-status.md` for current status and future-return context.
- Keep the subsection short; do not turn it into a roadmap.

### 5. Update `docs/implemented-features.md`

#### Purpose
- Make the documentation-only pause status easy to discover from the repository feature/index view.

#### Required changes
- Add a new documentation-only entry for `openai-codex-pause-status`.
- Reference `.kiro/specs/openai-codex-pause-status/`.
- Summarize that the docs now record:
  - the currently implemented manual flow,
  - the current pause/defer state,
  - the unresolved auth/client-model blocker, and
  - where future work should resume.

## Content Constraints

- Only these Markdown files may be created or updated by the eventual implementation:
  - `docs/suporte/openai-codex-auth-status.md`
  - `docs/suporte/openai-codex-setup.md`
  - `docs/suporte/logincodex.md`
  - `docs/local-dev.md`
  - `docs/implemented-features.md`
- No code, test, config, env, or package files may be modified.
- End-user/support-facing prose should be written in Portuguese to match nearby docs.

## Implementation Notes

- The canonical status note must carry the strongest pause/defer wording.
- The setup guide must continue documenting the implemented flow without sounding like active product direction.
- The future-return reminder must be concise and operational, not speculative.
- The unresolved blocker must be described honestly: future progress depends on redesign/investigation of a viable auth/client model that does not rely on impractical assumptions.
- The docs must preserve already-implemented/manual-flow claims; this work adds pause context, not revisionist history.
