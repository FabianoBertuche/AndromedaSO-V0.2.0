import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { renderWithQuery } from '../../test/renderWithQuery';
import { ModelChatConsole } from '../ModelChatConsole';

const apiMocks = vi.hoisted(() => ({
  listProviders: vi.fn(),
  getProviderCatalog: vi.fn(),
  sendModelChatMessage: vi.fn(),
  listProviderVariants: vi.fn(),
  testProviderConnection: vi.fn(),
  saveProviderConsoleConfiguration: vi.fn(),
  syncProviderModels: vi.fn(),
  getProviderHealth: vi.fn(),
  saveProviderSelectedModels: vi.fn(),
  createOpenAiCodexOAuthSession: vi.fn(),
  completeOpenAiCodexOAuth: vi.fn()
}));

vi.mock('../../api/kernel', async () => {
  const actual = await vi.importActual<typeof import('../../api/kernel')>('../../api/kernel');

  return {
    ...actual,
    listProviders: apiMocks.listProviders,
    getProviderCatalog: apiMocks.getProviderCatalog,
    sendModelChatMessage: apiMocks.sendModelChatMessage,
    listProviderVariants: apiMocks.listProviderVariants,
    testProviderConnection: apiMocks.testProviderConnection,
    saveProviderConsoleConfiguration: apiMocks.saveProviderConsoleConfiguration,
    syncProviderModels: apiMocks.syncProviderModels,
    getProviderHealth: apiMocks.getProviderHealth,
    saveProviderSelectedModels: apiMocks.saveProviderSelectedModels,
    createOpenAiCodexOAuthSession: apiMocks.createOpenAiCodexOAuthSession,
    completeOpenAiCodexOAuth: apiMocks.completeOpenAiCodexOAuth
  };
});

vi.mock('../../hooks/useStatus', () => ({
  useStatus: () => ({ data: null, isLoading: false, error: null, isFetching: false })
}));

vi.mock('../../components/AgentTable', () => ({
  AgentTable: () => <div>AgentTable</div>
}));

vi.mock('../../components/ModuleDiscover', () => ({
  ModuleDiscover: () => <div>ModuleDiscover</div>
}));

vi.mock('../../components/StatusCard', () => ({
  StatusCard: () => <div>StatusCard</div>
}));

vi.mock('../CostDashboard', () => ({
  CostDashboard: () => <div>CostDashboard</div>
}));

function mockChatModels() {
  apiMocks.listProviders.mockResolvedValue({
    providers: [{ id: 'provider-1', name: 'OpenAI Workspace', variant: 'openai-api', type: 'openai', health: 'ok', modelsCount: 1 }]
  });
  apiMocks.getProviderCatalog.mockResolvedValue({
    providerId: 'provider-1',
    selectedModelIds: ['gpt-4o'],
    models: [{ id: '1', modelId: 'gpt-4o', displayName: 'GPT-4o', contextWindow: '128k', capabilities: ['chat'], priceLabel: '$$', score: 9, latencyMs: 200 }]
  });
}

function mockModelsConsoleApis() {
  apiMocks.listProviderVariants.mockResolvedValue({
    group: 'providers',
    variants: [{ variant: 'openai-api', authMode: 'api-key', displayName: 'OpenAI API', description: 'Hosted OpenAI API', capabilities: ['chat'], requiredFields: ['apiKey'], optionalFields: ['baseUrl', 'organization'] }]
  });
  apiMocks.testProviderConnection.mockResolvedValue({ ok: true, variant: 'openai-api', validatedFields: ['apiKey'], health: { status: 'ok', message: 'Connection succeeded' } });
  apiMocks.saveProviderConsoleConfiguration.mockResolvedValue({ id: 'provider-1', name: 'OpenAI Workspace', type: 'openai', variant: 'openai-api', health: 'ok', modelsCount: 1 });
  apiMocks.syncProviderModels.mockResolvedValue({ providerId: 'provider-1', models: [] });
  apiMocks.getProviderHealth.mockResolvedValue({ providerId: 'provider-1', health: 'ok', latencyMs: 24, healthDetails: { status: 'ok', message: 'Connection healthy' } });
  apiMocks.saveProviderSelectedModels.mockResolvedValue({ providerId: 'provider-1', selectedModelIds: ['gpt-4o'] });
  apiMocks.createOpenAiCodexOAuthSession.mockResolvedValue({ authUrl: 'https://example.com', expiresAt: '2099-01-01T00:00:00.000Z', redirectUri: 'http://localhost:5173/oauth/callback', mode: 'manual' });
  apiMocks.completeOpenAiCodexOAuth.mockResolvedValue({ provider: { id: 'provider-2', name: 'OpenAI OAuth', type: 'openai-codex', variant: 'openai-oauth', health: 'ok', modelsCount: 0 }, models: [] });
}

