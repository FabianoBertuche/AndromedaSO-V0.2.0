import { useState, useEffect, useCallback, useRef } from 'react';
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
import { useProviders, useProviderCatalog } from '../hooks/useProviders';
import type {
  AgentInstance,
  CreateAgentInput,
  UpdateAgentInput
} from '../types/kernel';
import { mapBackendToFrontend, mapFrontendToBackend } from '../lib/agentMapper.js';
import {
  Bot,
  Copy,
  Cpu,
  History,
  Lightbulb,
  LineChart,
  MessageSquare,
  Plus,
  Save,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
  Layers
} from 'lucide-react';

// Tab components
import { IdentityTab } from '../components/agents/tabs/IdentityTab.js';
import { ModelTab } from '../components/agents/tabs/ModelTab.js';
import { HistoryTab } from '../components/agents/tabs/HistoryTab.js';
import { PerformanceTab } from '../components/agents/tabs/PerformanceTab.js';
import { SuggestionsTab } from '../components/agents/tabs/SuggestionsTab.js';
import { BehaviorTab } from '../components/agents/tabs/BehaviorTab.js';
import { SafeguardsTab } from '../components/agents/tabs/SafeguardsTab.js';
import { SandboxTab } from '../components/agents/tabs/SandboxTab.js';
import { ChatTab } from '../components/agents/tabs/ChatTab.js';
import { CapabilitiesTab } from '../components/agents/tabs/CapabilitiesTab.js';
import { ChannelsTab } from '../components/agents/tabs/ChannelsTab.js';
import { ResolvedConfigPanel } from '../components/agents/ResolvedConfigPanel.js';

// ============================================
// Hook para buscar modelos do catálogo
// ============================================

function useModelCatalog() {
  const { data: providers } = useProviders();

  const activeProvider = providers?.providers?.find(
    p => p.health !== 'unhealthy' && p.health !== 'down'
  ) ?? null;

  const { data: catalog, isLoading: catalogLoading } = useProviderCatalog(activeProvider?.id ?? null);

  const models = catalog?.models?.map(m => ({
    id: m.modelId,
    displayName: m.displayName || m.modelId
  })) ?? [];

  return {
    models,
    isLoading: catalogLoading || !providers,
    providerId: activeProvider?.id ?? null
  };
}

// ============================================
// Tipos
// ============================================

type AgentTab = 'identity' | 'model' | 'history' | 'performance' | 'suggestions' | 'behavior' | 'safeguards' | 'sandbox' | 'chat' | 'capabilities' | 'channels';

interface TabConfig {
  id: AgentTab;
  label: string;
  icon: React.ElementType;
}

// ============================================
// Templates de Agentes
// ============================================

const agentTemplates = [
  {
    id: 'assistant',
    name: 'Assistant',
    summary: 'Agente especializado em assistência geral e execução de tarefas',
    defaults: {
      role: 'General Assistant',
      shortDescription: 'Assistente geral para operações e suporte.',
      longDescription: 'Ajuda a organizar tarefas, responder perguntas e orientar próximos passos com clareza.',
      templateId: 'agent-assistant-v1'
    }
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    summary: 'Agente especializado em revisão e análise crítica',
    defaults: {
      role: 'Critical Reviewer',
      shortDescription: 'Especialista em revisão e análise crítica.',
      longDescription: 'Revisa conteúdo, identifica problemas e sugere melhorias com foco em qualidade.',
      templateId: 'agent-reviewer-v1'
    }
  }
];

// ============================================
// Configuração das Tabs
// ============================================

const TABS_CONFIG: TabConfig[] = [
  { id: 'identity', label: 'Identity', icon: MessageSquare },
  { id: 'model', label: 'Model', icon: Cpu },
  { id: 'history', label: 'History', icon: History },
  { id: 'performance', label: 'Performance', icon: LineChart },
  { id: 'suggestions', label: 'Suggestions', icon: Lightbulb },
  { id: 'behavior', label: 'Behavior', icon: SlidersHorizontal },
  { id: 'safeguards', label: 'Safeguards', icon: Shield },
  { id: 'sandbox', label: 'Sandbox', icon: Settings2 },
  { id: 'chat', label: 'Chat', icon: Bot },
  { id: 'capabilities', label: 'Capabilities', icon: Sparkles },
  { id: 'channels', label: 'Channels', icon: Layers },
];

