// Tipos compartilhados para componentes de UI

export type ValidationError = {
  message: string;
  severity?: 'error' | 'warning';
};

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info';

export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';

export type RetryPolicy = {
  maxRetries: number;
  delay: number;
  backoffStrategy: BackoffStrategy;
  retryableErrors: string[];
};

export type AuditMetadata = {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version: number;
};

export type JSONSchema = {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
};

// Props types para os componentes
export type FormSectionProps = {
  title: string;
  description?: string;
  error?: ValidationError;
  children: React.ReactNode;
  className?: string;
};

export type FormSectionHeaderProps = {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: BadgeVariant;
  };
  actions?: React.ReactNode;
  className?: string;
};

export type JSONEditorProps = {
  value: object | string;
  onChange: (value: string, isValid: boolean, parsed?: object) => void;
  schema?: JSONSchema;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
};

export type RetryPolicyFormProps = {
  value: RetryPolicy;
  onChange: (policy: RetryPolicy) => void;
  disabled?: boolean;
  className?: string;
};

export type AuditMetadataDisplayProps = {
  metadata: AuditMetadata;
  variant?: 'row' | 'badges' | 'compact';
  showVersion?: boolean;
  className?: string;
};
