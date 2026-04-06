## ADDED Requirements

### Requirement: agent-effective-types-export

The frontend type definitions file `frontend/src/types/kernel.ts` SHALL export the following four Effective types that are currently defined but not exported:

- `EffectiveBehaviorProfile` (lines 87–93 in kernel.ts — fields: persona, tone, style, interactionMode, behaviorProfile)
- `EffectiveExecutionPolicy` (lines 95–109 — fields: temperature, topP, maxTokens, responseFormat, reasoningMode, timeoutMs, retryPolicy, toolsEnabled, knowledgeEnabled, memoryEnabled, routingEnabled, handoffEnabled, humanEscalationEnabled)
- `EffectiveChannelPolicy` (lines 111–115 — fields: allowedChannels, defaultChannelBehavior, channelOverrides)
- `EffectiveModelPolicy` (lines 117–122 — fields: preferredModel, allowedModels, providerConstraints, reasoningMode)

These types SHALL be exported using TypeScript's `export type` syntax and SHALL be importable by consumer modules via `import type { EffectiveBehaviorProfile } from '../../../types/kernel.js'`.

#### Scenario: EffectiveBehaviorProfile is importable
- **WHEN** a consumer module runs `import type { EffectiveBehaviorProfile } from '../../../types/kernel.js'`
- **THEN** no TypeScript compilation error occurs

#### Scenario: All four Effective types are exported
- **WHEN** a consumer runs `import type { EffectiveBehaviorProfile, EffectiveExecutionPolicy, EffectiveChannelPolicy, EffectiveModelPolicy } from '../../../types/kernel.js'`
- **THEN** all four types are successfully imported without errors

#### Scenario: Types are structurally identical to current definitions
- **WHEN** the `export` keyword is added to the four types
- **THEN** the type shapes remain unchanged from their current definitions in kernel.ts
