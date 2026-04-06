// frontend/src/components/agents/tabs/HistoryTab.tsx
import { useCallback } from 'react';
import {
  Clock,
  History,
  RotateCcw,
  FileText,
  Activity,
  User,
  Zap
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type HistoryTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function HistoryTab({ agent }: HistoryTabProps) {
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      draft: 'Rascunho',
      active: 'Ativo',
      inactive: 'Inativo',
      archived: 'Arquivado',
      deleted: 'Excluído',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      active: 'text-green-400 bg-green-500/20 border-green-500/30',
      inactive: 'text-slate-400 bg-slate-500/20 border-slate-500/30',
      archived: 'text-purple-400 bg-purple-500/20 border-purple-500/30',
      deleted: 'text-red-400 bg-red-500/20 border-red-500/30',
    };
    return colors[status] || colors.draft;
  };

  // Build timeline events
  const buildTimeline = useCallback(() => {
    const events: Array<{
      type: 'creation' | 'update' | 'activation' | 'deactivation' | 'version' | 'audit';
      timestamp: string | null;
      title: string;
      description: string;
      icon: typeof Clock;
      color: string;
    }> = [];

    // Creation event
    events.push({
      type: 'creation',
      timestamp: agent.createdAt,
      title: 'Agente Criado',
      description: `Criado por ${agent.auditMetadata.createdBy || 'sistema'}`,
      icon: Clock,
      color: 'text-cyan-400',
    });

    // Version snapshot
    events.push({
      type: 'version',
      timestamp: agent.createdAt,
      title: 'Versão Inicial',
      description: `Snapshot de configuração v${agent.configSnapshotVersion}`,
      icon: FileText,
      color: 'text-purple-400',
    });

    // Activation
    if (agent.activatedAt) {
      events.push({
        type: 'activation',
        timestamp: agent.activatedAt,
        title: 'Agente Ativado',
        description: 'Agente passou para status ativo',
        icon: Zap,
        color: 'text-green-400',
      });
    }

    // Updates (based on updatedAt)
    if (agent.updatedAt && agent.updatedAt !== agent.createdAt) {
      events.push({
        type: 'update',
        timestamp: agent.updatedAt,
        title: 'Configuração Atualizada',
        description: agent.auditMetadata.updatedBy
          ? `Atualizado por ${agent.auditMetadata.updatedBy}`
          : 'Configuração modificada',
        icon: RotateCcw,
        color: 'text-amber-400',
      });
    }

    // Deactivation
    if (agent.deactivatedAt) {
      events.push({
        type: 'deactivation',
        timestamp: agent.deactivatedAt,
        title: 'Agente Desativado',
        description: 'Agente foi desativado',
        icon: Activity,
        color: 'text-slate-400',
      });
    }

    // Sort by timestamp (newest first)
    return events.sort((a, b) => {
      if (!a.timestamp || !b.timestamp) return 0;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }, [agent]);

  const timelineEvents = buildTimeline();

  return (
    <div className="space-y-8">
      {/* Timeline Section */}
      <FormSection
        title="Timeline de Eventos"
        description="Histórico cronológico do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Histórico do Agente"
            icon={History}
          />
        </div>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-slate-600/50 to-slate-700/50" />

          {/* Timeline events */}
          <div className="space-y-6">
            {timelineEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={index} className="relative flex gap-4">
                  {/* Icon marker */}
                  <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-900 ${event.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Event content */}
                  <div className="flex-1 rounded-lg border border-slate-700/50 bg-slate-950/50 p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-slate-200">
                        {event.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {event.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FormSection>

      {/* Config Snapshot Section */}
      <FormSection
        title="Versões de Configuração"
        description="Snapshots e versionamento do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Snapshot Atual"
            icon={FileText}
            badge={{ text: `v${agent.configSnapshotVersion}`, variant: 'info' }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Versão do Snapshot</label>
            <input
              type="text"
              value={`v${agent.configSnapshotVersion}`}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Status Atual</label>
            <div className={`w-full rounded border px-3 py-2 text-sm ${getStatusColor(agent.status)}`}>
              {getStatusLabel(agent.status)}
            </div>
          </div>

          {agent.lastResolvedAt && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Última Resolução</label>
              <input
                type="text"
                value={formatDate(agent.lastResolvedAt)}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}

          {agent.lastValidatedAt && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Última Validação</label>
              <input
                type="text"
                value={formatDate(agent.lastValidatedAt)}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}
        </div>

        {/* Effective Policies Info */}
        <div className="mt-6 space-y-3">
          <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Políticas Efetivas Resolvidas
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { label: 'Behavior Profile', active: !!agent.effectiveBehaviorProfile },
              { label: 'Execution Policy', active: !!agent.effectiveExecutionPolicy },
              { label: 'Channel Policy', active: !!agent.effectiveChannelPolicy },
              { label: 'Model Policy', active: !!agent.effectiveModelPolicy },
            ].map((policy) => (
              <div
                key={policy.label}
                className={`flex items-center gap-2 rounded border px-2 py-1.5 text-xs ${
                  policy.active
                    ? 'border-green-500/30 bg-green-500/10 text-green-400'
                    : 'border-slate-700 bg-slate-900/50 text-slate-500'
                }`}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${policy.active ? 'bg-green-400' : 'bg-slate-600'}`} />
                {policy.label}
              </div>
            ))}
          </div>
        </div>
      </FormSection>

      {/* Audit Events Section */}
      <FormSection
        title="Eventos de Auditoria"
        description="Registro de alterações e auditoria"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Metadados de Auditoria"
            icon={User}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Criado por</label>
            <input
              type="text"
              value={agent.auditMetadata.createdBy || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Última atualização por</label>
            <input
              type="text"
              value={agent.auditMetadata.updatedBy || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Motivo da Alteração</label>
            <input
              type="text"
              value={agent.auditMetadata.reason || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>
      </FormSection>
    </div>
  );
}
