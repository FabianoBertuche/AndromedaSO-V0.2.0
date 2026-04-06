// frontend/src/components/agents/tabs/PerformanceTab.tsx
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Activity,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type PerformanceTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function PerformanceTab({ agent }: PerformanceTabProps) {
  return (
    <div className="space-y-8">
      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-8">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-64 w-64 bg-cyan-500/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-48 w-48 bg-purple-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20">
            <Sparkles className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Performance Metrics Coming Soon
          </h2>
          <p className="max-w-md text-slate-400">
            Métricas avançadas de performance, latência, throughput e análise de custos estarão disponíveis em breve.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-cyan-400">
            <span>Em desenvolvimento</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <FormSection
        title="Prévia de Métricas"
        description="Estrutura de métricas que será implementada"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Métricas Planejadas"
            icon={BarChart3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Response Time */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-60">
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Tempo de Resposta</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-500">-- ms</div>
            <div className="mt-1 text-xs text-slate-600">P95 latência</div>
          </div>

          {/* Success Rate */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-60">
            <div className="flex items-center gap-2 text-slate-400">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Taxa de Sucesso</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-500">--%</div>
            <div className="mt-1 text-xs text-slate-600">Requisições bem-sucedidas</div>
          </div>

          {/* Throughput */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-60">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-medium">Throughput</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-500">--</div>
            <div className="mt-1 text-xs text-slate-600">Requisições/min</div>
          </div>

          {/* Activity */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-60">
            <div className="flex items-center gap-2 text-slate-400">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium">Atividade</span>
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-500">--</div>
            <div className="mt-1 text-xs text-slate-600">Total de interações</div>
          </div>
        </div>

        {/* Future Charts Area */}
        <div className="mt-6">
          <FormSectionHeader
            title="Visualizações Futuras"
            icon={TrendingUp}
          />
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-48 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <span className="text-sm text-slate-500">Gráfico de Latência</span>
              </div>
            </div>
            <div className="h-48 rounded-lg border border-dashed border-slate-700 bg-slate-950/30 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <span className="text-sm text-slate-500">Tendência de Uso</span>
              </div>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
