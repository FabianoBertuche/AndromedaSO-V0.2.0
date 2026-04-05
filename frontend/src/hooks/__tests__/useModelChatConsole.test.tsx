import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '../../test/renderWithQuery';
import { useModelChatConsole } from '../useModelChatConsole';

const apiMocks = vi.hoisted(() => ({
  listProviders: vi.fn(),
  getProviderCatalog: vi.fn(),
  sendModelChatMessage: vi.fn()
}));

vi.mock('../../api/kernel', async () => {
  const actual = await vi.importActual<typeof import('../../api/kernel')>('../../api/kernel');

  return {
    ...actual,
    listProviders: apiMocks.listProviders,
    getProviderCatalog: apiMocks.getProviderCatalog,
    sendModelChatMessage: apiMocks.sendModelChatMessage
  };
});

function HookHarness() {
  const consoleState = useModelChatConsole();

  return (
    <div>
      <span data-testid="options">{consoleState.modelOptions.map((option) => option.label).join('|')}</span>
      <span data-testid="selected-model">{consoleState.selectedModelId ?? 'none'}</span>
      <span data-testid="messages">{consoleState.messages.map((message) => `${message.role}:${message.content}`).join('|')}</span>
      <span data-testid="error">{consoleState.errorMessage ?? 'none'}</span>
      <span data-testid="warnings">{consoleState.modelNotices.join('|') || 'none'}</span>
      <button onClick={() => consoleState.setDraft('hello there')}>draft-hello</button>
      <button onClick={() => consoleState.setDraft('retry prompt')}>draft-retry</button>
      <button onClick={() => consoleState.selectModel('model-2')}>select-model-2</button>
      <button onClick={() => void consoleState.sendMessage()}>send</button>
      <button onClick={() => consoleState.clearConversation()}>clear</button>
    </div>
  );
}

