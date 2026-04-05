import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildChatModelOptions, getProviderCatalog, listProviders, sendModelChatMessage } from '../api/kernel';
import type { CatalogModel, ChatMessage, ChatModelOption, ConsoleApiError } from '../types/model';

function createChatMessageId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readErrorMessage(error: unknown): string {
  const fallbackMessage = 'Unable to send the message right now. Please try again.';

  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? (error as ConsoleApiError).code
    : undefined;

  if (errorCode === 'MODEL_NOT_FOUND') {
    return 'The selected model is no longer available.';
  }

  if (errorCode === 'MODEL_AMBIGUOUS') {
    return 'This model is ambiguous across providers and cannot be used for chat right now.';
  }

  if (errorCode === 'PROVIDER_NOT_FOUND') {
    return 'The provider for this model is no longer available.';
  }

  if (errorCode === 'PROVIDER_UNREACHABLE') {
    return 'The selected provider is unavailable or unreachable right now.';
  }

  if (errorCode === 'UPSTREAM_CHAT_FAILED') {
    return 'The model could not produce a reply right now.';
  }

  if (errorCode === 'INVALID_CHAT_PAYLOAD') {
    return 'The message could not be sent because the chat payload was invalid.';
  }

  if (error instanceof Error) {
    const trimmedMessage = error.message.trim();

    if (!trimmedMessage) {
      return fallbackMessage;
    }

    if (/^Failed to fetch$/i.test(trimmedMessage)
      || /^NetworkError/i.test(trimmedMessage)
      || /^Load failed$/i.test(trimmedMessage)
      || /^Kernel request failed: \d+$/i.test(trimmedMessage)
      || /^Provider chat failed: \d+$/i.test(trimmedMessage)
      || /^Invalid provider chat response\.?$/i.test(trimmedMessage)) {
      return fallbackMessage;
    }

    return trimmedMessage;
  }

  return fallbackMessage;
}

export function useModelChatConsole(): {
  modelOptions: ChatModelOption[];
  selectedModelId: string | null;
  messages: ChatMessage[];
  draft: string;
  isLoadingModels: boolean;
  isSending: boolean;
  errorMessage: string | null;
  modelsError: Error | null;
  modelNotices: string[];
  setDraft: (value: string) => void;
  selectModel: (modelId: string) => void;
  sendMessage: () => Promise<void>;
  clearConversation: () => void;
} {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const modelsQuery = useQuery({
    queryKey: ['chat-model-options'],
    queryFn: async () => {
      const providersResponse = await listProviders();
      const catalogResults = await Promise.allSettled(
        providersResponse.providers.map(async (provider) => getProviderCatalog(provider.id))
      );

      const availableCatalogs: Array<{ providerId: string; selectedModelIds: string[]; models: CatalogModel[] }> = [];
      let hasIgnoredCatalogFailures = false;

      catalogResults.forEach((result) => {
        if (result.status === 'rejected') {
          hasIgnoredCatalogFailures = true;
          return;
        }

        availableCatalogs.push(result.value);
      });

      const { options, ambiguousModelIds } = buildChatModelOptions(providersResponse.providers, availableCatalogs);
      const modelNotices: string[] = [];

      if (hasIgnoredCatalogFailures) {
        modelNotices.push('Some provider catalogs could not be loaded and were ignored.');
      }

      if (ambiguousModelIds.length > 0) {
        modelNotices.push('Ambiguous model IDs were hidden from chat because multiple providers expose the same modelId.');
      }

      return {
        options,
        modelNotices
      };
    }
  });

  const modelOptions = useMemo(() => modelsQuery.data?.options ?? [], [modelsQuery.data]);
  const modelNotices = useMemo(() => modelsQuery.data?.modelNotices ?? [], [modelsQuery.data]);

  useEffect(() => {
    if (modelOptions.length === 0) {
      setSelectedModelId(null);
      return;
    }

    if (selectedModelId && modelOptions.some((option) => option.modelId === selectedModelId)) {
      return;
    }

    setSelectedModelId(modelOptions[0].modelId);
  }, [modelOptions, selectedModelId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setErrorMessage(null);
  }, []);

  const selectModel = useCallback((modelId: string) => {
    setSelectedModelId((currentModelId) => {
      if (currentModelId === modelId) {
        return currentModelId;
      }

      setMessages([]);
      setErrorMessage(null);
      return modelId;
    });
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmedDraft = draft.trim();

    if (!selectedModelId || !trimmedDraft || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createChatMessageId(),
      role: 'user',
      content: trimmedDraft
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft('');
    setErrorMessage(null);
    setIsSending(true);

    try {
      const response = await sendModelChatMessage({
        modelId: selectedModelId,
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createChatMessageId(),
          role: 'assistant',
          content: response.message.content
        }
      ]);
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, messages, selectedModelId]);

  return {
    modelOptions,
    selectedModelId,
    messages,
    draft,
    isLoadingModels: modelsQuery.isLoading,
    isSending,
    errorMessage,
    modelsError: modelsQuery.error as Error | null,
    modelNotices,
    setDraft,
    selectModel,
    sendMessage,
    clearConversation
  };
}
