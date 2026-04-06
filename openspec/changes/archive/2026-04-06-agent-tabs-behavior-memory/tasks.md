## 1. Pre-checks

- [x] 1.1 Read `frontend/src/App.tsx` current state
- [x] 1.2 Read `frontend/src/types/kernel.ts` lines 87–122 to confirm Effective* type definitions
- [x] 1.3 Read `frontend/src/lib/agentMapper.ts` to verify override mapping
- [x] 1.4 Read `frontend/src/components/agents/tabs/BehaviorTab.tsx` current implementation
- [x] 1.5 Read `frontend/src/components/agents/tabs/MemoryTab.tsx` current implementation
- [x] 1.6 Read `frontend/src/pages/Agents.tsx` tab integration

## 2. App.tsx — Full-width layout

- [x] 2.1 Apply `w-full min-h-[calc(100vh-8rem)]` to the `<main>` element in the agents tab block
- [x] 2.2 Verify no `max-w-*` constraint is imposed on the agents area wrapper
- [x] 2.3 Run `cd frontend && npx tsc --noEmit` — pass without errors

## 3. kernel.ts — Export Effective* types

- [x] 3.1 Verify `EffectiveBehaviorProfile` at lines 87–93 has `export type` prefix
- [x] 3.2 Verify `EffectiveExecutionPolicy` at lines 95–109 has `export type` prefix
- [x] 3.3 Verify `EffectiveChannelPolicy` at lines 111–115 has `export type` prefix
- [x] 3.4 Verify `EffectiveModelPolicy` at lines 117–122 has `export type` prefix
- [x] 3.5 If any `export type` is missing, add it
- [x] 3.6 Run `cd frontend && npx tsc --noEmit` — pass without errors

## 4. agentMapper.ts — Verify override mapping

- [x] 4.1 Verify soul, voice, rules, playbook, context are mapped via `overrides.*` path
- [x] 4.2 Verify memory fields map correctly to `overrides.memory.*`
- [x] 4.3 Run `cd frontend && npx tsc --noEmit` — pass without errors

## 5. BehaviorTab.tsx — Complete rewrite

- [x] 5.1 Change all onChange calls to use `overrides.*` path instead of flat fields:
  - Soul textarea → `onChange({ overrides: { soul: value } })`
  - Voice textarea → `onChange({ overrides: { voice: value } })`
  - ResponseStyle textarea → `onChange({ overrides: { responseStyle: value } })`
- [x] 5.2 Add to Soul sub-tab: persona text input → `onChange({ overrides: { persona: value } })`
- [x] 5.3 Add to Soul sub-tab: interactionMode dropdown (reactive/proactive/guided/strict) → `onChange({ overrides: { interactionMode: value } })`
- [x] 5.4 Add to Soul sub-tab: defaultLanguage text input → `onChange({ overrides: { defaultLanguage: value } })`
- [x] 5.5 Add Info Box Card (border-slate-600) at top of Soul sub-tab with description text
- [x] 5.6 Add Info Box Card at top of Voice sub-tab
- [x] 5.7 Add Info Box Card at top of Rules sub-tab
- [x] 5.8 Add Info Box Card at top of Playbook sub-tab
- [x] 5.9 Add Info Box Card at top of Context sub-tab
- [x] 5.10 Add Info Box Card at top of Response Style sub-tab
- [x] 5.11 Update ChipList in Rules: Must / Must Not → red (`border-red-500/50 bg-red-500/10`)
- [x] 5.12 Update ChipList in Rules: Delegate When / Review When / Feedback When / Evidence When → gold (`border-yellow-500/50 bg-yellow-500/10`)
- [x] 5.13 Update ChipList in Rules: Interrupt When → red-orange (`border-orange-500/50 bg-orange-500/10`)
- [x] 5.14 Update ChipList in Playbook: Start / Execute → green-cyan (`border-cyan-500/50 bg-cyan-500/10`)
- [x] 5.15 Update ChipList in Playbook: Review / Report → gold (`border-yellow-500/50 bg-yellow-500/10`)
- [x] 5.16 Context sub-tab ChipLists keep default cyan color
- [x] 5.17 Rules nested onChange → `onChange({ overrides: { rules: { must: values } } })` etc.
- [x] 5.18 Playbook nested onChange → `onChange({ overrides: { playbook: { start: values } } })` etc.
- [x] 5.19 Context nested onChange → `onChange({ overrides: { context: { stack: values } } })` etc.
- [x] 5.20 Run `cd frontend && npx tsc --noEmit` — pass without errors

## 6. MemoryTab.tsx — Complete redesign

- [x] 6.1 Replace Session Memory `<input type="checkbox">` with styled toggle switch button (role="switch")
- [x] 6.2 Replace Shared Memory `<input type="checkbox">` with styled toggle switch button
- [x] 6.3 Toggle ON state: `bg-cyan-500`, circle indicator translated right
- [x] 6.4 Toggle OFF state: `bg-slate-600`, circle indicator translated left
- [x] 6.5 Toggle has `transition-colors duration-200`
- [x] 6.6 Toggle disabled: `opacity-50 cursor-not-allowed`
- [x] 6.7 Change all onChange calls to use `agent.memory` aggregate object: `onChange({ memory: { ...agent.memory, memorySessionEnabled: value } })`
- [x] 6.8 memoryScopeType → `onChange({ memory: { ...agent.memory, memoryScopeType: value } })`
- [x] 6.9 memoryMaxEntries → `onChange({ memory: { ...agent.memory, memoryMaxEntries: Number(value) } })`
- [x] 6.10 memoryRetentionPeriod disabled when `memoryScopeType === 'session'` with tooltip "Não aplicável para memória de sessão"
- [x] 6.11 memoryRetentionPeriod enabled when `memoryScopeType === 'persistent'`
- [x] 6.12 Reorganize About Memory glossary section with all 5 entries from MVP03 spec
- [x] 6.13 Glossary uses collapsible pattern (expand/collapse on click)
- [x] 6.14 Run `cd frontend && npx tsc --noEmit` — pass without errors

## 7. Agents.tsx — Verify tab integration

- [x] 7.1 Verify MemoryTab is imported at top of file
- [x] 7.2 Verify `memory` is in AgentTab type
- [x] 7.3 Verify BrainCircuit icon is used for memory tab
- [x] 7.4 Verify MemoryTab renders when activeTab === 'memory'
- [x] 7.5 Run `cd frontend && npx tsc --noEmit` — pass without errors

## 8. Backend verification (no changes expected)

- [x] 8.1 Run `cd core/kernel && npx tsc --noEmit` — pass without errors
- [x] 8.2 Verify resolveSystemPrompt.ts already processes soul, voice, rules, playbook, context
- [x] 8.3 Verify agentConfigResolver.ts already extracts and forwards override fields