describe('useModelChatConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('aggregates models from multiple provider catalogs into one list', async () => {
    apiMocks.listProviders.mockResolvedValue({
      providers: [
        { id: 'provider-1', name: 'OpenAI Workspace', variant: 'openai-api', type: 'openai', health: 'ok', modelsCount: 1 },
        { id: 'provider-2', name: 'Local Ollama', variant: 'ollama', type: 'ollama', health: 'ok', modelsCount: 1 }
      ]
    });
    apiMocks.getProviderCatalog.mockImplementation(async (providerId: string) => {
      if (providerId === 'provider-1') {
        return {
          providerId,
          selectedModelIds: [],
          models: [{ id: '1', modelId: 'model-1', displayName: 'GPT-4o', contextWindow: '128k', capabilities: ['chat'], priceLabel: '$$', score: 9, latencyMs: 200 }]
        };
      }

      return {
        providerId,
        selectedModelIds: [],
        models: [{ id: '2', modelId: 'model-2', displayName: 'Qwen 2.5 14B', contextWindow: '32k', capabilities: ['chat'], priceLabel: 'local', score: 8, latencyMs: 40 }]
      };
    });

    renderWithQuery(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('options')).toHaveTextContent('GPT-4o - openai-api|Qwen 2.5 14B - ollama');
      expect(screen.getByTestId('selected-model')).toHaveTextContent('model-1');
    });
  });

  it('ignores providers whose catalog request fails and keeps valid models available', async () => {
    apiMocks.listProviders.mockResolvedValue({
      providers: [
        { id: 'provider-1', name: 'Broken Provider', variant: 'openai-api', type: 'openai', health: 'ok', modelsCount: 1 },
        { id: 'provider-2', name: 'Local Ollama', variant: 'ollama', type: 'ollama', health: 'ok', modelsCount: 1 }
      ]
    });
    apiMocks.getProviderCatalog.mockImplementation(async (providerId: string) => {
      if (providerId === 'provider-1') {
        throw new Error('Catalog request failed');
      }

      return {
        providerId,
        selectedModelIds: [],
        models: [{ id: '2', modelId: 'model-2', displayName: 'Qwen 2.5 14B', contextWindow: '32k', capabilities: ['chat'], priceLabel: 'local', score: 8, latencyMs: 40 }]
      };
    });

    renderWithQuery(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('options')).toHaveTextContent('Qwen 2.5 14B - ollama');
      expect(screen.getByTestId('selected-model')).toHaveTextContent('model-2');
      expect(screen.getByTestId('warnings')).toHaveTextContent('Some provider catalogs could not be loaded and were ignored.');
    });
  });

  it('excludes ambiguous duplicate model ids from the chat options', async () => {
    apiMocks.listProviders.mockResolvedValue({
      providers: [
        { id: 'provider-1', name: 'OpenAI Workspace', variant: 'openai-api', type: 'openai', health: 'ok', modelsCount: 1 },
        { id: 'provider-2', name: 'Backup OpenAI', variant: 'openai-oauth', type: 'openai-codex', health: 'ok', modelsCount: 1 },
        { id: 'provider-3', name: 'Local Ollama', variant: 'ollama', type: 'ollama', health: 'ok', modelsCount: 1 }
      ]
    });
    apiMocks.getProviderCatalog.mockImplementation(async (providerId: string) => ({
      providerId,
      selectedModelIds: [],
      models: providerId === 'provider-3'
        ? [{ id: '3', modelId: 'qwen2.5:14b', displayName: 'Qwen 2.5 14B', contextWindow: '32k', capabilities: ['chat'], priceLabel: 'local', score: 8, latencyMs: 40 }]
        : [{ id: providerId, modelId: 'gpt-4o', displayName: 'GPT-4o', contextWindow: '128k', capabilities: ['chat'], priceLabel: '$$', score: 9, latencyMs: 200 }]
    }));

    renderWithQuery(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('options')).toHaveTextContent('Qwen 2.5 14B - ollama');
      expect(screen.getByTestId('options')).not.toHaveTextContent('GPT-4o - openai-api');
      expect(screen.getByTestId('warnings')).toHaveTextContent('Ambiguous model IDs were hidden from chat because multiple providers expose the same modelId.');
    });
  });

  it('clears the current conversation when the selected model changes', async () => {
    const user = userEvent.setup();

    apiMocks.listProviders.mockResolvedValue({
      providers: [
        { id: 'provider-1', name: 'OpenAI Workspace', variant: 'openai-api', type: 'openai', health: 'ok', modelsCount: 1 },
        { id: 'provider-2', name: 'Local Ollama', variant: 'ollama', type: 'ollama', health: 'ok', modelsCount: 1 }
      ]
    });
    apiMocks.getProviderCatalog.mockImplementation(async (providerId: string) => ({
      providerId,
      selectedModelIds: [],
      models: [{
        id: providerId,
        modelId: providerId === 'provider-1' ? 'model-1' : 'model-2',
        displayName: providerId === 'provider-1' ? 'GPT-4o' : 'Qwen 2.5 14B',
        contextWindow: '32k',
        capabilities: ['chat'],
        priceLabel: 'n/a',
        score: 8,
        latencyMs: 40
      }]
    }));
    apiMocks.sendModelChatMessage.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'assistant reply'
      }
    });

    renderWithQuery(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-model')).toHaveTextContent('model-1');
    });

    await user.click(screen.getByText('draft-hello'));
    await user.click(screen.getByText('send'));

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent('user:hello there|assistant:assistant reply');
    });

    await user.click(screen.getByText('select-model-2'));

    await waitFor(() => {
      expect(screen.getByTestId('selected-model')).toHaveTextContent('model-2');
      expect(screen.getByTestId('messages')).toHaveTextContent('');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
    });
  });

  it('preserves prior conversation history when sending fails', async () => {
    const user = userEvent.setup();

    apiMocks.listProviders.mockResolvedValue({
      providers: [{ id: 'provider-1', name: 'OpenAI Workspace', variant: 'openai-api', type: 'openai', health: 'ok', modelsCount: 1 }]
    });
    apiMocks.getProviderCatalog.mockResolvedValue({
      providerId: 'provider-1',
      selectedModelIds: [],
      models: [{ id: '1', modelId: 'model-1', displayName: 'GPT-4o', contextWindow: '128k', capabilities: ['chat'], priceLabel: '$$', score: 9, latencyMs: 200 }]
    });
    apiMocks.sendModelChatMessage
      .mockResolvedValueOnce({
        message: {
          role: 'assistant',
          content: 'first reply'
        }
      })
      .mockRejectedValueOnce(Object.assign(new Error('Kernel request failed: 503'), { code: 'PROVIDER_UNREACHABLE' }));

    renderWithQuery(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-model')).toHaveTextContent('model-1');
    });

    await user.click(screen.getByText('draft-hello'));
    await user.click(screen.getByText('send'));

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent('user:hello there|assistant:first reply');
    });

    await user.click(screen.getByText('draft-retry'));
    await user.click(screen.getByText('send'));

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent('user:hello there|assistant:first reply|user:retry prompt');
      expect(screen.getByTestId('error')).toHaveTextContent('The selected provider is unavailable or unreachable right now.');
    });
  });

  it('clears messages and error when clearConversation is called', async () => {
    const user = userEvent.setup();

    apiMocks.listProviders.mockResolvedValue({
      providers: [{ id: 'provider-1', name: 'OpenAI Workspace', variant: 'openai-api', type: 'openai', health: 'ok', modelsCount: 1 }]
    });
    apiMocks.getProviderCatalog.mockResolvedValue({
      providerId: 'provider-1',
      selectedModelIds: [],
      models: [{ id: '1', modelId: 'model-1', displayName: 'GPT-4o', contextWindow: '128k', capabilities: ['chat'], priceLabel: '$$', score: 9, latencyMs: 200 }]
    });
    apiMocks.sendModelChatMessage.mockRejectedValue(new Error('Provider is unavailable or unreachable.'));

    renderWithQuery(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('selected-model')).toHaveTextContent('model-1');
    });

    await user.click(screen.getByText('draft-hello'));
    await user.click(screen.getByText('send'));

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent('user:hello there');
      expect(screen.getByTestId('error')).toHaveTextContent('Provider is unavailable or unreachable.');
    });

    await user.click(screen.getByText('clear'));

    await waitFor(() => {
      expect(screen.getByTestId('messages')).toHaveTextContent('');
      expect(screen.getByTestId('error')).toHaveTextContent('none');
      expect(screen.getByTestId('selected-model')).toHaveTextContent('model-1');
    });
  });
});
