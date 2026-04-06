import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Book, Clock, Cpu, Database, DollarSign, List, Send, Terminal, User, Users } from 'lucide-react';
import { AgentManagementView } from './components/agents/AgentManagementView';
import { MemoryView } from './components/memory/MemoryView';
import { KnowledgeView } from './components/knowledge/KnowledgeView';
import { TimelineView } from './components/Timeline/TimelineView';
import { ModelCenterView } from './components/model-center/ModelCenterView';
import { CostsView } from './components/costs/CostsView';
import { PlansView } from './components/plans/PlansView';
import { useWs } from './contexts/WsContext';
import { useI18n, useTooltipText } from './contexts/I18nContext';
import { createGatewayTask, pollGatewayTask, submitTaskFeedback } from './lib/gateway';
import { listAgents } from './lib/agents';
import type { AgentSummary } from './lib/agents';

interface AvailableModel {
  id: string;
  externalModelId: string;
  displayName: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  agentName?: string;
  conformance?: number;
  taskId?: string;
  feedbackState?: 'idle' | 'submitting' | 'submitted';
  feedbackRating?: 1 | -1;
  feedbackError?: string;
}

type ActiveTab = 'console' | 'timeline' | 'model-center' | 'agents' | 'memory' | 'knowledge' | 'costs' | 'plans';

