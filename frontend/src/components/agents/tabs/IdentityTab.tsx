// frontend/src/components/agents/tabs/IdentityTab.tsx
import { useCallback } from 'react';
import {
  Fingerprint,
  GitBranch,
  Target,
  Shield,
  Clock
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import { AuditMetadataDisplay } from '../AuditMetadataDisplay.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type IdentityTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function IdentityTab({ agent, onChange, readOnly = false, disabled = false }: IdentityTabProps) {
  const isDisabled = readOnly || disabled;

  const handleFieldChange = useCallback((field: keyof AgentInstance, value: unknown) => {
    onChange({ [field]: value } as Partial<AgentInstance>);
  }, [onChange]);

  return (
    <div className="space-y-8">
      {/* Seção 1: Identidade */}
      <FormSection
        title="Identidade"
        description="Informações básicas de identificação do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Dados Principais"
            icon={Fingerprint}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ID (read-only) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">ID</label>
            <input
              type="text"
              value={agent.id}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-200">
              Nome <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={isDisabled}
              placeholder="Nome do agente"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Slug */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-200">
              Slug <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.slug}
              onChange={(e) => handleFieldChange('slug', e.target.value)}
              disabled={isDisabled}
              placeholder="identificador-amigavel"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Version */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Versão</label>
            <input
              type="text"
              value={agent.version}
              onChange={(e) => handleFieldChange('version', e.target.value)}
              disabled={isDisabled}
              placeholder="1.0.0"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Short Description */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Descrição Curta</label>
            <textarea
              value={agent.shortDescription}
              onChange={(e) => handleFieldChange('shortDescription', e.target.value)}
              disabled={isDisabled}
              rows={2}
              placeholder="Resumo curto para listagens..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Long Description */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Descrição Detalhada</label>
            <textarea
              value={agent.longDescription}
              onChange={(e) => handleFieldChange('longDescription', e.target.value)}
              disabled={isDisabled}
              rows={4}
              placeholder="Descrição detalhada do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Owner */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Proprietário</label>
            <select
              value={agent.owner}
              onChange={(e) => handleFieldChange('owner', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="system">Sistema</option>
              <option value="workspace">Workspace</option>
              <option value="user">Usuário</option>
            </select>
          </div>

          {/* Source */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Origem</label>
            <select
              value={agent.source}
              onChange={(e) => handleFieldChange('source', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="manual">Manual</option>
              <option value="template">Template</option>
              <option value="import">Importação</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Status</label>
            <select
              value={agent.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="draft">Rascunho</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="archived">Arquivado</option>
              <option value="deleted">Excluído</option>
            </select>
          </div>
        </div>
      </FormSection>

      {/* Seção 2: Origem e Template */}
      <FormSection
        title="Origem e Template"
        description="Informações sobre o template de origem e herança"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Vínculo com Template"
            icon={GitBranch}
            badge={agent.isTemplateDerived ? { text: 'Derivado', variant: 'info' } : { text: 'Manual', variant: 'success' }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Template ID */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">ID do Template</label>
            <input
              type="text"
              value={agent.templateId || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Template Source */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Origem do Template</label>
            <input
              type="text"
              value={agent.templateSource || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Template Variant */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Variante do Template</label>
            <input
              type="text"
              value={agent.templateVariant || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Origin Template Version */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Versão do Template</label>
            <input
              type="text"
              value={agent.originTemplateVersion || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Template Manifest Ref */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Referência do Manifesto</label>
            <input
              type="text"
              value={agent.templateManifestRef || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Clone Of Agent ID */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Clone de Agente ID</label>
            <input
              type="text"
              value={agent.cloneOfAgentId || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Template Inheritance Mode */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Modo de Herança</label>
            <select
              value={agent.templateInheritanceMode}
              onChange={(e) => handleFieldChange('templateInheritanceMode', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="copy-on-create">Copiar na Criação</option>
              <option value="linked-metadata">Metadados Vinculados</option>
            </select>
          </div>

          {/* Template Lock Policy */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Política de Travamento</label>
            <select
              value={agent.templateLockPolicy}
              onChange={(e) => handleFieldChange('templateLockPolicy', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="none">Nenhuma</option>
              <option value="future">Futura</option>
              <option value="strict">Estrita</option>
            </select>
          </div>

          {/* Template Defaults Snapshot */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Snapshot dos Defaults</label>
            <textarea
              value={agent.templateDefaultsSnapshot ? JSON.stringify(agent.templateDefaultsSnapshot, null, 2) : '-'}
              readOnly
              rows={4}
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-xs text-slate-400 cursor-not-allowed font-mono resize-y"
            />
          </div>

          {/* Is Template Derived */}
          <div className="lg:col-span-2 space-y-1">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agent.isTemplateDerived}
                readOnly
                className="h-4 w-4 rounded border-slate-600 bg-slate-900/50 text-cyan-500 cursor-not-allowed"
              />
              <span className="text-sm text-slate-400">Derivado de Template</span>
            </label>
          </div>
        </div>
      </FormSection>

      {/* Seção 3: Papel e Objetivo */}
      <FormSection
        title="Papel e Objetivo"
        description="Definição do propósito e função do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Propósito Funcional"
            icon={Target}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Role */}
          <div className="space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Papel <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={agent.role}
              onChange={(e) => handleFieldChange('role', e.target.value)}
              disabled={isDisabled}
              placeholder="Ex: Assistente de Suporte"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Domain */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Domínio</label>
            <input
              type="text"
              value={agent.domain}
              onChange={(e) => handleFieldChange('domain', e.target.value)}
              disabled={isDisabled}
              placeholder="general"
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Mission */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Missão</label>
            <textarea
              value={agent.mission}
              onChange={(e) => handleFieldChange('mission', e.target.value)}
              disabled={isDisabled}
              rows={2}
              placeholder="Missão resumida do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Objective */}
          <div className="lg:col-span-2 space-y-1 border-l-4 border-cyan-500 pl-3">
            <label className="text-sm font-medium text-slate-200">
              Objetivo <span className="text-cyan-400">*</span>
            </label>
            <textarea
              value={agent.objective}
              onChange={(e) => handleFieldChange('objective', e.target.value)}
              disabled={isDisabled}
              rows={3}
              placeholder="Objetivo funcional primário do agente..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50 resize-y"
            />
          </div>

          {/* Success Criteria */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Critérios de Sucesso</label>
            <ChipInput
              values={agent.successCriteria}
              onChange={(values) => handleFieldChange('successCriteria', values)}
              disabled={isDisabled}
              placeholder="Adicionar critério..."
            />
          </div>
        </div>
      </FormSection>

      {/* Seção 4: Governança e Edição */}
      <FormSection
        title="Governança e Edição"
        description="Controles de acesso, visibilidade e categorização"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Configurações de Governança"
            icon={Shield}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Toggles */}
          <div className="space-y-4">
            {/* isActive */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agent.isActive ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={agent.isActive}
                  onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agent.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-slate-300">Agente ativo</span>
            </label>

            {/* isEditable */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${agent.isEditable ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                <input
                  type="checkbox"
                  checked={agent.isEditable}
                  onChange={(e) => handleFieldChange('isEditable', e.target.checked)}
                  disabled={isDisabled}
                  className="sr-only"
                />
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${agent.isEditable ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-slate-300">Permitir edição</span>
            </label>
          </div>

          {/* Visibility */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Visibilidade</label>
            <select
              value={agent.visibility}
              onChange={(e) => handleFieldChange('visibility', e.target.value)}
              disabled={isDisabled}
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            >
              <option value="private">Privado</option>
              <option value="internal">Interno</option>
              <option value="public">Público</option>
            </select>
          </div>

          {/* Audit Metadata - createdBy */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Criado por</label>
            <input
              type="text"
              value={agent.auditMetadata.createdBy || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Audit Metadata - updatedBy */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Atualizado por</label>
            <input
              type="text"
              value={agent.auditMetadata.updatedBy || '-'}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Audit Metadata - reason */}
          <div className="lg:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-300">Motivo da Alteração</label>
            <input
              type="text"
              value={agent.auditMetadata.reason || ''}
              onChange={(e) => handleFieldChange('auditMetadata', { ...agent.auditMetadata, reason: e.target.value })}
              disabled={isDisabled}
              placeholder="Motivo da última alteração..."
              className="w-full rounded border border-slate-700 bg-slate-950/70 p-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>
      </FormSection>

      {/* Seção 5: Ciclo de Vida */}
      <FormSection
        title="Ciclo de Vida"
        description="Histórico e metadados de ciclo de vida do agente"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Histórico"
            icon={Clock}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Origin Type */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Tipo de Origem</label>
            <input
              type="text"
              value={agent.originType}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Config Snapshot Version */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Versão do Snapshot</label>
            <input
              type="number"
              value={agent.configSnapshotVersion}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Created At */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Criado em</label>
            <input
              type="text"
              value={formatDate(agent.createdAt)}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Updated At */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Atualizado em</label>
            <input
              type="text"
              value={formatDate(agent.updatedAt)}
              readOnly
              className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Activated At (conditional) */}
          {agent.activatedAt && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Ativado em</label>
              <input
                type="text"
                value={formatDate(agent.activatedAt)}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}

          {/* Deactivated At (conditional) */}
          {agent.deactivatedAt && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-300">Desativado em</label>
              <input
                type="text"
                value={formatDate(agent.deactivatedAt)}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}

          {/* Is Deleted & Deleted At (conditional) */}
          {agent.isDeleted && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Status</label>
                <div className="w-full rounded border border-red-500/50 bg-red-950/20 p-2 text-sm text-red-400">
                  Excluído
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-300">Excluído em</label>
                <input
                  type="text"
                  value={formatDate(agent.deletedAt)}
                  readOnly
                  className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
                />
              </div>
            </>
          )}

          {/* Clone Of Agent ID (conditional) */}
          {agent.cloneOfAgentId && (
            <div className="lg:col-span-2 space-y-1">
              <label className="text-sm font-medium text-slate-300">Clone do Agente</label>
              <input
                type="text"
                value={agent.cloneOfAgentId}
                readOnly
                className="w-full rounded border border-slate-700 bg-slate-900/50 p-2 text-sm text-slate-400 cursor-not-allowed"
              />
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}

// Helper function for date formatting
function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

// Chip Input Component
interface ChipInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

function ChipInput({ values, onChange, disabled, placeholder }: ChipInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = e.currentTarget.value.trim();
      if (value && !values.includes(value)) {
        onChange([...values, value]);
        e.currentTarget.value = '';
      }
    } else if (e.key === 'Backspace' && !e.currentTarget.value && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const removeChip = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 min-h-[2.5rem] p-2 rounded border border-slate-700 bg-slate-950/70 ${disabled ? 'opacity-50' : ''}`}>
      {values.map((value, index) => (
        <span key={`${value}-${index}`} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-cyan-500/20 text-cyan-100 text-sm">
          {value}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeChip(index)}
              className="ml-1 text-cyan-300 hover:text-cyan-100 focus:outline-none"
            >
              ×
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder || 'Adicionar...'}
        onKeyDown={handleKeyDown}
        className="flex-1 bg-transparent text-white placeholder-slate-500 focus:outline-none min-w-[120px] py-1"
      />
    </div>
  );
}