// ============================================
// Sub-componentes
// ============================================

function Badge({ status }: { status: string }) {
  const isActive = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
        isActive
          ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
          : 'bg-slate-500/15 text-slate-400 ring-slate-500/30'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
      {isActive ? 'active' : 'disabled'}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/30">
      <p className="text-sm text-slate-500">{message}</p>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-slate-800 bg-slate-900/95 p-5 shadow-xl backdrop-blur-xl">
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        <p className="mt-2 text-sm text-slate-400">{message}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            onClick={onCancel}
            className="rounded-lg border border-slate-700 px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-500"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Componente Principal
// ============================================

export function Agents() {
  const { data: agentsData, isLoading: agentsLoading } = useAgents();
  // Converte dados do backend (legado) para formato canônico do frontend
  const agents = agentsData ? agentsData.map(agent => mapBackendToFrontend(agent as unknown as import('../lib/agentMapper.js').BackendAgent)) : [];
  const { data: templates } = useAgentTemplates();
  const { models } = useModelCatalog();

  // Debug logs - REMOVER APÓS DEBUG
  console.log('Agents - Models from catalog:', models);

  // State
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AgentTab>('identity');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(agentTemplates[0].id);
  const [confirmDelete, setConfirmDelete] = useState<AgentInstance | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showResolvedConfig, setShowResolvedConfig] = useState(false);
  
  // State management for form changes
  const [formChanges, setFormChanges] = useState<Partial<AgentInstance>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Track visited tabs for lazy loading
  const visitedTabsRef = useRef<Set<AgentTab>>(new Set(['identity']));

  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();
  const duplicateMutation = useDuplicateAgent();
  const activateMutation = useActivateAgent();
  const deactivateMutation = useDeactivateAgent();

  const selectedAgent = agents?.find(a => a.id === selectedAgentId) ?? null;

  const [createForm, setCreateForm] = useState<CreateAgentInput>(() => ({
    name: '',
    templateId: agentTemplates[0].id,
    visibility: 'private',
    overrides: {
      role: agentTemplates[0].defaults.role,
      shortDescription: agentTemplates[0].defaults.shortDescription,
      longDescription: agentTemplates[0].defaults.longDescription
    }
  }));

  // Handle field changes from tabs
  const handleFieldChange = useCallback((updates: Partial<AgentInstance>) => {
    setFormChanges(prev => ({ ...prev, ...updates }));
    setHasUnsavedChanges(true);
  }, []);

  // Save all changes
  const handleSave = useCallback(() => {
    if (!selectedAgentId || Object.keys(formChanges).length === 0) return;
    
    // Converte campos canônicos para formato legado do backend
    const backendPayload = mapFrontendToBackend(formChanges);
    
    updateMutation.mutate(
      { agentId: selectedAgentId, payload: backendPayload as UpdateAgentInput },
      { 
        onSuccess: () => {
          setFormChanges({});
          setHasUnsavedChanges(false);
        },
        onError: (e) => alert((e as Error).message)
      }
    );
  }, [selectedAgentId, formChanges, updateMutation]);

  // Handle tab change with optional auto-save
  const handleTabChange = useCallback((tab: AgentTab) => {
    // Mark tab as visited for lazy loading
    visitedTabsRef.current.add(tab);
    setActiveTab(tab);
  }, []);

  // Reset form changes when agent changes
  useEffect(() => {
    setFormChanges({});
    setHasUnsavedChanges(false);
    visitedTabsRef.current = new Set(['identity']);
    setActiveTab('identity');
  }, [selectedAgentId]);

  // CRUD handlers
  const handleCreate = (data: CreateAgentInput) => {
    createMutation.mutate(data, {
      onSuccess: (created) => {
        setIsCreateOpen(false);
        setSelectedAgentId(created.id);
        setCreateForm({
          name: '',
          templateId: agentTemplates[0].id,
          visibility: 'private',
          overrides: {
            role: agentTemplates[0].defaults.role,
            shortDescription: agentTemplates[0].defaults.shortDescription,
            longDescription: agentTemplates[0].defaults.longDescription
          }
        });
      },
      onError: (e) => alert((e as Error).message)
    });
  };

  const handleDelete = () => {
    if (!confirmDelete) return;
    setLoadingAction(confirmDelete.id + '-delete');
    deleteMutation.mutate(confirmDelete.id, {
      onSuccess: () => {
        setLoadingAction(null);
        setConfirmDelete(null);
        if (selectedAgentId === confirmDelete.id) {
          setSelectedAgentId(null);
        }
      },
      onError: (e) => {
        setLoadingAction(null);
        alert((e as Error).message);
      }
    });
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
    const mutation = agent.status === 'active' ? deactivateMutation : activateMutation;
    mutation.mutate(agent.id, {
      onSuccess: () => setLoadingAction(null),
      onError: (e) => {
        setLoadingAction(null);
        alert((e as Error).message);
      }
    });
  };

  const applyTemplate = (templateId: string) => {
    const template = agentTemplates.find(t => t.id === templateId) ?? agentTemplates[0];
    setSelectedTemplateId(template.id);
    setCreateForm(prev => ({
      ...prev,
      templateId: template.id,
      overrides: {
        ...prev.overrides,
        role: template.defaults.role,
        shortDescription: template.defaults.shortDescription,
        longDescription: template.defaults.longDescription
      }
    }));
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name?.trim()) return;

    // Usa o template selecionado ou 'assistant' como padrão
    const templateId = selectedTemplateId || 'assistant';

    handleCreate({
      templateId,
      name: createForm.name,
      slug: createForm.slug || undefined,
      description: createForm.description || undefined,
      visibility: createForm.visibility || 'private',
      status: 'active'
    });
  };

  // Render active tab content
  const renderTabContent = () => {
    if (!selectedAgent) return null;

    // Create a merged agent object with pending changes
    const mergedAgent = { ...selectedAgent, ...formChanges };

    const tabProps = {
      agent: mergedAgent,
      onChange: handleFieldChange,
      readOnly: false,
      disabled: updateMutation.isPending
    };

    switch (activeTab) {
      case 'identity':
        return <IdentityTab {...tabProps} />;
      case 'model':
        console.log('Agents - Passing models to ModelTab:', models);
        return <ModelTab {...tabProps} availableModels={models} />;
      case 'history':
        return <HistoryTab {...tabProps} />;
      case 'performance':
        return <PerformanceTab {...tabProps} />;
      case 'suggestions':
        return <SuggestionsTab {...tabProps} />;
      case 'behavior':
        return <BehaviorTab {...tabProps} />;
      case 'safeguards':
        return <SafeguardsTab {...tabProps} />;
      case 'sandbox':
        return <SandboxTab {...tabProps} />;
      case 'chat':
        return <ChatTab {...tabProps} />;
      case 'capabilities':
        return <CapabilitiesTab {...tabProps} />;
      case 'channels':
        return <ChannelsTab {...tabProps} />;
      default:
        return null;
    }
  };

  // Render empty state if no agents
  if (agentsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm text-slate-500">Carregando agentes...</p>
      </div>
    );
  }

  if (!agents?.length && !isCreateOpen) {
    return (
      <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
        {/* Coluna esquerda vazia */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-xs uppercase tracking-widest text-slate-500">Agents</div>
          </div>
          <EmptyState message="Nenhum agente criado" />
        </section>

        {/* Coluna direita vazia */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <EmptyState message="Selecione um agente para editar" />
        </section>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,1fr]">
      {/* ============================================ */}
      {/* Coluna Esquerda: Lista de Agentes + Criação */}
      {/* ============================================ */}
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-widest text-slate-500">Agents</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(!isCreateOpen)}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/50 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
            >
              <Plus className="h-4 w-4" />
              New Agent
            </button>
          </div>
        </div>

        {/* Lista de Agentes */}
        <div className="space-y-3">
          {agents?.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSelectedAgentId(agent.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                agent.id === selectedAgentId
                  ? 'border-cyan-400/50 bg-cyan-500/10'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-semibold text-white">{agent.name}</div>
              <div className="mt-1 text-xs text-slate-400">{agent.role || 'Sem papel'}</div>
              <div className="mt-3 flex items-center justify-between">
                <Badge status={agent.status} />
                <span className="text-[11px] text-slate-600">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Formulário de Criação (inline) */}
        {isCreateOpen && (
          <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-500/10 p-2 text-cyan-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Criar novo agente</h3>
                <p className="text-xs text-slate-400">Escolha um template e preencha as informações.</p>
              </div>
            </div>

            {/* Template Selection */}
            <div className="mb-4 grid gap-2">
              {agentTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => applyTemplate(template.id)}
                  className={`rounded-xl border p-3 text-left transition ${
                    template.id === selectedTemplateId
                      ? 'border-cyan-400/50 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-semibold text-white">{template.name}</div>
                  <div className="mt-1 text-[10px] leading-tight text-slate-400">{template.summary}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400">Nome do agente</label>
                <input
                  type="text"
                  value={createForm.name ?? ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex.: Analista de Incidentes"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Papel principal</label>
                <input
                  type="text"
                  value={createForm.overrides?.role ?? ''}
                  onChange={(e) => setCreateForm(prev => ({
                    ...prev,
                    overrides: { ...prev.overrides, role: e.target.value }
                  }))}
                  placeholder="Ex.: Incident Analyst"
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400">Descrição</label>
                <textarea
                  value={createForm.overrides?.shortDescription ?? ''}
                  onChange={(e) => setCreateForm(prev => ({
                    ...prev,
                    overrides: { ...prev.overrides, shortDescription: e.target.value }
                  }))}
                  rows={2}
                  placeholder="Explique para que este agente existe..."
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/20"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-full border border-slate-700 px-4 py-2 text-xs text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || !createForm.name?.trim()}
                  className="rounded-full border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-100 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar agente'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* ============================================ */}
      {/* Coluna Direita: Painel de Edição do Agente */}
      {/* ============================================ */}
      <section className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        {!selectedAgent ? (
          <EmptyState message="Selecione um agente para editar" />
        ) : (
          <>
            {/* Agent Info Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-cyan-400/70">
                  {selectedAgent.templateId ?? 'Custom Agent'}
                </div>
                <h2 className="mt-2 text-2xl font-semibold text-white">{selectedAgent.name}</h2>
                <p className="mt-2 text-sm text-slate-400">
                  {selectedAgent.shortDescription || selectedAgent.role || 'Carregando configurações do agente...'}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedAgent.tags?.map((tag) => (
                    <span key={tag} className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleActivate(selectedAgent)}
                  disabled={loadingAction === selectedAgent.id + '-activate'}
                  className={`rounded-full border px-4 py-2 text-xs font-medium transition ${
                    selectedAgent.status === 'active'
                      ? 'border-amber-400/50 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
                      : 'border-emerald-400/50 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
                  } disabled:opacity-50`}
                >
                  {selectedAgent.status === 'active' ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResolvedConfig(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Configuração Resolvida
                </button>
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="mt-6">
              <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-1 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {TABS_CONFIG.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const hasChanges = isActive && hasUnsavedChanges;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        relative flex items-center gap-2 whitespace-nowrap rounded-t-lg px-4 py-2.5 text-sm font-medium transition-all
                        ${isActive 
                          ? 'border-b-2 border-cyan-500 text-cyan-400 bg-cyan-500/5' 
                          : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
                        }
                      `}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                      {tab.label}
                      {hasChanges && (
                        <span className="ml-1 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content with Lazy Loading */}
            <div className="mt-6 min-h-[400px]">
              {renderTabContent()}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => handleDuplicate(selectedAgent)}
                disabled={loadingAction === selectedAgent.id + '-duplicate'}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-xs text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
              >
                <Copy className="h-3.5 w-3.5" />
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(selectedAgent)}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 transition hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}

        {/* Floating Save Button */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-sm text-slate-300">Alterações pendentes</span>
            </div>
            <button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/50 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        )}
      </section>

      {/* Resolved Config Side Panel */}
      {showResolvedConfig && selectedAgent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-slate-800 bg-slate-900/95 p-6 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Configuração Resolvida</h2>
              <button
                onClick={() => setShowResolvedConfig(false)}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-6 text-sm text-slate-400">
              Visualização da configuração efetiva aplicada ao agente após resolução de templates, 
              heranças e defaults.
            </p>
            <ResolvedConfigPanel agent={selectedAgent} />
          </div>
        </div>
      )}

      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir Agente"
        message={`Tem certeza que deseja excluir "${confirmDelete?.name}"? Esta ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
