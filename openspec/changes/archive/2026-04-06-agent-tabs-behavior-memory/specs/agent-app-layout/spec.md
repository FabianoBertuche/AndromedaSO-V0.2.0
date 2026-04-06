## ADDED Requirements

### Requirement: agent-app-layout-full-width-agents-area

The `<main>` element wrapping the `<Agents />` component in App.tsx SHALL use `w-full min-h-[calc(100vh-8rem)]` to ensure the agents tab area occupies the full available viewport width and height.

#### Scenario: Agents tab uses full width
- **WHEN** the user navigates to the agents tab (`/?tab=agents`)
- **THEN** the `<main>` containing `<Agents />` has class `w-full min-h-[calc(100vh-8rem)]`
- **AND** no parent container imposes a `max-w-*` constraint on the agents area

### Requirement: agent-app-layout-full-width-all-tabs

All tab content areas in App.tsx SHALL use full available width. Each tab's `<main>` wrapper SHALL use `w-full` class.

#### Scenario: All tab areas use full width
- **WHEN** the user navigates to any tab (dashboard, agents, costs, models, chat, router)
- **THEN** the `<main>` wrapper for that tab has class `w-full`
- **AND** no horizontal dead space (empty gutters) appears on the left or right sides of the content
