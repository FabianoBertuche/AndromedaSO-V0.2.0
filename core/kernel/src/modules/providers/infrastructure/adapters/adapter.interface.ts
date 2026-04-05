import type { ModelCatalogItem } from '../../domain/entities/provider.entity.js';

export type ProviderChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ProviderChatResult = {
  message: {
    role: 'assistant';
    content: string;
  };
};

export type ProviderAdapterChatErrorCode = 'PROVIDER_UNREACHABLE' | 'UPSTREAM_CHAT_FAILED' | 'PROVIDER_CHAT_UNSUPPORTED';

export class ProviderAdapterChatError extends Error {
  constructor(
    readonly code: ProviderAdapterChatErrorCode,
    message: string
  ) {
    super(message);
  }
}

export function createProviderAdapterChatError(code: ProviderAdapterChatErrorCode, message: string): ProviderAdapterChatError {
  return new ProviderAdapterChatError(code, message);
}

export function createUnsupportedProviderChatError(providerName: string): ProviderAdapterChatError {
  return createProviderAdapterChatError('PROVIDER_CHAT_UNSUPPORTED', `${providerName} chat is not supported by this adapter.`);
}

export function withUnsupportedChat(
  adapter: Omit<ProviderAdapter, 'chat'>,
  providerName: string
): ProviderAdapter {
  return {
    ...adapter,
    async chat() {
      throw createUnsupportedProviderChatError(providerName);
    }
  };
}

export interface ProviderAdapter {
  listModels(): Promise<Array<Omit<ModelCatalogItem, 'id' | 'providerId'>>>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
  chat(modelId: string, messages: ProviderChatMessage[]): Promise<ProviderChatResult>;
}

export type AdapterFactory = (apiKey?: string, baseUrl?: string) => ProviderAdapter;
