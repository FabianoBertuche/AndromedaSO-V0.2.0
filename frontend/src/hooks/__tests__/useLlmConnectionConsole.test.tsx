import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '../../test/renderWithQuery';
import { useLlmConnectionConsole } from '../useLlmConnectionConsole';

const apiMocks = vi.hoisted(() => ({
  listProviders: vi.fn(),
  listProviderVariants: vi.fn(),
  testProviderConnection: vi.fn(),
  saveProviderConsoleConfiguration: vi.fn(),
  syncProviderModels: vi.fn(),
  getProviderCatalog: vi.fn(),
  getProviderHealth: vi.fn(),
  saveProviderSelectedModels: vi.fn(),
  createOpenAiCodexOAuthSession: vi.fn(),
  completeOpenAiCodexOAuth: vi.fn()
}));

vi.mock('../../api/kernel', () => ({
  listProviders: apiMocks.listProviders,
  listProviderVariants: apiMocks.listProviderVariants,
  testProviderConnection: apiMocks.testProviderConnection,
  saveProviderConsoleConfiguration: apiMocks.saveProviderConsoleConfiguration,
  syncProviderModels: apiMocks.syncProviderModels,
  getProviderCatalog: apiMocks.getProviderCatalog,
  getProviderHealth: apiMocks.getProviderHealth,
  saveProviderSelectedModels: apiMocks.saveProviderSelectedModels,
  createOpenAiCodexOAuthSession: apiMocks.createOpenAiCodexOAuthSession,
  completeOpenAiCodexOAuth: apiMocks.completeOpenAiCodexOAuth
}));

function HookHarness() {
  const consoleState = useLlmConnectionConsole();

  return (
    <div>
      <span data-testid="variants-count">{consoleState.variantCatalogQuery.data?.variants.length ?? 0}</span>
      <span data-testid="providers-count">{consoleState.providersQuery.data?.providers.length ?? 0}</span>
      <button onClick={() => void consoleState.testConnectionMutation.mutateAsync({ variant: 'ollama', config: { baseUrl: 'http://localhost:11434' } })}>
        test
      </button>
      <button onClick={() => void consoleState.saveProviderMutation.mutateAsync({ variant: 'ollama', config: { baseUrl: 'http://localhost:11434' } })}>
        save
      </button>
    </div>
  );
}

describe('useLlmConnectionConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiMocks.listProviders.mockResolvedValue({ providers: [{ id: 'provider-1', name: 'ollama', type: 'ollama', variant: 'ollama', health: 'ok', modelsCount: 0 }] });
    apiMocks.listProviderVariants.mockResolvedValue({ group: 'providers', variants: [{ variant: 'ollama' }, { variant: 'openai-api' }] });
    apiMocks.testProviderConnection.mockResolvedValue({ ok: true, variant: 'ollama', validatedFields: ['baseUrl'], health: { status: 'ok', message: 'ok' } });
    apiMocks.saveProviderConsoleConfiguration.mockResolvedValue({ id: 'provider-1', name: 'ollama', type: 'ollama', variant: 'ollama', health: 'ok', modelsCount: 0 });
    apiMocks.syncProviderModels.mockResolvedValue({ providerId: 'provider-1', models: [] });
    apiMocks.getProviderCatalog.mockResolvedValue({ providerId: 'provider-1', selectedModelIds: [], models: [] });
    apiMocks.getProviderHealth.mockResolvedValue({ providerId: 'provider-1', health: 'ok', latencyMs: 10, healthDetails: { status: 'ok', message: 'ok' } });
    apiMocks.saveProviderSelectedModels.mockResolvedValue({ providerId: 'provider-1', selectedModelIds: [] });
    apiMocks.createOpenAiCodexOAuthSession.mockResolvedValue({ authUrl: 'https://example.com', expiresAt: '2099-01-01T00:00:00.000Z', redirectUri: 'http://localhost:5173/oauth/callback', mode: 'manual' });
    apiMocks.completeOpenAiCodexOAuth.mockResolvedValue({ provider: { id: 'provider-2', name: 'openai-oauth:user', type: 'openai-codex', variant: 'openai-oauth', health: 'ok', modelsCount: 0 }, models: [] });
  });

  it('loads saved providers and provider variants in parallel', async () => {
    renderWithQuery(<HookHarness />);

    await waitFor(() => {
      expect(screen.getByTestId('variants-count')).toHaveTextContent('2');
      expect(screen.getByTestId('providers-count')).toHaveTextContent('1');
    });
  });

  it('invalidates provider data after save and test actions', async () => {
    renderWithQuery(<HookHarness />);

    await screen.findByTestId('variants-count');
    screen.getByText('test').click();
    screen.getByText('save').click();

    await waitFor(() => {
      expect(apiMocks.testProviderConnection).toHaveBeenCalled();
      expect(apiMocks.saveProviderConsoleConfiguration).toHaveBeenCalled();
    });
  });
});
