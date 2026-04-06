## Why

The Agent Behavior and Memory tabs in the frontend need realignment with the MVP03 interface reference (`docs/specs/andromeda-interface-parameters-report.md`). Specifically: (1) the Behavior tab edits flat fields instead of `agent.overrides.*`, (2) the Memory tab uses checkboxes instead of toggle switches and lacks proper `scopeType`-driven disabling, (3) the Behavior tab ChipList components lack per-section color coding, (4) several fields described in the spec are missing from the Soul sub-tab (persona, interactionMode, defaultLanguage), and (5) the Agents page layout in App.tsx does not use full available width. Additionally, the Effective* types (EffectiveBehaviorProfile, EffectiveExecutionPolicy, EffectiveChannelPolicy, EffectiveModelPolicy) exist internally in `frontend/src/types/kernel.ts` but are not exported for consumer use. Future work will introduce a user-facing "Identidade" tab — this spec lays the groundwork by clarifying that current Behavior sub-tabs are internal agent config, not user identity.

## What Changes

### T1 — App.tsx layout full-width
- `<main>` wrapping `<Agents />` uses `w-full min-h-[calc(100vh-8rem)]` to eliminate horizontal dead space on the agents tab and all other tabs.

### T2 — Export Effective* types from kernel.ts
- `EffectiveBehaviorProfile`, `EffectiveExecutionPolicy`, `EffectiveChannelPolicy`, `EffectiveModelPolicy` are already defined (lines 87–122 in `frontend/src/types/kernel.ts`) — add `export` keyword to each.

### T3 — agentMapper.ts mapping verification
- Verify `agentMapper.ts` correctly maps between flat `AgentInstance` fields and `agent.overrides.*` nested structure for soul, voice, rules, playbook, context, memory. No changes expected.

### T4 — BehaviorTab.tsx complete rewrite
- Edit via `agent.overrides.*` instead of flat fields (e.g., `onChange({ overrides: { soul: value } })`).
- Soul sub-tab: add `persona` (text input), `interactionMode` (dropdown: reactive/proactive/guided/strict), `defaultLanguage` (text input).
- Rules sub-tab: ChipList per-section color coding per MVP03 spec:
  - Must / Must Not → red
  - Delegate When / Review When / Feedback When / Evidence When → gold
  - Interrupt When → red-orange
- Playbook sub-tab: ChipList per-phase color coding:
  - Start / Execute → green-cyan
  - Review / Report → gold
- Context sub-tab: default cyan color.
- Add Info-box Card components at the top of each sub-tab.
- All sub-tabs use existing `Card` and `ChipList` internal components.

### T5 — MemoryTab.tsx complete redesign
- Replace checkboxes with styled toggle switches (Tailwind: `bg-cyan-500` when on, `bg-slate-600` when off).
- Edit via `agent.memory` (the `AgentMemoryConfig` aggregate object), not flat fields.
- `memoryRetentionPeriod` dropdown is visually disabled + tooltip when `scopeType === 'session'`.
- Glossário "About Memory" reorganizado conforme spec MVP03 Seção 12.

### T6 — Agents.tsx tab integration verification
- Verify `memory` tab is correctly imported and rendered (already done — no changes expected).

### T7 — resolveSystemPrompt.ts names
- Keep technical names (## Soul, ## Voice, ## Rules Must) — do not align with MVP03 friendly names.

### T8 — agentConfigResolver.ts verification
- Already correctly extracts and forwards new fields via `applyOverrides()`. No changes expected.

## Capabilities

### New Capabilities

- `agent-behavior-tab`: Full rewrite of the Behavior tab to edit via `agent.overrides.*`, add missing Soul fields, color-coded ChipLists, and Info boxes.
- `agent-memory-tab`: Complete redesign of the Memory tab with toggle switches, scopeType-driven retention disabling, and organized glossary.
- `agent-app-layout`: Full-width layout fix for the agents tab area in App.tsx.
- `agent-effective-types-export`: Export EffectiveBehaviorProfile, EffectiveExecutionPolicy, EffectiveChannelPolicy, EffectiveModelPolicy from kernel.ts.

### Modified Capabilities

- (none — existing capabilities only change UI presentation, not spec-level behavior)

## Impact

- **Frontend**: `frontend/src/App.tsx`, `frontend/src/types/kernel.ts`, `frontend/src/components/agents/tabs/BehaviorTab.tsx`, `frontend/src/components/agents/tabs/MemoryTab.tsx`
- **Backend**: No changes expected — `agentConfigResolver.ts` and `resolveSystemPrompt.ts` already handle the fields correctly.
- **Spec related**: `docs/specs/andromeda-interface-parameters-report.md` (reference only, not modified)