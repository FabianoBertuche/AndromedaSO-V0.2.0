// frontend/src/components/agents/tabs/ChatTab.tsx
import {
  MessageSquare,
  Send,
  ChevronRight,
  Bot,
  User,
  Sparkles,
  Paperclip,
  Mic
} from 'lucide-react';
import { FormSection } from '../FormSection.js';
import { FormSectionHeader } from '../FormSectionHeader.js';
import type { AgentInstance } from '../../../types/kernel.js';

export type ChatTabProps = {
  agent: AgentInstance;
  onChange: (updates: Partial<AgentInstance>) => void;
  readOnly?: boolean;
  disabled?: boolean;
};

export function ChatTab({ agent }: ChatTabProps) {
  return (
    <div className="space-y-8">
      {/* Coming Soon Banner */}
      <div className="relative overflow-hidden rounded-xl border border-pink-500/30 bg-gradient-to-br from-slate-900/80 to-slate-950/90 p-8">
        {/* Decorative elements */}
        <div className="absolute right-0 top-0 h-64 w-64 bg-pink-500/10 blur-3xl" />
        <div className="absolute left-0 bottom-0 h-48 w-48 bg-rose-500/10 blur-3xl" />
        
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-500/20">
            <MessageSquare className="h-8 w-8 text-pink-400" />
          </div>
          <h2 className="mb-2 text-2xl font-semibold text-white">
            Interactive Chat Coming Soon
          </h2>
          <p className="max-w-md text-slate-400">
            Interface de chat interativo para conversar diretamente com o agente, testar respostas e validar comportamento em tempo real.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-pink-400">
            <span>Em desenvolvimento</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <FormSection
        title="Interface de Chat"
        description="Preview da estrutura de chat"
      >
        <div className="mb-4">
          <FormSectionHeader
            title="Conversação Interativa"
            icon={Sparkles}
          />
        </div>

        {/* Chat Interface Mockup */}
        <div className="rounded-lg border border-slate-700/50 bg-slate-950/80 overflow-hidden opacity-80">
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-700/50 bg-slate-900/50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                <Bot className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-200">{agent.name}</h4>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  Online
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-500">v{agent.version}</span>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="h-64 overflow-y-auto p-4 space-y-4">
            {/* Agent Message */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="max-w-[80%] rounded-lg rounded-tl-none bg-slate-800/50 px-3 py-2">
                <p className="text-sm text-slate-300">
                  Olá! Sou o {agent.name}. {agent.shortDescription || 'Como posso ajudar?'}
                </p>
                <span className="mt-1 block text-xs text-slate-600">10:30</span>
              </div>
            </div>

            {/* User Message */}
            <div className="flex justify-end gap-3">
              <div className="max-w-[80%] rounded-lg rounded-tr-none bg-cyan-500/20 px-3 py-2">
                <p className="text-sm text-cyan-100">
                  Olá! Gostaria de testar suas capacidades.
                </p>
                <span className="mt-1 block text-right text-xs text-cyan-600">10:31</span>
              </div>
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700/50">
                <User className="h-4 w-4 text-slate-400" />
              </div>
            </div>

            {/* Agent Response */}
            <div className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="max-w-[80%] rounded-lg rounded-tl-none bg-slate-800/50 px-3 py-2">
                <p className="text-sm text-slate-300">
                  Fico feliz em ajudar! Posso responder perguntas, executar tarefas e colaborar em diversos contextos. O que gostaria de explorar?
                </p>
                <span className="mt-1 block text-xs text-slate-600">10:31</span>
              </div>
            </div>

            {/* Typing Indicator */}
            <div className="flex gap-3 opacity-50">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20">
                <Bot className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="flex items-center gap-1 rounded-lg rounded-tl-none bg-slate-800/50 px-3 py-2">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>

          {/* Chat Input Area */}
          <div className="border-t border-slate-700/50 bg-slate-900/50 p-3">
            <div className="flex items-center gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300">
                <Paperclip className="h-5 w-5" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Digite sua mensagem..."
                  disabled
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 disabled:opacity-50"
                />
              </div>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300">
                <Mic className="h-5 w-5" />
              </button>
              <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-50">
                <Send className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-2 text-center text-xs text-slate-600">
              Interface de chat em desenvolvimento
            </div>
          </div>
        </div>

        {/* Features Preview */}
        <div className="mt-6">
          <FormSectionHeader
            title="Funcionalidades Planejadas"
            icon={Sparkles}
          />
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MessageSquare, label: 'Chat em Tempo Real', desc: 'WebSocket para resposta imediata' },
              { icon: Paperclip, label: 'Anexos', desc: 'Upload de arquivos e imagens' },
              { icon: Bot, label: 'Contexto Persistente', desc: 'Memória da conversa' },
              { icon: Sparkles, label: 'Respostas Formatadas', desc: 'Markdown, código, tabelas' },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.label} className="rounded-lg border border-slate-700/50 bg-slate-950/30 p-3 opacity-60">
                  <Icon className="h-4 w-4 text-slate-500 mb-2" />
                  <div className="text-xs font-medium text-slate-400">{feature.label}</div>
                  <div className="text-xs text-slate-600">{feature.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </FormSection>
    </div>
  );
}
