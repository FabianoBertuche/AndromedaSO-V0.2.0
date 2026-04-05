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

export type ProviderVariant = 'ollama' | 'openai-api' | 'openai-oauth';

export type ProviderVariantAuthMode = 'api-key' | 'base-url' | 'oauth-manual';

export type ProviderConsoleFieldName =
  | 'apiKey'
  | 'baseUrl'
  | 'organization'
  | 'callbackUrl'
  | 'code'
  | 'state'
  | 'redirectUri';

export interface ProviderHealthSummary {
  status: 'ok' | 'warning' | 'degraded' | 'error' | 'unknown';
  message: string;
  latencyMs?: number;
  checkedAt?: string;
  details?: Record<string, unknown>;
}

export interface ProviderVariantCatalogItem {
  variant: ProviderVariant;
  moduleId?: string;
  group?: 'providers';
  authMode: ProviderVariantAuthMode;
  displayName: string;
  description?: string;
  capabilities: string[];
  requiredFields: string[];
  optionalFields: string[];
  status?: string;
  saveAllowsDegradedHealth?: boolean;
}

export interface ProviderVariantCatalogResponse {
  group: 'providers';
  variants: ProviderVariantCatalogItem[];
}

export interface ProviderConnectionTestRequest {
  variant: ProviderVariant;
  config?: {
    apiKey?: string;
    baseUrl?: string;
    organization?: string;
  };
  auth?: {
    mode?: ProviderVariantAuthMode;
    callbackUrl?: string;
    code?: string;
    state?: string;
  };
}

export interface ProviderConnectionTestResponse {
  variant: ProviderVariant;
  ok: boolean;
  health: ProviderHealthSummary;
  validatedFields: string[];
}

export interface ProviderConsoleSavePayload {
  variant: ProviderVariant;
  name?: string;
  selectedModelIds?: string[];
  config?: {
    apiKey?: string;
    baseUrl?: string;
    organization?: string;
  };
  auth?: {
    mode?: ProviderVariantAuthMode;
    callbackUrl?: string;
    code?: string;
    state?: string;
  };
}

export interface ConsoleApiError extends Error {
  code?: string;
  health?: ProviderHealthSummary;
  details?: Record<string, unknown>;
}

export type AuthMode =
  | 'none'
  | 'api-key'
  | 'api-key-baseurl'
  | 'oauth-apikey'
  | 'aws-credentials';

export type AuthConfig = {
  mode: AuthMode;
  apiKeyPlaceholder?: string;
  baseUrlPlaceholder?: string;
  baseUrlRequired: boolean;
  baseUrlVisible: boolean;
  credentialUrl?: string;
  hasOAuth: boolean;
};

export interface ProviderConfig {
  type: ProviderType;
  variant?: ProviderVariant;
  name?: string;
  apiKey?: string;
  baseUrl?: string;
  organization?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface Provider {
  id: string;
  name: string;
  type: ProviderType;
  variant?: ProviderVariant;
  authMode?: ProviderVariantAuthMode;
  displayName?: string;
  baseUrl?: string;
  health: string;
  latencyMs?: number;
  modelsCount: number;
  selectedModelIds?: string[];
  healthDetails?: ProviderHealthSummary;
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

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
}

export interface ChatModelOption {
  providerId: string;
  providerName: string;
  modelId: string;
  displayName: string;
  label: string;
}

export interface SendChatMessageRequest {
  modelId: string;
  messages: Array<{
    role: ChatRole;
    content: string;
  }>;
}

export interface SendChatMessageResponse {
  message: {
    role: 'assistant';
    content: string;
  };
}
