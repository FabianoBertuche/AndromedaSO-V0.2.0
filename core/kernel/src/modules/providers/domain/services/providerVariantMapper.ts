import type {
  Provider,
  ProviderAuthMode,
  ProviderConfig,
  ProviderType,
  PublicProviderVariant
} from '../entities/provider.entity.js';

export type ConsoleVariantDefinition = {
  variant: PublicProviderVariant;
  runtimeType: ProviderType;
  authMode: ProviderAuthMode;
  displayName: string;
  description: string;
  requiredFields: string[];
  optionalFields: string[];
  saveAllowsDegradedHealth: boolean;
};

export type ProviderConsoleSavePayload = {
  variant: PublicProviderVariant;
  name?: string;
  selectedModelIds?: string[];
  config?: {
    apiKey?: string;
    baseUrl?: string;
    organization?: string;
  };
  auth?: {
    mode?: ProviderAuthMode;
    callbackUrl?: string;
    code?: string;
    state?: string;
  };
};

const consoleVariantDefinitions: Record<PublicProviderVariant, ConsoleVariantDefinition> = {
  ollama: {
    variant: 'ollama',
    runtimeType: 'ollama',
    authMode: 'base-url',
    displayName: 'Ollama',
    description: 'Connect a local or remote Ollama endpoint by base URL.',
    requiredFields: ['baseUrl'],
    optionalFields: [],
    saveAllowsDegradedHealth: true
  },
  'openai-api': {
    variant: 'openai-api',
    runtimeType: 'openai',
    authMode: 'api-key',
    displayName: 'OpenAI API',
    description: 'Use a direct OpenAI API key flow with optional base URL override.',
    requiredFields: ['apiKey'],
    optionalFields: ['baseUrl', 'organization'],
    saveAllowsDegradedHealth: true
  },
  'openai-oauth': {
    variant: 'openai-oauth',
    runtimeType: 'openai-codex',
    authMode: 'oauth-manual',
    displayName: 'OpenAI OAuth',
    description: 'Use the manual OpenAI OAuth completion flow without collecting a raw secret.',
    requiredFields: ['callbackUrl|code+state'],
    optionalFields: [],
    saveAllowsDegradedHealth: false
  }
};

export function isConsoleVariant(value: string): value is PublicProviderVariant {
  return value === 'ollama' || value === 'openai-api' || value === 'openai-oauth';
}

export function listConsoleVariantDefinitions(): ConsoleVariantDefinition[] {
  return Object.values(consoleVariantDefinitions);
}

export function getConsoleVariantDefinition(variant: PublicProviderVariant): ConsoleVariantDefinition {
  return consoleVariantDefinitions[variant];
}

export function mapPublicVariantToRuntimeType(variant: PublicProviderVariant): ProviderType {
  return getConsoleVariantDefinition(variant).runtimeType;
}

export function inferPublicVariantFromProvider(provider: Pick<Provider, 'type' | 'variant'>): PublicProviderVariant | null {
  if (provider.variant && isConsoleVariant(provider.variant)) {
    return provider.variant;
  }

  switch (provider.type) {
    case 'openai':
      return 'openai-api';
    case 'openai-codex':
      return 'openai-oauth';
    case 'ollama':
      return 'ollama';
    default:
      return null;
  }
}

export function mapProviderToConsoleMetadata<TProvider extends Provider>(provider: TProvider): TProvider & {
  variant?: PublicProviderVariant;
  authMode?: ProviderAuthMode;
} {
  const variant = inferPublicVariantFromProvider(provider) ?? undefined;
  const definition = variant ? getConsoleVariantDefinition(variant) : undefined;

  return {
    ...provider,
    variant,
    authMode: definition?.authMode
  };
}

export function isProviderConsoleSavePayload(body: unknown): body is ProviderConsoleSavePayload {
  if (!body || typeof body !== 'object') {
    return false;
  }

  const maybeVariant = (body as { variant?: unknown }).variant;
  return typeof maybeVariant === 'string' && isConsoleVariant(maybeVariant);
}

export function mapConsoleSavePayloadToProviderConfig(payload: ProviderConsoleSavePayload): ProviderConfig {
  const definition = getConsoleVariantDefinition(payload.variant);

  return {
    type: definition.runtimeType,
    variant: payload.variant,
    authMode: definition.authMode,
    name: payload.name,
    apiKey: payload.config?.apiKey,
    baseUrl: payload.config?.baseUrl,
    organization: payload.config?.organization
  };
}
