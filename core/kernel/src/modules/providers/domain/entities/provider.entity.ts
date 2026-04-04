export type ProviderType =
  | 'openai'
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

export type TaskType = 'coding' | 'chat';

export type Provider = {
  id: string;
  name: string;
  type: ProviderType;
  apiKeyEnc?: string;
  baseUrl?: string;
  health: 'ok' | 'warning' | 'error';
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
  name?: string;
  apiKey?: string;
  baseUrl?: string;
};
