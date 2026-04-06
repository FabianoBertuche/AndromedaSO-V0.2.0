import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQuery } from '../../test/renderWithQuery';
import { ModelChatConsole } from '../ModelChatConsole';
import type { AgentInstance } from '../../types/kernel';

const apiMocks = vi.hoisted(() => ({
  listAgents: vi.fn(),
  sendModelChatMessage: vi.fn()
}));

vi.mock('../../api/kernel', async () => {
  const actual = await vi.importActual<typeof import('../../api/kernel')>('../../api/kernel');

  return {
    ...actual,
    listAgents: apiMocks.listAgents,
    sendModelChatMessage: apiMocks.sendModelChatMessage
  };
});

vi.mock('../../hooks/useStatus', () => ({
  useStatus: () => ({ data: null, isLoading: false, error: null, isFetching: false })
}));

vi.mock('../../components/AgentTable', () => ({
  AgentTable: () => <div>AgentTable</div>
}));

const mockAgent1: AgentInstance = {
  id: 'agent-1',
  name: 'Code Assistant',
  slug: 'code-assistant',
  shortDescription: 'A helpful coding assistant',
  longDescription: 'Detailed description of the coding assistant',
  status: 'active',
  preferredModel: 'gpt-4o',
  templateId: null,
  isTemplateDerived: false,
  templateSource: null,
  templateVariant: null,
  templateManifestRef: null,
  originTemplateVersion: null,
  templateDefaultsSnapshot: null,
  templateInheritanceMode: 'copy-on-create',
  templateLockPolicy: 'none',
  role: 'assistant',
  mission: 'Help with coding tasks',
  domain: 'programming',
  objective: 'Assist users with code',
  successCriteria: [],
  persona: 'helpful',
  tone: 'professional',
  style: 'concise',
  behaviorProfile: 'default',
  interactionMode: 'reactive',
  defaultLanguage: 'en',
  tags: [],
  categories: [],
  systemPrompt: 'You are a helpful coding assistant',
  operatingInstructions: [],
  doRules: [],
  dontRules: [],
  guardrails: [],
  escalationRules: [],
  allowedModels: [],
  providerConstraints: [],
  channelConstraints: [],
  temperature: 0.7,
  topP: 1,
  maxTokens: null,
  responseFormat: 'markdown',
  reasoningMode: null,
  timeoutMs: 30000,
  retryPolicy: { maxRetries: 3, backoffMs: 1000, strategy: 'exponential' },
  toolsEnabled: false,
  knowledgeEnabled: false,
  memoryEnabled: false,
  routingEnabled: false,
  handoffEnabled: false,
  humanEscalationEnabled: false,
  capabilities: [],
  allowedChannels: [],
  defaultChannelBehavior: {},
  channelOverrides: {},
  isActive: true,
  isEditable: true,
  visibility: 'private',
  auditMetadata: { createdBy: null, updatedBy: null, reason: null },
  originType: 'manual',
  cloneOfAgentId: null,
  isDeleted: false,
  deletedAt: null,
  activatedAt: null,
  deactivatedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  overrides: {},
  explicitParameters: {},
  resolvedConfig: null,
  resolutionTrace: null,
  effectiveSystemPrompt: null,
  effectiveBehaviorProfile: null,
  effectiveExecutionPolicy: null,
  effectiveChannelPolicy: null,
  effectiveModelPolicy: null,
  configSnapshotVersion: 1,
  lastResolvedAt: null,
  lastValidatedAt: null,
  owner: 'system'
};

