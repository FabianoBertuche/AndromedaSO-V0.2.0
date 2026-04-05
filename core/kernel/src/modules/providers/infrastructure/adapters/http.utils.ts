import {
  createProviderAdapterChatError,
  type ProviderChatMessage,
  type ProviderChatResult,
  ProviderAdapterChatError
} from './adapter.interface.js';

/**
 * Shared HTTP utilities for provider adapters.
 * Uses native fetch and AbortController (Node 20+) — no additional dependencies.
 */

type OpenAiCompatibleChatOptions = {
  url: string;
  modelId: string;
  messages: ProviderChatMessage[];
  headers: Record<string, string>;
  timeoutMs?: number;
};

type OpenAiCompatibleChatResponse = {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function pingWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await fetchWithTimeout(url, options, timeoutMs);
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: timeoutMs };
  }
}

export function isProviderConnectionFailure(error: unknown): boolean {
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

function extractAssistantContent(payload: OpenAiCompatibleChatResponse): string | null {
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

export async function chatWithOpenAiCompatibleApi(options: OpenAiCompatibleChatOptions): Promise<ProviderChatResult> {
  try {
    const response = await fetchWithTimeout(options.url, {
      method: 'POST',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.modelId,
        messages: options.messages
      })
    }, options.timeoutMs ?? 30000);

    if (!response.ok) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Provider chat request failed upstream.');
    }

    const payload = await response.json() as OpenAiCompatibleChatResponse;
    const content = extractAssistantContent(payload);

    if (!content) {
      throw createProviderAdapterChatError('UPSTREAM_CHAT_FAILED', 'Provider chat returned an invalid assistant message.');
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

    throw createProviderAdapterChatError(
      isProviderConnectionFailure(error) ? 'PROVIDER_UNREACHABLE' : 'UPSTREAM_CHAT_FAILED',
      isProviderConnectionFailure(error)
        ? 'Provider is unavailable or unreachable.'
        : 'Provider chat request failed upstream.'
    );
  }
}
