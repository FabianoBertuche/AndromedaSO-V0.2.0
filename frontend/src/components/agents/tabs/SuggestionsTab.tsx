// frontend/src/components/agents/tabs/SuggestionsTab.tsx
import {
  Lightbulb,
  Sparkles,
  ChevronRight,
  BookOpen,
  Wand2,
  MessageSquare,
  Target,
  Zap
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type SuggestionsTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function SuggestionsTab({ agent }: SuggestionsTabProps) {
  return (
    <div className="space-y-8">
      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-8">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-64 w-64 bg-amber-500/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-48 w-48 bg-orange-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/20">
            <Lightbulb className="h-8 w-8 text-amber-400" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Playbook Suggestions Coming Soon
          </h2>
          <p className="max-w-md text-slate-400">
            Sugestões inteligentes de playbooks, melhorias de prompt e otimizações baseadas em análise de padrões de uso.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-amber-400">
            <span>Em desenvolvimento</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <FormSection
        title="Sugestões Planejadas"
        description="Tipos de recomendações que serão implementadas"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Categorias de Sugestões"
            icon={Sparkles}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prompt Improvements */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
                <Wand2 className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-200">Melhorias de Prompt</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Sugestões para otimizar system prompts e instruções operacionais baseadas em análise de desempenho.
                </p>
              </div>
            </div>
          </div>

          {/* Playbook Recommendations */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <BookOpen className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-200">Playbooks Recomendados</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Recomendações de playbooks baseadas no domínio, papel e objetivos do agente.
                </p>
              </div>
            </div>
          </div>

          {/* Conversation Patterns */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <MessageSquare className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-200">Padrões de Conversação</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Identificação de padrões em interações e sugestões para melhorar o fluxo conversacional.
                </p>
              </div>
            </div>
          </div>

          {/* Capability Enhancements */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Zap className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-200">Aprimoramentos de Capacidades</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Sugestões de ferramentas, conhecimentos e guardrails relevantes para o contexto do agente.
                </p>
              </div>
            </div>
          </div>

          {/* Goal Optimization */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-500/20">
                <Target className="h-5 w-5 text-pink-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-200">Otimização de Objetivos</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Análise de objetivos e critérios de sucesso com propostas de refinamento.
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder for future */}
          <div className="rounded-lg border border-dashed border-slate-700/50 bg-slate-950/30 p-4 flex items-center justify-center">
            <span className="text-xs text-slate-600">Mais categorias em breve...</span>
          </div>
        </div>

        {/* How it will work */}
        <div className="mt-6">
          <FormSectionHeader
            title="Como Funcionará"
            icon={BookOpen}
          />
          <div className="mt-4 rounded-lg border border-slate-700/30 bg-slate-950/30 p-4">
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Análise automática de padrões de uso e conversações
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Sugestões contextualizadas baseadas no domínio do agente
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Aplicação em um clique com preview de mudanças
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                Aprendizado contínuo com feedback do usuário
              </li>
            </ul>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