const mockAgent2: AgentInstance = {
  id: 'agent-2',
  name: 'Local Assistant',
  slug: 'local-assistant',
  shortDescription: 'A local LLM assistant',
  longDescription: 'Detailed description',
  status: 'active',
  preferredModel: 'qwen2.5:14b',
  templateId: null,
  isTemplateDerived: false,
  templateSource: null,
  templateVariant: null,
  templateManifestRef: null,
  originTemplateVersion: null,
  templateDefaultsSnapshot: null,
  templateInheritanceMode: 'copy-on-create',
  templateLockPolicy: 'none',
  role: 'assistant',
  mission: 'Help with general tasks',
  domain: 'general',
  objective: 'Assist users',
  successCriteria: [],
  persona: 'helpful',
  tone: 'friendly',
  style: 'conversational',
  behaviorProfile: 'default',
  interactionMode: 'reactive',
  defaultLanguage: 'en',
  tags: [],
  categories: [],
  systemPrompt: 'You are a helpful assistant',
  operatingInstructions: [],
  doRules: [],
  dontRules: [],
  guardrails: [],
  escalationRules: [],
  allowedModels: [],
  providerConstraints: [],
  channelConstraints: [],
  temperature: 0.7,
  topP: 1,
  maxTokens: null,
  responseFormat: 'markdown',
  reasoningMode: null,
  timeoutMs: 30000,
  retryPolicy: { maxRetries: 3, backoffMs: 1000, strategy: 'exponential' },
  toolsEnabled: false,
  knowledgeEnabled: false,
  memoryEnabled: false,
  routingEnabled: false,
  handoffEnabled: false,
  humanEscalationEnabled: false,
  capabilities: [],
  allowedChannels: [],
  defaultChannelBehavior: {},
  channelOverrides: {},
  isActive: true,
  isEditable: true,
  visibility: 'private',
  auditMetadata: { createdBy: null, updatedBy: null, reason: null },
  originType: 'manual',
  cloneOfAgentId: null,
  isDeleted: false,
  deletedAt: null,
  activatedAt: null,
  deactivatedAt: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  overrides: {},
  explicitParameters: {},
  resolvedConfig: null,
  resolutionTrace: null,
  effectiveSystemPrompt: null,
  effectiveBehaviorProfile: null,
  effectiveExecutionPolicy: null,
  effectiveChannelPolicy: null,
  effectiveModelPolicy: null,
  configSnapshotVersion: 1,
  lastResolvedAt: null,
  lastValidatedAt: null,
  owner: 'system'
};

function mockActiveAgents() {
  apiMocks.listAgents.mockResolvedValue({
    agents: [mockAgent1, mockAgent2]
  });
}

describe('ModelChatConsole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveAgents();
  });

  it('renders an empty state when there are no active agents available', async () => {
    apiMocks.listAgents.mockResolvedValue({ agents: [] });

    renderWithQuery(<ModelChatConsole />);

    expect(await screen.findByText(/no active agents available yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();
  });

  it('supports agent selection, send success, loading, and response rendering', async () => {
    const user = userEvent.setup();

    apiMocks.sendModelChatMessage.mockResolvedValue({
      message: { role: 'assistant', content: 'Use layered gradients, scanline textures, and staggered motion.' }
    });

    renderWithQuery(<ModelChatConsole />);

    const agentSelector = await screen.findByLabelText(/agent/i);
    await user.selectOptions(agentSelector, 'agent-2');
    await user.type(screen.getByLabelText(/message/i), 'Explain the matrix rain effect');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(apiMocks.sendModelChatMessage).toHaveBeenCalledWith({
      modelId: 'qwen2.5:14b',
      messages: [{ role: 'user', content: 'Explain the matrix rain effect' }]
    });
    expect(screen.getByText('Explain the matrix rain effect')).toBeInTheDocument();

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

  it('clears the conversation while preserving the selected agent', async () => {
    const user = userEvent.setup();
    apiMocks.sendModelChatMessage.mockResolvedValue({
      message: {
        role: 'assistant',
        content: 'Neon green with cyan bloom keeps the console readable.'
      }
    });

    renderWithQuery(<ModelChatConsole />);

    const agentSelector = await screen.findByLabelText(/agent/i) as HTMLSelectElement;
    await user.type(screen.getByLabelText(/message/i), 'Pick a palette');
    await user.click(screen.getByRole('button', { name: /send message/i }));

    expect(await screen.findByText(/neon green with cyan bloom/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear conversation/i }));

    await waitFor(() => {
      expect(screen.queryByText('Pick a palette')).not.toBeInTheDocument();
      expect(screen.queryByText(/neon green with cyan bloom/i)).not.toBeInTheDocument();
    });
    expect(agentSelector.value).toBe('agent-1');
  });
});
