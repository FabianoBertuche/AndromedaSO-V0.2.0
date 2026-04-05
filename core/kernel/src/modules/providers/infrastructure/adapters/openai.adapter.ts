/**
 * @adapter OpenAI Adapter
 *
 * Realiza chamadas HTTP reais à API da OpenAI quando uma apiKey é fornecida.
 * Degrada graciosamente para dados de seed quando a apiKey está ausente ou a requisição falha.
 *
 * Referência: https://platform.openai.com/docs/api-reference/models/list
 */
import pino from 'pino';
import {
  createProviderAdapterChatError,
  type AdapterFactory,
  type ProviderChatMessage,
  type ProviderChatResult,
  ProviderAdapterChatError
} from './adapter.interface.js';
import { fetchWithTimeout, pingWithTimeout } from './http.utils.js';
import { listSeedModels } from './providerCatalog.js';

const log = pino({ name: 'adapter:openai' });

const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';
const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';
const ALLOWED_PREFIXES = ['gpt-', 'o1', 'o3', 'o4'];

interface OpenAIModel {
  id: string;
  object: string;
}

interface OpenAIModelsResponse {
  data: OpenAIModel[];
  object: 'list';
}

interface OpenAIChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
}

function isOpenAiConnectionFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  return [
    'econnrefused',
    'enotfound',
    'fetch failed',
    'network',
    'timeout',
    'abort',
    'unreachable',
    'socket'
  ].some((term) => message.includes(term));
}

function extractOpenAiAssistantContent(payload: OpenAIChatCompletionResponse): string | null {
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content === 'string') {
    const normalizedContent = content.trim();
    return normalizedContent ? normalizedContent : null;
  }

  if (Array.isArray(content)) {
    const normalizedContent = content
      .filter((item) => item.type === 'text' && typeof item.text === 'string')
      .map((item) => item.text?.trim() ?? '')
      .filter(Boolean)
      .join('\n')
      .trim();

    return normalizedContent || null;
  }

  return null;
}

export const openAiAdapterFactory: AdapterFactory = (apiKey, _baseUrl) => ({
  async listModels() {
    if (!apiKey) {
      // Retorna dados de seed estáticos — apiKey não configurada.
      return listSeedModels('openai');
    }
    try {
      const res = await fetchWithTimeout(
        OPENAI_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        5000
      );
      const json = await res.json() as OpenAIModelsResponse;
      return json.data
        .filter((m) => ALLOWED_PREFIXES.some((p) => m.id.startsWith(p)))
        .map((m) => ({
          modelId: m.id,
          displayName: m.id,
          contextWindow: 'unknown',
          capabilities: ['chat'] as Array<'coding' | 'chat' | 'analysis' | 'reasoning'>,
          priceLabel: 'N/A',
          score: 0,
          latencyMs: 0
        }));
    } catch (err) {
      log.warn({ err }, 'openai listModels falhou, usando seed');
      return listSeedModels('openai');
    }
  },

  async ping() {
    if (!apiKey) {
      // Latência fixa simulada — apiKey não configurada.
      return { ok: true, latencyMs: 110 };
    }
    return pingWithTimeout(
      OPENAI_MODELS_URL,
        { headers: { Authorization: `Bearer ${apiKey}` } },
        3000
    );
  },

  async chat(modelId: string, messages: ProviderChatMessage[]): Promise<ProviderChatResult> {
    if (!apiKey) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'OpenAI chat requires a configured API key.');
    }

    try {
      const response = await fetchWithTimeout(OPENAI_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: modelId,
          messages
        })
      }, 30000);

      if (!response.ok) {
        log.warn({ modelId, status: response.status }, 'openai chat returned non-ok response');
        throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'OpenAI chat request failed upstream.');
      }

      const payload = await response.json() as OpenAIChatCompletionResponse;
      const content = extractOpenAiAssistantContent(payload);

      if (!content) {
        throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'OpenAI chat returned an invalid assistant message.');
      }

      return {
        message: {
          role: 'assistant',
          content
        }
      };
    } catch (error) {
      if (error instanceof ProviderAdapterChatError) {
        throw error;
      }

      log.warn({ modelId, errorMessage: error instanceof Error ? error.message : 'Unknown error' }, 'openai chat request failed');
      throw createProviderAdapterChatError(
        isOpenAiConnectionFailure(error) ? 'PROVIDER_UNREACHABLE' : 'UPSTREAM_CHAT_FAILED',
        isOpenAiConnectionFailure(error)
          ? 'OpenAI provider is unavailable or unreachable.'
          : 'OpenAI chat request failed upstream.'
      );
    }
  }
});

// Backward-compatible export for existing code that imports openAiAdapter directly
export const openAiAdapter = openAiAdapterFactory();
