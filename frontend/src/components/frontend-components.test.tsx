import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { StatusCard } from './StatusCard';
import { ModuleDiscover } from './ModuleDiscover';
import { AgentTable } from './AgentTable';
import { FeedbackModal } from './FeedbackModal';
import { EvalRunner } from './EvalRunner';
import { renderWithQuery } from '../test/renderWithQuery';

vi.mock('../api/kernel', async () => {
  const actual = await vi.importActual<typeof import('../api/kernel')>('../api/kernel');
  return {
    ...actual,
    discoverModules: vi.fn(),
    postTaskFeedback: vi.fn(),
    fetchAgents: vi.fn(),
    fetchAgent: vi.fn()
  };
});

describe('Frontend Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1) StatusCard renderiza estado healthy', () => {
    renderWithQuery(
      <StatusCard
        isLoading={false}
        status={{ status: 'healthy', registrySize: 2, activeModules: ['a'], metrics: { retry_storm_total: 0 } }}
      />
    );

    expect(screen.getByText('Kernel Runtime')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('2) StatusCard mostra erro quando presente', () => {
    renderWithQuery(
      <StatusCard isLoading={false} error={new Error('boom')} status={{ status: 'degraded', registrySize: 0, activeModules: [], metrics: { retry_storm_total: 1 } }} />
    );

    expect(screen.getByText(/Falha ao consultar status/i)).toBeInTheDocument();
  });

  it('3) ModuleDiscover renderiza form com input e botao Discover', () => {
    renderWithQuery(<ModuleDiscover defaultRootPath="C:\\mods" onDiscoveredAgentIds={vi.fn()} />);

    expect(screen.getByDisplayValue(/mods/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Discover' })).toBeInTheDocument();
  });

  it('4) ModuleDiscover mostra tabela com modulos descobertos', async () => {
    const { discoverModules } = await import('../api/kernel');
    vi.mocked(discoverModules).mockResolvedValue({
      registered: [
        { id: 'agent-a', state: 'registered' },
        { id: 'agent-b', state: 'registered' }
      ]
    });

    renderWithQuery(<ModuleDiscover defaultRootPath="C:\\mods" onDiscoveredAgentIds={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Discover' }));

    expect(await screen.findByText('agent-a')).toBeInTheDocument();
    expect(screen.getByText('agent-b')).toBeInTheDocument();
  });

  it('5) AgentTable mostra mensagem de vazio quando sem dados', async () => {
    const { fetchAgents } = await import('../api/kernel');
    vi.mocked(fetchAgents).mockResolvedValue([]);

    renderWithQuery(<AgentTable discoveredAgentIds={[]} />);
    expect(await screen.findByText(/Nenhum agente para exibir/i)).toBeInTheDocument();
  });

  it('6) AgentTable renderiza linha com dados de agente', async () => {
    const { fetchAgents, fetchAgent } = await import('../api/kernel');
    vi.mocked(fetchAgents).mockResolvedValue(['agent-x']);
    vi.mocked(fetchAgent).mockResolvedValue({
      id: 'agent-x',
      performanceP95: 120,
      successRate: 0.99,
      reputationScore: 0.91,
      budgetSpent: 10,
      budgetLimit: 100
    });

    renderWithQuery(<AgentTable discoveredAgentIds={['agent-x']} />);
    expect(await screen.findByText('agent-x')).toBeInTheDocument();
    expect(screen.getByText('120 ms')).toBeInTheDocument();
  });

  it('7) FeedbackModal nao renderiza quando open=false', () => {
    renderWithQuery(<FeedbackModal open={false} onClose={vi.fn()} />);
    expect(screen.queryByText('Task Feedback')).not.toBeInTheDocument();
  });

  it('8) FeedbackModal envia feedback via POST /tasks/:id/feedback', async () => {
    const { postTaskFeedback } = await import('../api/kernel');
    vi.mocked(postTaskFeedback).mockResolvedValue({ ok: true });

    renderWithQuery(<FeedbackModal open onClose={vi.fn()} defaultTaskId="task-1" defaultAgentId="agent-1" />);

    fireEvent.change(screen.getByPlaceholderText('capability'), { target: { value: 'routing' } });
    await userEvent.click(screen.getByRole('button', { name: 'Enviar Feedback' }));

    await waitFor(() => {
      expect(postTaskFeedback).toHaveBeenCalled();
    });
  });

  it('9) EvalRunner renderiza seletor e botao Run Golden Dataset', () => {
    renderWithQuery(<EvalRunner agentIds={['agent-z']} />);

    expect(screen.getByRole('button', { name: 'Run Golden Dataset' })).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('10) EvalRunner exibe resultados apos sucesso do /eval/run', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        agentId: 'agent-z',
        datasetSize: 50,
        averageScore: 0.87,
        results: [
          { taskId: 'golden-01', score: 0.9 },
          { taskId: 'golden-02', score: 0.8 }
        ]
      })
    }));

    renderWithQuery(<EvalRunner agentIds={['agent-z']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Run Golden Dataset' }));

    expect(await screen.findByText(/Avg Score: 0.87/)).toBeInTheDocument();
    expect(screen.getByText('golden-01')).toBeInTheDocument();
  });
});
