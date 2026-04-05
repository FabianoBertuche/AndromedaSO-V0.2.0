import type { AuthConfig, ProviderType } from '../types/model';

export function getAuthConfig(type: ProviderType | string): AuthConfig {
  switch (type) {
    // ── Sem autenticação ──────────────────────────────────────────────
    case 'ollama':
      return {
        mode: 'none',
        baseUrlPlaceholder: 'http://127.0.0.1:11434',
        baseUrlRequired: false,
        baseUrlVisible: true,
        hasOAuth: false,
      };
    case 'lmstudio':
      return {
        mode: 'none',
        baseUrlPlaceholder: 'http://localhost:1234',
        baseUrlRequired: false,
        baseUrlVisible: true,
        hasOAuth: false,
      };
    case 'vllm':
      return {
        mode: 'none',
        baseUrlPlaceholder: 'http://localhost:8000',
        baseUrlRequired: true,
        baseUrlVisible: true,
        hasOAuth: false,
      };

    // ── API Key simples ───────────────────────────────────────────────
    case 'anthropic':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'sk-ant-...',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://console.anthropic.com/settings/keys',
        hasOAuth: false,
      };
    case 'groq':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'gsk_...',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://console.groq.com/keys',
        hasOAuth: false,
      };
    case 'mistral':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://console.mistral.ai/api-keys/',
        hasOAuth: false,
      };
    case 'together':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://api.together.xyz/settings/api-keys',
        hasOAuth: false,
      };
    case 'fireworks':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://fireworks.ai/account/api-keys',
        hasOAuth: false,
      };
    case 'deepinfra':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://deepinfra.com/dash/api_keys',
        hasOAuth: false,
      };
    case 'novita':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://novita.ai/settings/key-management',
        hasOAuth: false,
      };
    case 'openrouter':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'sk-or-...',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://openrouter.ai/keys',
        hasOAuth: false,
      };
    case 'hyperbolic':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://app.hyperbolic.xyz/settings',
        hasOAuth: false,
      };
    case 'replicate':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'r8_...',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://replicate.com/account/api-tokens',
        hasOAuth: false,
      };
    case 'cohere':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://dashboard.cohere.com/api-keys',
        hasOAuth: false,
      };
    case 'xai':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'xai-...',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://console.x.ai/',
        hasOAuth: false,
      };

    // ── API Key + BaseUrl obrigatória ─────────────────────────────────
    case 'azure-openai':
      return {
        mode: 'api-key-baseurl',
        apiKeyPlaceholder: 'API Key',
        baseUrlPlaceholder: 'https://meu-recurso.openai.azure.com/',
        baseUrlRequired: true,
        baseUrlVisible: true,
        credentialUrl: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI',
        hasOAuth: false,
      };
    case 'google-vertex':
      return {
        mode: 'api-key-baseurl',
        apiKeyPlaceholder: 'API Key',
        baseUrlPlaceholder: 'https://us-central1-aiplatform.googleapis.com/',
        baseUrlRequired: true,
        baseUrlVisible: true,
        credentialUrl: 'https://console.cloud.google.com/apis/credentials',
        hasOAuth: false,
      };

    // ── API Key OpenAI Platform ───────────────────────────────────────
    case 'openai':
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'sk-...',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://platform.openai.com/api-keys',
        hasOAuth: false,
      };
    case 'openai-codex':
      return {
        mode: 'none',
        baseUrlRequired: false,
        baseUrlVisible: false,
        hasOAuth: true,
      };

    // ── OAuth + API Key ───────────────────────────────────────────────
    case 'google':
      return {
        mode: 'oauth-apikey',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://aistudio.google.com/app/apikey',
        hasOAuth: true,
      };

    // ── AWS Credentials ───────────────────────────────────────────────
    case 'aws-bedrock':
      return {
        mode: 'aws-credentials',
        baseUrlRequired: false,
        baseUrlVisible: false,
        credentialUrl: 'https://console.aws.amazon.com/iam/home#/security_credentials',
        hasOAuth: false,
      };

    // ── Fallback seguro ───────────────────────────────────────────────
    default:
      return {
        mode: 'api-key',
        apiKeyPlaceholder: 'API Key',
        baseUrlRequired: false,
        baseUrlVisible: false,
        hasOAuth: false,
      };
  }
}
