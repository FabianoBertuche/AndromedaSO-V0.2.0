## ADDED Requirements

### Requirement: agent-behavior-tab-edits-via-overrides

The BehaviorTab component SHALL edit agent behavior fields via the `agent.overrides.*` nested path. Specifically: `soul`, `voice`, `responseStyle` as string fields, and `rules`, `playbook`, `context` as nested objects containing their respective sub-fields.

#### Scenario: Soul field edit via overrides
- **WHEN** the user edits the Soul textarea in the Soul sub-tab
- **THEN** the component calls `onChange({ overrides: { soul: <value> } })`

#### Scenario: Voice field edit via overrides
- **WHEN** the user edits the Voice textarea in the Voice sub-tab
- **THEN** the component calls `onChange({ overrides: { voice: <value> } })`

#### Scenario: Rules nested edit via overrides
- **WHEN** the user modifies any Rules sub-section (Must, Must Not, etc.)
- **THEN** the component calls `onChange({ overrides: { rules: { <subField>: <values> } } })`

#### Scenario: Playbook nested edit via overrides
- **WHEN** the user modifies any Playbook phase (Start, Execute, Review, Report)
- **THEN** the component calls `onChange({ overrides: { playbook: { <phase>: <values> } } })`

#### Scenario: Context nested edit via overrides
- **WHEN** the user modifies any Context sub-section (Stack, Architecture, etc.)
- **THEN** the component calls `onChange({ overrides: { context: { <subField>: <values> } } })`

#### Scenario: ResponseStyle field edit via overrides
- **WHEN** the user edits the ResponseStyle textarea
- **THEN** the component calls `onChange({ overrides: { responseStyle: <value> } })`

---

### Requirement: agent-behavior-tab-soul-fields

The Soul sub-tab SHALL include three additional fields beyond the soul text field: `persona` (text input), `interactionMode` (dropdown), and `defaultLanguage` (text input). All three SHALL be editable via `agent.overrides.*`.

#### Scenario: Persona field edit
- **WHEN** the user types in the persona text input within the Soul sub-tab
- **THEN** `onChange({ overrides: { persona: <value> } })` is called

#### Scenario: InteractionMode dropdown
- **WHEN** the user selects a value from the interactionMode dropdown
- **THEN** `onChange({ overrides: { interactionMode: <value> } })` is called with one of: `reactive`, `proactive`, `guided`, `strict`

#### Scenario: DefaultLanguage field edit
- **WHEN** the user types in the defaultLanguage text input within the Soul sub-tab
- **THEN** `onChange({ overrides: { defaultLanguage: <value> } })` is called

---

### Requirement: agent-behavior-tab-chiplist-colors

The ChipList components within the Rules sub-tab SHALL display per-section border and background colors as specified:

| Rules Section | Border Color | Background Color |
|---|---|---|
| Must | `border-red-500/50` | `bg-red-500/10` |
| Must Not | `border-red-500/50` | `bg-red-500/10` |
| Delegate When | `border-yellow-500/50` | `bg-yellow-500/10` |
| Review When | `border-yellow-500/50` | `bg-yellow-500/10` |
| Feedback When | `border-yellow-500/50` | `bg-yellow-500/10` |
| Evidence When | `border-yellow-500/50` | `bg-yellow-500/10` |
| Interrupt When | `border-orange-500/50` | `bg-orange-500/10` |

The ChipList components within the Playbook sub-tab SHALL display per-phase border and background colors as specified:

| Playbook Phase | Border Color | Background Color |
|---|---|---|
| Start | `border-cyan-500/50` | `bg-cyan-500/10` |
| Execute | `border-cyan-500/50` | `bg-cyan-500/10` |
| Review | `border-yellow-500/50` | `bg-yellow-500/10` |
| Report | `border-yellow-500/50` | `bg-yellow-500/10` |

The ChipList components within the Context sub-tab SHALL use the default cyan color scheme (no color override).

#### Scenario: Rules Must chip displays red color
- **WHEN** the Rules sub-tab is active and the Must section has items
- **THEN** each chip in Must has `border-red-500/50 bg-red-500/10`

#### Scenario: Playbook Start chip displays cyan color
- **WHEN** the Playbook sub-tab is active and the Start phase has items
- **THEN** each chip in Start has `border-cyan-500/50 bg-cyan-500/10`

---

### Requirement: agent-behavior-tab-info-boxes

Each Behavior sub-tab (Soul, Voice, Rules, Playbook, Context, Response Style) SHALL display an Info Box at the top of the tab content. The Info Box SHALL be a Card component with `border-slate-600` and a descriptive paragraph explaining what that section controls.

#### Scenario: Soul info box displays description
- **WHEN** the Soul sub-tab is active
- **THEN** an Info Box is shown at the top with text: "Soul — texto livre para definir a essência do agente: personalidade, origem e valores."

#### Scenario: Voice info box displays description
- **WHEN** the Voice sub-tab is active
- **THEN** an Info Box is shown at the top with text: "Voice — tom, presença e ritmo de comunicação do agente."

#### Scenario: Rules info box displays description
- **WHEN** the Rules sub-tab is active
- **THEN** an Info Box is shown at the top with text: "Rules — lista de regras que o agente não pode quebrar, mesmo que o usuário insista."

#### Scenario: Playbook info box displays description
- **WHEN** the Playbook sub-tab is active
- **THEN** an Info Box is shown at the top with text: "Playbook — método passo a passo que o agente deve seguir."

#### Scenario: Context info box displays description
- **WHEN** the Context sub-tab is active
- **THEN** an Info Box is shown at the top with text: "Context — informações estáveis de background sobre o ambiente onde o agente trabalha."

#### Scenario: Response Style info box displays description
- **WHEN** the Response Style sub-tab is active
- **THEN** an Info Box is shown at the top with text: "Response Style — como o agente organiza e entrega respostas: fluidez, estrutura e formato."