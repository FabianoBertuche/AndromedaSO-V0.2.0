export type ProviderType =
  | 'openai'
  | 'openai-codex'
  | 'anthropic'
  | 'google'
  | 'xai'
  | 'mistral'
  | 'groq'
  | 'together'
  | 'fireworks'
  | 'deepinfra'
  | 'novita'
  | 'ollama'
  | 'lmstudio'
  | 'vllm'
  | 'openrouter'
  | 'hyperbolic'
  | 'replicate'
  | 'aws-bedrock'
  | 'azure-openai'
  | 'google-vertex'
  | 'cohere';

export type PublicProviderVariant = 'ollama' | 'openai-api' | 'openai-oauth';

export type ProviderAuthMode = 'api-key' | 'base-url' | 'oauth-manual';

export type StructuredProviderHealth = {
  status: 'ok' | 'warning' | 'degraded' | 'error' | 'unknown';
  message: string;
  latencyMs?: number;
  checkedAt?: string;
  details?: Record<string, unknown>;
};

export type TaskType = 'coding' | 'chat';

export type Provider = {
  id: string;
  name: string;
  type: ProviderType;
  variant?: PublicProviderVariant;
  authMode?: ProviderAuthMode;
  apiKeyEnc?: string;
  baseUrl?: string;
  health: 'ok' | 'warning' | 'error';
  healthDetails?: StructuredProviderHealth;
  createdAt: string;
  selectedModelIds: string[];
};

export type ModelCatalogItem = {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  contextWindow: string;
  capabilities: Array<'coding' | 'chat' | 'analysis' | 'reasoning'>;
  priceLabel: string;
  score: number;
  latencyMs: number;
};

export type ModelBenchmarkResult = {
  id: string;
  modelId: string;
  taskType: TaskType;
  score: number;
  latencyMs: number;
  executedAt: string;
  simulated?: boolean;
};

export type ProviderConfig = {
  type: ProviderType;
  variant?: PublicProviderVariant;
  authMode?: ProviderAuthMode;
  name?: string;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
};