describe('ModelChatConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChatModels();
    mockModelsConsoleApis();
  });

  it('renders an empty state when there are no synced models available', async () => {
    apiMocks.listProviders.mockResolvedValue({ providers: [] });

    renderWithQuery(<ModelChatConsole />);

    expect(await screen.findByText(/no synced models available yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('supports model selection, send success, loading, and response rendering', async () => {
    const user = userEvent.setup();

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
          models: [{ id: '1', modelId: 'gpt-4o', displayName: 'GPT-4o', contextWindow: '128k', capabilities: ['chat'], priceLabel: '$$', score: 9, latencyMs: 200 }]
        };
      }

      return {
        providerId,
        selectedModelIds: [],
        models: [{ id: '2', modelId: 'qwen2.5:14b', displayName: 'Qwen 2.5 14B', contextWindow: '32k', capabilities: ['chat'], priceLabel: 'local', score: 8, latencyMs: 40 }]
      };
    });
    apiMocks.sendModelChatMessage.mockResolvedValue({
      message: { role: 'assistant', content: 'Use layered gradients, scanline textures, and staggered motion.' }
    });

    renderWithQuery(<ModelChatConsole />);

    const modelSelector = await screen.findByLabelText(/model/i);
    await user.selectOptions(modelSelector, 'qwen2.5:14b');
    await user.type(screen.getByLabelText(/message/i), 'Explain the matrix rain effect');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(apiMocks.sendModelChatMessage).toHaveBeenCalledWith({
      modelId: 'qwen2.5:14b',
      messages: [{ role: 'user', content: 'Explain the matrix rain effect' }]
    });
    expect(screen.getByText('Explain the matrix rain effect')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    expect(modelSelector).toBeDisabled();

    expect(await screen.findByText(/use layered gradients/i)).toBeInTheDocument();
  });

  it('shows a friendly error and preserves the current conversation on send failure', async () => {
    const user = userEvent.setup();
    apiMocks.sendModelChatMessage.mockRejectedValue(Object.assign(new Error('Kernel request failed: 503'), { code: 'PROVIDER_UNREACHABLE' }));

    renderWithQuery(<ModelChatConsole />);

    await user.type(await screen.findByLabelText(/message/i), 'Hello');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/selected provider is unavailable or unreachable right now/i)).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('clears the conversation while preserving the selected model', async () => {
    const user = userEvent.setup();
    apiMocks.sendModelChatMessage.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'Neon green with cyan bloom keeps the console readable.'
      }
    });

    renderWithQuery(<ModelChatConsole />);

    const modelSelector = await screen.findByLabelText(/model/i) as HTMLSelectElement;
    await user.type(screen.getByLabelText(/message/i), 'Pick a palette');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/neon green with cyan bloom/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear conversation/i }));

    await waitFor(() => {
      expect(screen.queryByText('Pick a palette')).not.toBeInTheDocument();
      expect(screen.queryByText(/neon green with cyan bloom/i)).not.toBeInTheDocument();
    });
    expect(modelSelector.value).toBe('gpt-4o');
  });

  it('keeps models and chat as separate app entries', async () => {
    window.history.pushState({}, '', '/?tab=models');
    const { unmount } = renderWithQuery(<App />);

    expect(await screen.findByText(/provider and model management/i)).toBeInTheDocument();
    expect(screen.queryByText(/model chat workspace/i)).not.toBeInTheDocument();

    unmount();
    window.history.pushState({}, '', '/?tab=chat');
    renderWithQuery(<App />);

    expect(await screen.findByText(/model chat workspace/i)).toBeInTheDocument();
    expect(screen.queryByText(/provider and model management/i)).not.toBeInTheDocument();
  });
});
