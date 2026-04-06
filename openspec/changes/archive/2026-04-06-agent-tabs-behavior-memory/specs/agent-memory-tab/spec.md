## ADDED Requirements

### Requirement: agent-memory-tab-toggle-switches

The MemoryTab component SHALL use styled toggle switches instead of HTML checkboxes for boolean memory configuration fields. The toggle switch SHALL be implemented as a `<button role="switch">` element with the following visual states:

- **ON**: `bg-cyan-500` background, white circle indicator translated to the right
- **OFF**: `bg-slate-600` background, white circle indicator translated to the left
- **Transition**: `transition-colors duration-200` for smooth color animation
- **Size**: `h-5 w-9` (36px × 20px) pill shape with rounded full

The toggle controls apply to:
- `memorySessionEnabled` — Session Memory toggle
- `memoryShared` — Shared Memory toggle

#### Scenario: Session Memory toggle on
- **WHEN** the user clicks the Session Memory toggle while it is OFF
- **THEN** the toggle animates to ON state and `onChange({ memory: { ...agent.memory, memorySessionEnabled: true } })` is called

#### Scenario: Session Memory toggle off
- **WHEN** the user clicks the Session Memory toggle while it is ON
- **THEN** the toggle animates to OFF state and `onChange({ memory: { ...agent.memory, memorySessionEnabled: false } })` is called

#### Scenario: Shared Memory toggle on
- **WHEN** the user clicks the Shared Memory toggle while it is OFF
- **THEN** the toggle animates to ON state and `onChange({ memory: { ...agent.memory, memoryShared: true } })` is called

#### Scenario: Toggle disabled state
- **WHEN** `readOnly` or `disabled` prop is true
- **THEN** the toggle is non-interactive, has `opacity-50 cursor-not-allowed`, and clicking does nothing

---

### Requirement: agent-memory-tab-edits-via-memory-object

The MemoryTab component SHALL edit the memory configuration via the `agent.memory` aggregate object (`AgentMemoryConfig` type), not via individual flat fields on `AgentInstance`.

The `AgentMemoryConfig` object has the shape:
```typescript
{
  memorySessionEnabled: boolean;
  memoryScopeType: 'session' | 'persistent';
  memoryMaxEntries: number;
  memoryShared: boolean;
  memoryRetentionPeriod: 'session' | '24h' | '7d' | '30d' | 'forever';
}
```

All updates SHALL be made by spreading the existing `agent.memory` object and overriding the changed field, then calling `onChange({ memory: <mergedObject> })`.

#### Scenario: Update memoryScopeType
- **WHEN** the user selects "persistent" from the Scope Type dropdown
- **THEN** `onChange({ memory: { ...agent.memory, memoryScopeType: 'persistent' } })` is called

#### Scenario: Update memoryMaxEntries
- **WHEN** the user changes the Max Entries number input
- **THEN** `onChange({ memory: { ...agent.memory, memoryMaxEntries: Number(<value>) } })` is called

---

### Requirement: agent-memory-tab-retention-disabled-when-session

The `memoryRetentionPeriod` dropdown SHALL be visually disabled (greyed out, non-interactive) and display a tooltip with the message "Não aplicável para memória de sessão" when `memoryScopeType` is set to `'session'`.

When `memoryScopeType` is `'persistent'`, the `memoryRetentionPeriod` dropdown SHALL be fully interactive.

#### Scenario: Retention disabled in session mode
- **WHEN** `memoryScopeType` equals `'session'`
- **THEN** the Retention Period dropdown has `disabled` attribute, `opacity-50 cursor-not-allowed`, and shows tooltip "Não aplicável para memória de sessão"

#### Scenario: Retention enabled in persistent mode
- **WHEN** `memoryScopeType` equals `'persistent'`
- **THEN** the Retention Period dropdown is fully interactive with no disabled state or tooltip

---

### Requirement: agent-memory-tab-glossary

The MemoryTab SHALL include a collapsible "About Memory" (Sobre Memória) glossary section at the bottom of the tab. This section SHALL contain definitions for each memory configuration concept.

The glossary SHALL use an expandable/collapsible pattern (click to expand/collapse) with a chevron or similar indicator. The glossary is READ-ONLY and informational.

The glossary entries SHALL be:
- **Session Memory**: Memória mantida durante a sessão ativa.忘れた情報を保持し、会话中に参照できる。
- **Memory Scope**: Define se os dados ficam só na sessão (temporário) ou persistem entre sessões (permanente).
- **Memory Max Entries**: Limite máximo de entradas armazenadas antes de pruning automático.
- **Shared Memory**: Permite compartilhamento de memória com outros agentes especificados no sistema.
- **Retention Period**: Período de retenção antes de os dados serem descartados. Não aplicável para memória de sessão.

#### Scenario: Glossary collapsed by default
- **WHEN** the MemoryTab is first rendered
- **THEN** the glossary section is collapsed (collapsed state, chevron pointing right)

#### Scenario: Glossary expands on click
- **WHEN** the user clicks the glossary header
- **THEN** the section expands showing all five glossary entries and the chevron points down

#### Scenario: Glossary collapses on second click
- **WHEN** the glossary is expanded and the user clicks the header again
- **THEN** the glossary collapses back to the collapsed state