function App() {
  const { isConnected, session, activeTask } = useWs();
  const { locale, setLocale } = useI18n();
  const tooltip = useTooltipText();
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<ActiveTab>('console');
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState(() => localStorage.getItem('andromeda_selected_agent') || '');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [consoleError, setConsoleError] = useState('');

  const selectedAgent = useMemo(
    () => agents.find((agent) => agent.id === selectedAgentId) || null,
    [agents, selectedAgentId],
  );

  const loadAvailableModels = async () => {
    try {
      let response = await fetch('/model-center/models');
      let data = await response.json() as AvailableModel[];

      if (data.length === 0) {
        await fetch('/model-center/providers/ollama-local-id/sync', { method: 'POST' }).catch(() => null);
        response = await fetch('/model-center/models');
        data = await response.json() as AvailableModel[];
      }

      setAvailableModels(data);
      setSelectedModel((currentSelectedModel) => {
        if (currentSelectedModel && data.some((model) => model.id === currentSelectedModel)) {
          return currentSelectedModel;
        }
        return data[0]?.id || '';
      });
    } catch (error) {
      console.error('Erro ao carregar modelos do console:', error);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await listAgents();
      setAgents(data);
      setSelectedAgentId((currentSelectedAgent) => {
        if (currentSelectedAgent && data.some((agent) => agent.id === currentSelectedAgent)) {
          return currentSelectedAgent;
        }
        return data[0]?.id || '';
      });
    } catch (error) {
      console.error('Erro ao carregar agentes:', error);
    }
  };

  useEffect(() => {
    void loadAvailableModels();
    const intervalId = window.setInterval(() => {
      void loadAvailableModels();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    void loadAgents();
  }, []);

  useEffect(() => {
    if (selectedAgentId) {
      localStorage.setItem('andromeda_selected_agent', selectedAgentId);
    }
  }, [selectedAgentId]);

  useEffect(() => {
    if (activeTab === 'console') {
      void loadAvailableModels();
      void loadAgents();
    }
  }, [activeTab]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt) return;

    setChatMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: prompt,
        timestamp: new Date().toISOString(),
      },
    ]);
    setInput('');
    setSending(true);
    setConsoleError('');

    try {
      const task = await createGatewayTask({
        channel: 'web',
        session: { id: session?.sessionId },
        content: {
          type: 'text',
          text: prompt,
        },
        metadata: {
          modelId: selectedModel || undefined,
          activityType: selectedModel ? undefined : 'chat.general',
          context: {
            targetAgentId: selectedAgent?.id,
            targetAgentVersion: selectedAgent?.profileVersion,
            targetTeamId: selectedAgent?.teamId,
            personaProfileId: selectedAgent?.id,
            interactionMode: 'chat',
          },
        },
      });

      const taskId = task.task?.id;
      if (!taskId) {
        throw new Error('Gateway nao retornou o identificador da task.');
      }

      const status = await pollGatewayTask(taskId);
      const assistantContent = status.result?.content || status.result?.error || 'Sem resposta do modelo.';
      const feedbackAllowed = Boolean(status.taskId) && !status.result?.error;
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: formatConsoleMessage(assistantContent),
          model: status.result?.model || thisModelLabel(selectedModel, availableModels) || 'automatic-router',
          agentName: status.result?.agent?.name || selectedAgent?.name || 'Andromeda Agent',
          conformance: status.result?.audit?.overallConformanceScore ?? status.auditParecer?.overallConformanceScore,
          timestamp: new Date().toISOString(),
          taskId: feedbackAllowed ? status.taskId : undefined,
          feedbackState: feedbackAllowed ? 'idle' : undefined,
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar mensagem.';
      setConsoleError(message);
      setChatMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: `Erro: ${message}`,
          model: 'gateway',
          agentName: selectedAgent?.name || 'Andromeda Agent',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
      void loadAgents();
    }
  };

  return (
    <div className="h-full bg-slate-950 text-slate-300 font-sans flex overflow-hidden">
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Terminal className="w-6 h-6 text-indigo-400 mr-2" />
          <h1 className="text-xl font-bold tracking-tight text-white">Andromeda OS</h1>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            <li>
              <button onClick={() => setActiveTab('console')} className={navClass(activeTab === 'console')} title={tooltip('app.nav.console')}>
                <Activity className="w-5 h-5 mr-3" />
                Console
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('agents')} className={navClass(activeTab === 'agents')} title={tooltip('app.nav.agents')}>
                <Users className="w-5 h-5 mr-3" />
                Agents
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('timeline')} className={navClass(activeTab === 'timeline')} title={tooltip('app.nav.timeline')}>
                <Clock className="w-5 h-5 mr-3" />
                Timelines
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('model-center')} className={navClass(activeTab === 'model-center')} title={tooltip('app.nav.modelCenter')}>
                <Cpu className="w-5 h-5 mr-3" />
                Model Center
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('memory')} className={navClass(activeTab === 'memory')} title={tooltip('app.nav.memory')}>
                <Database className="w-5 h-5 mr-3" />
                Memory
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('costs')} className={navClass(activeTab === 'costs')} title={tooltip('app.nav.costs')}>
                <DollarSign className="w-5 h-5 mr-3" />
                Costs
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('knowledge')} className={navClass(activeTab === 'knowledge')} title={tooltip('app.nav.knowledge')}>
                <Book className="w-5 h-5 mr-3" />
                Knowledge
              </button>
            </li>
            <li>
              <button onClick={() => setActiveTab('plans')} className={navClass(activeTab === 'plans')} title={tooltip('app.nav.plans')}>
                <List className="w-5 h-5 mr-3" />
                Plans
              </button>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></div>
            {isConnected ? 'Gateway Online' : 'Gateway Offline'}
          </div>
          {selectedAgent && (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Active Agent</div>
              <div className="mt-1 text-sm text-white">{selectedAgent.name}</div>
              <div className="text-xs text-slate-500">{selectedAgent.profileVersion}</div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden min-h-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-md z-10 shrink-0">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">Session:</span>
            <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
              {session ? session.sessionId : 'Wait...'}
            </span>
            {selectedAgent && (
              <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20">
                {selectedAgent.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLocale(locale === 'pt-BR' ? 'en' : 'pt-BR')}
              title={tooltip('app.locale.switch')}
              className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300 transition hover:border-indigo-400 hover:text-white"
            >
              {locale === 'pt-BR' ? 'PT' : 'EN'}
            </button>
            <User className="w-5 h-5 text-slate-500" />
          </div>
        </header>

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {activeTab === 'console' ? (
            <div className="flex-1 overflow-hidden min-h-0">
              <ConsoleView
                selectedAgent={selectedAgent}
                chatMessages={chatMessages}
                setChatMessages={setChatMessages}
                activeTask={activeTask}
              />
            </div>
          ) : activeTab === 'agents' ? (
            <div className="flex-1 overflow-auto">
              <AgentManagementView
                agents={agents}
                selectedAgentId={selectedAgentId}
                sessionId={session?.sessionId}
                onSelectAgent={setSelectedAgentId}
                onUseInConsole={(agentId) => {
                  setSelectedAgentId(agentId);
                  setActiveTab('console');
                }}
                refreshAgents={loadAgents}
              />
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="flex-1 overflow-auto">
              <TimelineView />
            </div>
          ) : activeTab === 'memory' ? (
            <div className="flex-1 overflow-auto">
              <MemoryView sessionId={session?.sessionId} agentId={selectedAgent?.id || undefined} />
            </div>
          ) : activeTab === 'knowledge' ? (
            <div className="flex-1 overflow-auto">
              <KnowledgeView />
            </div>
          ) : activeTab === 'costs' ? (
            <div className="flex-1 overflow-auto">
              <CostsView />
            </div>
          ) : activeTab === 'plans' ? (
            <div className="flex-1 overflow-auto">
              <PlansView sessionId={session?.sessionId} />
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <ModelCenterView />
            </div>
          )}
        </div>

        {activeTab === 'console' && (
          <div className="sticky bottom-0 z-30 p-6 bg-slate-950/90 backdrop-blur border-t border-slate-800/70 shadow-2xl">
            <div className="max-w-3xl mx-auto flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 px-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold">Target Agent:</span>
                <select
                  value={selectedAgentId}
                  onChange={(event) => setSelectedAgentId(event.target.value)}
                  title={tooltip('app.console.targetAgent')}
                  className="bg-slate-900 border border-slate-700 text-indigo-300 text-[10px] px-2 py-0.5 rounded outline-none focus:border-indigo-500 transition-colors"
                >
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                  ))}
                </select>

                <span className="ml-3 text-[10px] text-slate-500 uppercase font-bold">Target Model:</span>
                <select
                  value={selectedModel}
                  onChange={(event) => setSelectedModel(event.target.value)}
                  title={tooltip('app.console.targetModel')}
                  className="bg-slate-900 border border-slate-700 text-indigo-400 text-[10px] px-2 py-0.5 rounded outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="" title={tooltip('app.console.targetModel.automatic')}>Automatic (Router)</option>
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>{model.displayName || model.externalModelId}</option>
                  ))}
                </select>
              </div>

              {consoleError && (
                <div className="px-3 py-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg">
                  {consoleError}
                </div>
              )}

              <form onSubmit={handleSend} className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-lg blur opacity-10 group-hover:opacity-30 transition duration-500"></div>
                <div className="relative flex items-center bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <input
                    type="text"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    title={tooltip('app.console.input')}
                    placeholder={selectedAgent ? `Talk to ${selectedAgent.name}...` : 'Initialize sequence or type a command...'}
                    className="flex-1 bg-transparent py-4 px-6 text-white outline-none placeholder-slate-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    title={tooltip('app.console.send')}
                    className="p-4 mr-2 text-indigo-400 hover:text-white disabled:opacity-50 transition-colors bg-slate-800 hover:bg-indigo-600 rounded-md my-2"
                    aria-label="Send"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ConsoleView({ selectedAgent, chatMessages, setChatMessages, activeTask }: { selectedAgent: AgentSummary | null; chatMessages: ChatMessage[]; setChatMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>; activeTask: any }) {
  const [isExecutionPanelOpen, setIsExecutionPanelOpen] = useState(false);
  const tooltip = useTooltipText();

  async function handleFeedback(taskId: string, rating: 1 | -1) {
    setChatMessages((previous) => previous.map((message) => (
      message.taskId === taskId
        ? { ...message, feedbackState: 'submitting', feedbackError: '' }
        : message
    )));

    try {
      await submitTaskFeedback(taskId, { rating });
      setChatMessages((previous) => previous.map((message) => (
        message.taskId === taskId
          ? { ...message, feedbackState: 'submitted', feedbackRating: rating, feedbackError: '' }
          : message
      )));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao enviar feedback.';
      setChatMessages((previous) => previous.map((item) => (
        item.taskId === taskId
          ? { ...item, feedbackState: 'idle', feedbackError: message }
          : item
      )));
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-6 h-full min-h-0">
      <div className="text-center py-4">
        <h2 className="text-2xl font-light text-slate-200">Andromeda Command Console</h2>
        <p className="text-sm text-slate-500 mt-1">
          {selectedAgent ? `Live chat with ${selectedAgent.name}` : 'Chat direto com modelos locais e roteador inteligente'}
        </p>
      </div>

      <div className="space-y-4 mb-8 flex-1 min-h-0 overflow-y-auto pr-1">
        {chatMessages.map((message, index) => (
          <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl shadow-lg ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
              {message.role === 'assistant' && (
                <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest text-indigo-300 font-bold">
                  <span className="inline-flex items-center gap-1">
                    <Cpu className="w-3 h-3" />
                    {message.agentName || 'Andromeda AI'}
                  </span>
                  <span className="text-slate-500">{message.model || 'automatic-router'}</span>
                  {message.conformance !== undefined && (
                    <span className="rounded-full border border-indigo-400/30 px-2 py-0.5 text-indigo-200">
                      Conformance {message.conformance}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.role === 'assistant' && message.taskId && (
                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-700/60 pt-3">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Feedback</span>
                  <button
                    type="button"
                    disabled={message.feedbackState === 'submitting' || message.feedbackState === 'submitted'}
                    onClick={() => void handleFeedback(message.taskId as string, 1)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${message.feedbackRating === 1 ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200' : 'border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    👍
                  </button>
                  <button
                    type="button"
                    disabled={message.feedbackState === 'submitting' || message.feedbackState === 'submitted'}
                    onClick={() => void handleFeedback(message.taskId as string, -1)}
                    className={`rounded-full border px-3 py-1 text-xs transition ${message.feedbackRating === -1 ? 'border-rose-400 bg-rose-500/15 text-rose-200' : 'border-slate-600 text-slate-300 hover:border-rose-400 hover:text-white'} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    👎
                  </button>
                  {message.feedbackState === 'submitting' && (
                    <span className="text-xs text-slate-400">Enviando feedback...</span>
                  )}
                  {message.feedbackState === 'submitted' && (
                    <span className="text-xs text-emerald-300">Feedback registrado.</span>
                  )}
                  {message.feedbackError && (
                    <span className="text-xs text-rose-300">{message.feedbackError}</span>
                  )}
                </div>
              )}
              <div className="text-[10px] text-slate-500 mt-2 text-right">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        {activeTask && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setIsExecutionPanelOpen((current) => !current)}
              title={tooltip('app.console.executionToggle')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-200 hover:border-indigo-400 hover:text-white transition"
            >
              <Activity className="w-3.5 h-3.5" />
              {isExecutionPanelOpen ? 'Ocultar status da execucao' : 'Mostrar status da execucao'}
            </button>

            {isExecutionPanelOpen && (
              <div className="mt-3 bg-slate-900/85 border border-slate-800/70 p-6 rounded-2xl shadow-2xl backdrop-blur-md space-y-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-lg font-medium text-white">Execution Status</h3>
                  <span className="ml-auto text-xs font-mono bg-indigo-500/10 text-indigo-200 px-2 py-1 rounded-full border border-indigo-500/30 font-bold tracking-wide">
                    {activeTask.status || activeTask.task?.status || 'UNKNOWN'}
                  </span>
                </div>
                <div className="font-mono text-xs text-slate-300 bg-black/40 p-3 rounded-xl overflow-auto border border-white/5 max-h-[320px]">
                  <pre>{JSON.stringify(activeTask, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function navClass(active: boolean) {
  return `w-full flex items-center px-6 py-2 transition-colors ${active ? 'bg-indigo-500/10 text-indigo-400 border-r-2 border-indigo-400' : 'hover:bg-slate-800/50 text-slate-400'}`;
}

function thisModelLabel(selectedModel: string, models: AvailableModel[]): string | undefined {
  return models.find((model) => model.id === selectedModel)?.displayName;
}

function formatConsoleMessage(message: string): string {
  if (/budget exceeded/i.test(message)) {
    return 'Budget do agente excedido. Ajuste o limite configurado ou escolha outro agente antes de tentar novamente.';
  }

  return message;
}

export default App;
