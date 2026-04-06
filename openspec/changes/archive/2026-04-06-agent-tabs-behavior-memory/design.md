## Context

The Andromeda OS frontend has Agent Behavior and Memory tabs that need realignment with the MVP03 interface reference (`docs/specs/andromeda-interface-parameters-report.md`). The codebase already has the necessary types and structure in `kernel.ts`, `agentMapper.ts`, `BehaviorTab.tsx`, `MemoryTab.tsx`, and `Agents.tsx`. However, several issues exist:

1. **Editing path**: BehaviorTab edits flat fields (`agent.soul`) instead of the nested override path (`agent.overrides.soul`) that the backend schema expects.
2. **UI controls**: MemoryTab uses HTML `<input type="checkbox">` instead of styled toggle switches.
3. **Color coding**: ChipLists in Rules and Playbook lack the per-section color coding defined in MVP03.
4. **Missing fields**: Soul sub-tab lacks `persona`, `interactionMode`, and `defaultLanguage` fields.
5. **Layout**: App.tsx does not use full width for the agents tab area.
6. **Type exports**: Four Effective* types are defined but not exported from `frontend/src/types/kernel.ts`.

The backend (`agentConfigResolver.ts`, `resolveSystemPrompt.ts`) already correctly processes all these fields — only frontend UI needs adjustment.

Reference: `docs/specs/andromeda-interface-parameters-report.md` (MVP03 interface spec).

## Goals / Non-Goals

**Goals:**
- Make BehaviorTab edit via `agent.overrides.*` (soul, voice, rules, playbook, context, responseStyle)
- Add persona, interactionMode, defaultLanguage to Soul sub-tab
- Add MVP03-specified color coding to Rules and Playbook ChipLists
- Add Info boxes to each Behavior sub-tab
- Replace MemoryTab checkboxes with styled toggle switches
- Make memoryRetentionPeriod disabled when scopeType === 'session'
- Fix App.tsx layout to use full available width
- Export the four Effective* types from kernel.ts

**Non-Goals:**
- No backend changes (agentConfigResolver and resolveSystemPrompt already work)
- No new API endpoints
- No database migrations
- No changes to sandbox, safeguards, or other non-behavior/memory tabs
- The future user-facing "Identidade" tab is out of scope — this spec only clarifies the distinction

## Decisions

### D1 — Editing via overrides, not flat fields

**Decision:** BehaviorTab edits `agent.overrides.soul`, `agent.overrides.voice`, etc. rather than `agent.soul`.

**Rationale:** The backend schema (`agentOverridesSchema` in `agentModule.schema.ts`) stores soul/voice/rules/playbook/context inside the `overrides` object. Editing flat fields and relying on a sync mapper adds unnecessary indirection. Direct override editing is more consistent with how the backend processes configuration.

**Alternatives considered:**
- Keep editing flat fields and do `overrides.soul = flat.soul` in the mapper before API calls — rejected because it creates two sources of truth and confuses data flow.

### D2 — MemoryTab edits via `agent.memory` object

**Decision:** MemoryTab edits `agent.memory` (the `AgentMemoryConfig` aggregate) rather than individual flat fields.

**Rationale:** `AgentInstance` has both flat fields (`memorySessionEnabled`, etc.) and an `agent.memory: AgentMemoryConfig` aggregate. Editing the aggregate object is cleaner and matches the Zod schema structure.

**Alternatives considered:**
- Edit flat fields and sync to `agent.memory` on save — rejected because the aggregate is the canonical shape in the backend schema.

### D3 — Toggle switch visual design

**Decision:** Use a pill-shaped toggle with smooth transition (`transition-colors duration-200`), cyan when ON, slate-600 when OFF, with a sliding circle indicator.

**Rationale:** Matches the neon matrix design language (cyan/green on dark). No external library needed — pure Tailwind.

### D4 — Color coding for ChipLists

**Decision:** Rules sections and Playbook phases each get specific border/background colors per the MVP03 spec. See tasks T4 for the exact color map.

**Rationale:** MVP03 spec explicitly assigns colors (red, gold, green-cyan, red-orange) to these sections. The current implementation uses a single cyan for all.

### D5 — App.tsx full-width

**Decision:** Apply `w-full min-h-[calc(100vh-8rem)]` to the `<main>` wrapper in the agents tab block. Let Agents.tsx handle its own internal padding.

**Rationale:** App.tsx's current `<main className="w-full">` is correct but the agents tab block has no explicit width class, causing the dead space reported. The fix is minimal and surgical.

## Risks / Trade-offs

- **Risk**: BehaviorTab switching to edit `overrides.*` could break if `agentMapper.ts` doesn't correctly handle the bidirectional mapping.
  - **Mitigation**: agentMapper.ts is already verified correct in T3. The switch is a pure UI concern.

- **Risk**: The `overrides` field in `AgentInstance` is typed as `Record<string, unknown>` — no type safety on override contents at the component level.
  - **Mitigation**: This is pre-existing. The component uses explicit `onChange({ overrides: { soul: value } })` calls which are safe in practice.

- **Risk**: MemoryTab redesign could introduce regression in existing memory saves.
  - **Mitigation**: Editing via `agent.memory` aggregate — the mapper (already correct) will handle the translation to flat fields before API calls.

- **Risk**: Toggle switch CSS is custom Tailwind — not a native HTML element.
  - **Mitigation**: Simple implementation using a `<button role="switch">` with ARIA attributes and Tailwind transitions. Tested pattern.

## Migration Plan

1. Create OpenSpec change artifacts (proposal, design, specs, tasks) — this change
2. Implement T1 (App.tsx layout) — standalone, no dependencies
3. Implement T2 (export Effective* types) — standalone, no dependencies
4. Implement T3 (verify agentMapper) — standalone, no dependencies
5. Implement T4 (BehaviorTab rewrite) — depends on T2 (types must be exported)
6. Implement T5 (MemoryTab redesign) — depends on T4 (uses same pattern)
7. Implement T6 (Agents.tsx verification) — depends on T5 (memory tab must work)
8. No backend changes needed — T7 and T8 verify existing code

**Rollback**: If any issue arises, revert the specific file changed. No database migration needed.

## Open Questions

- **Q1**: Does the `overrides` field in `AgentInstance` need a stronger type than `Record<string, unknown>`? (Out of scope for this change — deferred to future typing work.)
- **Q2**: Should the future "Identidade" tab (user-facing) share any components with the current Behavior tab? (Deferred — will be addressed in the future `agent-identity-tab` spec.)