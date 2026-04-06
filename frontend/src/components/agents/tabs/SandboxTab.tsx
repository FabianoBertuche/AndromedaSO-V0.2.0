// frontend/src/components/agents/tabs/SandboxTab.tsx
import {
  Box,
  Play,
  Terminal,
  Settings,
  ChevronRight,
  FlaskConical,
  Code,
  Database,
  Shield
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type SandboxTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function SandboxTab({ agent }: SandboxTabProps) {
  return (
    <div className="space-y-8">
      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl border border-purple-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-8">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-64 w-64 bg-purple-500/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-48 w-48 bg-pink-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20">
            <FlaskConical className="h-8 w-8 text-purple-400" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Sandbox Configuration Coming Soon
          </h2>
          <p className="max-w-md text-slate-400">
            Ambiente isolado para testar o agente com diferentes cenários, dados simulados e configurações de segurança.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-purple-400">
            <span>Em desenvolvimento</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <FormSection
        title="Configuração de Sandbox"
        description="Ambiente de teste isolado"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Recursos Planejados"
            icon={Box}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Test Environment */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                <Terminal className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-200">Ambiente de Teste</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Console interativo para testar comandos e ver respostas em tempo real.
                </p>
                <div className="mt-3 rounded border border-dashed border-slate-700 bg-slate-900/50 p-2">
                  <code className="text-xs text-slate-600 font-mono">
                    {`> sandbox.test(agent, "Olá!")`}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Simulated Data */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/20">
                <Database className="h-5 w-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-200">Dados Simulados</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Configure conjuntos de dados de teste para simular cenários reais.
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-500">JSON</span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-500">CSV</span>
                  <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-500">Mock API</span>
                </div>
              </div>
            </div>
          </div>

          {/* Security Policies */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-200">Políticas de Segurança</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Limite permissões no sandbox para testes seguros.
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    Isolamento de dados
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    Rate limiting
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Code Editor */}
          <div className="rounded-lg border border-slate-700/50 bg-slate-950/50 p-4 opacity-70">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/20">
                <Code className="h-5 w-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-slate-200">Editor de Testes</h4>
                <p className="mt-1 text-xs text-slate-500">
                  Escreva e execute scripts de teste personalizados.
                </p>
                <div className="mt-3 rounded border border-dashed border-slate-700 bg-slate-900/50 p-2">
                  <div className="flex items-center gap-2">
                    <Play className="h-3 w-3 text-green-500" />
                    <span className="text-xs text-slate-600">Run Test Suite</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sandbox Settings Preview */}
        <div className="mt-6">
          <FormSectionHeader
            title="Configurações do Ambiente"
            icon={Settings}
          />
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-slate-700/50 bg-slate-950/30 p-4 opacity-50">
              <label className="text-xs font-medium text-slate-500">Timeout</label>
              <div className="mt-1 text-sm text-slate-600">30s</div>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-950/30 p-4 opacity-50">
              <label className="text-xs font-medium text-slate-500">Max Tokens</label>
              <div className="mt-1 text-sm text-slate-600">2000</div>
            </div>
            <div className="rounded-lg border border-slate-700/50 bg-slate-950/30 p-4 opacity-50">
              <label className="text-xs font-medium text-slate-500">Data Retention</label>
              <div className="mt-1 text-sm text-slate-600">24 hours</div>
            </div>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
