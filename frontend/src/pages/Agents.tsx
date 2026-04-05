import { useState } from 'react';
import {
  useAgentTemplates,
  useAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  useDuplicateAgent,
  useActivateAgent,
  useDeactivateAgent
} from '../hooks/useAgents';
import type {
  AgentInstance,
  AgentTemplateManifest,
  CreateAgentInput,
  UpdateAgentInput
} from '../types/kernel';

// ============================================
// Sub-componentes
// ============================================

function Badge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${
        isActive
          ? 'bg-emerald-500/20 text-emerald-300 ring-emerald-500/50'
          : 'bg-amber-500/20 text-amber-300 ring-amber-500/50'
      }`}
    >
      {isActive ? '● active' : '○ disabled'}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5">
      <p className="text-slate-400">{message}</p>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/90 p-6 shadow-glow backdrop-blur-xl">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-slate-300">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-rose-500/80 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-rose-500"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Modal de Criação/Edição de Agente
// ============================================

function AgentFormModal({
  open,
  onClose,
  agent,
  templates,
  onSubmit,
  isLoading
}: {
  open: boolean;
  onClose: () => void;
  agent?: AgentInstance;
  templates: AgentTemplateManifest[];
  onSubmit: (data: CreateAgentInput | UpdateAgentInput) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateAgentInput | UpdateAgentInput>(() => {
    if (agent) {
      return {
        name: agent.name,
        description: agent.description,
        visibility: agent.visibility,
        overrides: agent.overrides as CreateAgentInput['overrides'],
        status: agent.status
      };
    }
    return { templateId: '', name: '', description: '', visibility: 'private' };
  });

  if (!open) return null;

  const isEdit = !!agent;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-6 shadow-glow backdrop-blur-xl">
        <h3 className="text-xl font-semibold text-white">
          {isEdit ? 'Editar Agente' : 'Criar Agente'}
        </h3>
        <p className="mt-1 text-sm text-slate-400">
          {isEdit ? `PUT /api/agents/${agent.id}` : 'POST /api/agents'}
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="mt-6 grid gap-4"
        >
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-300">Template *</label>
              <select
                value={(formData as CreateAgentInput).templateId || ''}
                onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                required
              >
                <option value="">Selecione um template...</option>
                {templates.map((t) => (
                  <option key={t.templateId} value={t.templateId}>
                    {t.name} ({t.templateId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Nome</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Slug</label>
              <input
                type="text"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Descrição</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Visibilidade</label>
              <select
                value={formData.visibility || 'private'}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as 'private' | 'team' | 'public' })}
                className="mt-1 w-full rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="private">Private</option>
                <option value="team">Team</option>
                <option value="public">Public</option>
              </select>
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-slate-300">Status</label>
                <select
                  value={formData.status || 'active'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'disabled' })}
                  className="mt-1 w-full rounded-xl border border-white/20 bg-slate-800 px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition-all hover:bg-white/10"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || (!isEdit && !(formData as CreateAgentInput).templateId)}
              className="rounded-xl bg-cyan-500/80 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-cyan-500 disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================
// Tabs
// ============================================

type TabType = 'templates' | 'agents';

function TemplatesTab() {
  const { data: templates, isLoading, error } = useAgentTemplates();

  if (isLoading) return <div className="p-4 text-cyan-300">Carregando templates...</div>;
  if (error) return <div className="p-4 text-rose-300">Erro: {(error as Error).message}</div>;
  if (!templates?.length) return <EmptyState message="Nenhum template disponível" />;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {templates.map((t) => (
        <div
          key={t.templateId}
          className="rounded-xl border border-white/10 bg-white/5 p-4 transition-all hover:border-cyan-500/30 hover:bg-white/10"
        >
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-white">{t.name}</h4>
              <p className="text-sm text-slate-400">{t.templateId}</p>
            </div>
            <Badge status={t.status} />
          </div>
          <div className="mt-3 text-xs text-slate-500">
            <p>
              {t.group} / {t.variant} • v{t.version}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AgentsTab() {
  const { data: agents, isLoading, error } = useAgents();
  const { data: templates } = useAgentTemplates();
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();
  const duplicateMutation = useDuplicateAgent();
  const activateMutation = useActivateAgent();
  const deactivateMutation = useDeactivateAgent();

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentInstance | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<AgentInstance | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const handleCreate = (data: CreateAgentInput) => {
    createMutation.mutate(data, {
      onSuccess: () => setFormModalOpen(false),
      onError: (e) => alert((e as Error).message)
    });
  };

  const handleUpdate = (data: UpdateAgentInput) => {
    if (!editingAgent) return;
    updateMutation.mutate(
      { agentId: editingAgent.id, payload: data },
      {
        onSuccess: () => {
          setFormModalOpen(false);
          setEditingAgent(undefined);
        },
        onError: (e) => alert((e as Error).message)
      }
    );
  };

  const handleDuplicate = (agent: AgentInstance) => {
    setLoadingAction(agent.id + '-duplicate');
    duplicateMutation.mutate(
      { agentId: agent.id },
      {
        onSuccess: () => setLoadingAction(null),
        onError: (e) => {
          setLoadingAction(null);
          alert((e as Error).message);
        }
      }
    );
  };

  const handleActivate = (agent: AgentInstance) => {
    setLoadingAction(agent.id + '-activate');
    const mutation = agent.status === 'disabled' ? activateMutation : deactivateMutation;
    mutation.mutate(agent.id, {
      onSuccess: () => setLoadingAction(null),
      onError: (e) => {
        setLoadingAction(null);
        alert((e as Error).message);
      }
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setLoadingAction(confirmDelete.id + '-delete');
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => {
        setLoadingAction(null);
        setConfirmDelete(null);
      },
      onError: (e) => {
        setLoadingAction(null);
        alert((e as Error).message);
      }
    });
  };

  if (isLoading) return <div className="p-4 text-cyan-300">Carregando agentes...</div>;
  if (error) return <div className="p-4 text-rose-300">Erro: {(error as Error).message}</div>;
  if (!agents?.length) return <EmptyState message="Nenhum agente criado. Use um template para criar." />;

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-white/20">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-950/40 text-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Criado em</th>
              <th className="px-4 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/20">
            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="font-medium text-cyan-300">{agent.name}</div>
                  <div className="text-xs text-slate-500">{agent.slug}</div>
                </td>
                <td className="px-4 py-3 text-slate-300">{agent.templateId}</td>
                <td className="px-4 py-3">
                  <Badge status={agent.status} />
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {new Date(agent.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingAgent(agent);
                        setFormModalOpen(true);
                      }}
                      className="rounded-lg border border-white/20 px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
                      title="Editar"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDuplicate(agent)}
                      disabled={loadingAction === agent.id + '-duplicate'}
                      className="rounded-lg border border-white/20 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
                      title="Duplicar"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleActivate(agent)}
                      disabled={loadingAction === agent.id + '-activate' || loadingAction === agent.id + '-deactivate'}
                      className="rounded-lg border border-white/20 px-2 py-1 text-xs text-slate-300 hover:bg-white/10 disabled:opacity-50"
                      title={agent.status === 'active' ? 'Desativar' : 'Ativar'}
                    >
                      {agent.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(agent)}
                      disabled={loadingAction === agent.id + '-delete'}
                      className="rounded-lg border border-rose-500/30 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                      title="Excluir"
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AgentFormModal
        open={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setEditingAgent(undefined);
        }}
        agent={editingAgent}
        templates={templates || []}
        onSubmit={editingAgent ? handleUpdate : handleCreate}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir Agente"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}

// ============================================
// Componente Principal
// ============================================

export function Agents() {
  const [tab, setTab] = useState<TabType>('agents');
  const { data: templates } = useAgentTemplates();
  const createMutation = useCreateAgent();

  const [formModalOpen, setFormModalOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-white">Agents</h2>
          <p className="text-sm text-slate-400">Gestão de agentes e templates</p>
        </div>
        {tab === 'agents' && (
          <button
            onClick={() => setFormModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-green-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:scale-105"
          >
            + Criar Agente
          </button>
        )}
      </header>

      <div className="mb-6 flex gap-2 border-b border-white/10">
        <button
          onClick={() => setTab('templates')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-all ${
            tab === 'templates'
              ? 'border-cyan-500 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Templates
        </button>
        <button
          onClick={() => setTab('agents')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-all ${
            tab === 'agents'
              ? 'border-cyan-500 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Agentes
        </button>
      </div>

      <div>{tab === 'templates' ? <TemplatesTab /> : <AgentsTab />}</div>

      <AgentFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        templates={templates || []}
        onSubmit={(data) => {
          createMutation.mutate(data as CreateAgentInput, {
            onSuccess: () => setFormModalOpen(false),
            onError: (e) => alert((e as Error).message)
          });
        }}
        isLoading={createMutation.isPending}
      />
    </div>
  );
}
