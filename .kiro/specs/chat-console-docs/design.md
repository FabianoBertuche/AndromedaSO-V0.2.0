# Design — Chat Console Documentation Registration

## Overview

This is a docs-only registration spec for behavior that has already been delivered and confirmed working.

The documentation update should capture only three facts:

1. `Models` remains the provider/model management console.
2. Chat is a separate page entry exposed through `?tab=chat`.
3. The frontend chat flow depends on the existing backend endpoint `POST /api/providers/chat`.

No application code, tests, configs, or environment files are part of this design.

## Documentation Strategy

The delivered behavior is small and already fits the existing documentation structure. A new support/usage document is **not** justified for this change because it would duplicate information better kept in the feature index and local development guide.

Therefore, this design intentionally limits updates to two existing docs:

- `docs/implemented-features.md`
- `docs/local-dev.md`

## Files to Update

### 1. Update `docs/implemented-features.md`

#### Purpose
- Register the delivered feature formally in the implementation index.
- Make the backend prerequisite visible without turning the page into API documentation.

#### Required content
- Add a new completed feature entry for `chat-console-docs`.
- Reference `.kiro/specs/chat-console-docs/`.
- Summarize that:
  - `Models` remains the provider/model console;
  - chat is separately reachable via `?tab=chat`;
  - backend chat is provided by `POST /api/providers/chat`.
- Keep the wording brief and limited to delivered behavior.
- Do not describe streaming, persistence, tools, attachments, or other non-delivered chat capabilities.

### 2. Update `docs/local-dev.md`

#### Purpose
- Give developers a short, practical note about how to use the delivered separated chat flow locally.

#### Required content
- Add a short subsection in the local flow area or another nearby location that fits the current document structure.
- State briefly that:
  - `?tab=models` is for provider/model management;
  - `?tab=chat` is for chat usage/testing;
  - chat calls the backend through `POST /api/providers/chat` at a high level.
- Add the development caveat that frontend API auto-target resolution happens at frontend startup, so backend target/availability changes may require restarting the frontend.
- Keep the addition concise so `docs/local-dev.md` remains a general development guide.

## Files Not Created

No new support document should be created in `docs/` or `docs/suporte/` for this spec.

### Rationale
- The feature behavior is narrow and already understandable from the existing docs structure.
- A dedicated support page would add maintenance overhead without adding meaningful new guidance.
- The user requested concise registration of delivered behavior, not an expanded user manual.

## Content Constraints

- Only Markdown documentation files may be modified.
- The documentation must describe the delivered state as present tense, not as planned future work.
- The documentation must stay high-level and concise.
- The documentation must not drift into backend contract detail beyond naming `POST /api/providers/chat`.
- The documentation must not mention out-of-scope features such as streaming, persistence, multi-chat, tools, or attachments.

## Verification Notes

Before finalizing the documentation updates, the implementer should confirm the wording still matches:

- the delivered backend prerequisite in `.kiro/specs/backend-model-chat-endpoint/`, and
- the delivered frontend separation in `.kiro/specs/frontend-chat-separate-page/`.

If the repository docs already contain conflicting chat wording elsewhere, that should be reported for follow-up rather than silently expanding this spec.
