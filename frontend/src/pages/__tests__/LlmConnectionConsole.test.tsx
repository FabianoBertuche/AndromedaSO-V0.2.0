import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LlmConnectionConsole } from '../LlmConnectionConsole';

const hookMocks = vi.hoisted(() => ({
  useLlmConnectionConsole: vi.fn()
}));

vi.mock('../../hooks/useLlmConnectionConsole', () => ({
  useLlmConnectionConsole: hookMocks.useLlmConnectionConsole
}));

function createMutationMock(overrides: Record<string, unknown> = {}) {
  return {
    isPending: false,
    error: null,
    data: null,
    mutateAsync: vi.fn(),
    ...overrides
  };
}

function createConsoleState() {
  return {
    providersQuery: {
      isLoading: false,
      error: null,
      data: {
        providers: [{ id: 'provider-1', name: 'OpenAI Workspace', type: 'openai', variant: 'openai-api', health: 'ok', modelsCount: 2, baseUrl: 'https://api.openai.com' }]
      }
    },
    variantCatalogQuery: {
      isLoading: false,
      error: null,
      data: {
        variants: [{
          variant: 'openai-api',
          authMode: 'api-key',
          displayName: 'OpenAI API',
          description: 'Hosted OpenAI API access',
          capabilities: ['chat', 'coding'],
          requiredFields: ['apiKey'],
          optionalFields: ['baseUrl', 'organization']
        }]
      }
    },
    catalogQuery: {
      data: {
        providerId: 'provider-1',
        selectedModelIds: ['gpt-4o'],
        models: [{ id: 'catalog-1', modelId: 'gpt-4o', displayName: 'GPT-4o', contextWindow: '128k', capabilities: ['chat'], priceLabel: '$$', score: 9, latencyMs: 220 }]
      }
    },
    healthQuery: {
      data: {
        providerId: 'provider-1',
        health: 'ok',
        latencyMs: 24,
        healthDetails: {
          status: 'ok',
          message: 'Connection healthy',
          latencyMs: 24,
          checkedAt: '2026-04-05T00:00:00.000Z'
        }
      }
    },
    testConnectionMutation: createMutationMock(),
    saveProviderMutation: createMutationMock(),
    syncModelsMutation: createMutationMock(),
    savePreferredModelMutation: createMutationMock(),
    startOAuthSessionMutation: createMutationMock(),
    completeOAuthMutation: createMutationMock(),
    incompatibleProviders: []
  };
}

describe('LlmConnectionConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders a provider-model management console instead of the chat-first screen', () => {
    hookMocks.useLlmConnectionConsole.mockReturnValue(createConsoleState());

    render(<LlmConnectionConsole />);

    expect(screen.getByText(/provider and model management/i)).toBeInTheDocument();
    expect(screen.getByText(/configure provider variants, validate connection details, sync catalog snapshots/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sync models/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save preferred model/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /connection test/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /health/i })).toBeInTheDocument();
    expect(screen.queryByText(/chat-first model console/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument();
  });

  it('shows loading state for the restored provider console', () => {
    const loadingState = createConsoleState();
    loadingState.providersQuery.isLoading = true;
    hookMocks.useLlmConnectionConsole.mockReturnValue(loadingState);

    render(<LlmConnectionConsole />);

    expect(screen.getByText(/loading provider console/i)).toBeInTheDocument();
  });

  it('saves the preferred model from the restored models workflow', async () => {
    const user = userEvent.setup();
    const savePreferredModelMutation = createMutationMock();
    hookMocks.useLlmConnectionConsole.mockReturnValue({
      ...createConsoleState(),
      savePreferredModelMutation
    });

    render(<LlmConnectionConsole />);

    await user.click(screen.getByRole('button', { name: /save preferred model/i }));

    expect(savePreferredModelMutation.mutateAsync).toHaveBeenCalledWith({
      providerId: 'provider-1',
      preferredModelId: 'gpt-4o',
      selectedModelIds: ['gpt-4o']
    });
  });
});
