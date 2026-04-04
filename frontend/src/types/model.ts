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

export interface ProviderConfig {
  type: ProviderType;
  name?: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  displayName?: string;
  baseUrl?: string;
  health: string;
  latencyMs?: number;
  modelsCount: number;
  selectedModelIds?: string[];
}

export interface ModelBenchmark {
  modelId: string;
  taskType: 'coding' | 'chat';
  score: number;
  latencyMs: number;
  simulated?: boolean;
}

export interface CatalogModel {
  id: string;
  modelId: string;
  displayName: string;
  contextWindow: string;
  capabilities: string[];
  priceLabel: string;
  score: number;
  latencyMs: number;
}
