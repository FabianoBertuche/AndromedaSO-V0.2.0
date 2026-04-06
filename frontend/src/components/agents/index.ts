export { AgentFormField } from './AgentFormField.js';
export type { AgentFormFieldProps } from './AgentFormField.js';

// Componentes reutilizáveis
export { FormSection } from './FormSection.js';
export { FormSectionHeader } from './FormSectionHeader.js';
export { JSONEditor } from './JSONEditor.js';
export { RetryPolicyForm } from './RetryPolicyForm.js';
export { AuditMetadataDisplay } from './AuditMetadataDisplay.js';

// ResolvedConfigPanel
export { ResolvedConfigPanel } from './ResolvedConfigPanel.js';

// Componentes de tabs de agentes
export { IdentityTab } from './tabs/IdentityTab.js';
export { ModelTab } from './tabs/ModelTab.js';
export { HistoryTab } from './tabs/HistoryTab.js';
export { PerformanceTab } from './tabs/PerformanceTab.js';
export { SuggestionsTab } from './tabs/SuggestionsTab.js';
export { BehaviorTab } from './tabs/BehaviorTab.js';
export { SafeguardsTab } from './tabs/SafeguardsTab.js';
export { SandboxTab } from './tabs/SandboxTab.js';
export { ChatTab } from './tabs/ChatTab.js';
export { CapabilitiesTab } from './tabs/CapabilitiesTab.js';
export { ChannelsTab } from './tabs/ChannelsTab.js';

// Types das tabs
export type { ModelTabProps } from './tabs/ModelTab.js';

// Re-export types
export type {
  FormSectionProps,
  FormSectionHeaderProps,
  BadgeVariant,
  JSONEditorProps,
  JSONSchema,
  RetryPolicyFormProps,
  RetryPolicy,
  BackoffStrategy,
  AuditMetadataDisplayProps,
  AuditMetadata,
  ValidationError
} from '../../types/ui.js';
