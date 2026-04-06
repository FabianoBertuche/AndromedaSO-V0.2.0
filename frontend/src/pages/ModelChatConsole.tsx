import { ChatComposer } from '../components/chat/ChatComposer.js';
import { ChatConversation } from '../components/chat/ChatConversation.js';
import { AgentChatSelector } from '../components/chat/AgentChatSelector.js';
import { useAgentChatConsole } from '../hooks/useAgentChatConsole.js';

export function ModelChatConsole() {
  const {
    agentOptions,
    selectedAgentId,
    selectedAgent,
    messages,
    draft,
    isLoadingAgents,
    isSending,
    errorMessage,
    agentsError,
    agentNotices,
    hasConfiguredModel,
    setDraft,
    selectAgent,
    sendMessage,
    clearConversation
  } = useAgentChatConsole();

  console.log('ModelChatConsole render:', { 
    agentOptions, 
    selectedAgentId, 
    isLoadingAgents,
    hasAvailableAgents: agentOptions.length > 0 
  });

  if (isLoadingAgents) {
    return (
      <section className="rounded-[1.75rem] border border-cyan-500/20 bg-slate-950/80 p-6 font-mono text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        Loading agents...
      </section>
    );
  }

  if (agentsError) {
    return (
      <section className="rounded-[1.75rem] border border-red-500/30 bg-red-500/10 p-6 font-mono text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.12)]">
        {agentsError.message || 'Unable to load agents.'}
      </section>
    );
  }

  const hasAvailableAgents = agentOptions.length > 0;
  const selectedModelDisplay = selectedAgent?.preferredModel ?? 'Not configured';

  return (
    <section className="space-y-6 rounded-[2rem] border border-cyan-400/25 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_38%),radial-gradient(circle_at_right,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,0.92))] p-4 shadow-[0_0_60px_rgba(34,211,238,0.08)] md:p-6">
      <header className="space-y-3 font-mono">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Chat Console</p>
        <div className="space-y-2">
          <h2 className="text-3xl text-cyan-50 md:text-4xl">Agent chat workspace</h2>
          <p className="max-w-3xl text-sm leading-6 text-cyan-200/75">
            Pick one active agent, send a prompt, inspect the reply, and reset the local conversation whenever you want.
          </p>
        </div>
      </header>

      {agentNotices.map((notice) => (
        <div
          key={notice}
          className="rounded-[1.5rem] border border-yellow-400/25 bg-yellow-500/10 p-4 font-mono text-sm text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.08)]"
        >
          {notice}
        </div>
      ))}

      {!hasAvailableAgents && (
        <div className="rounded-[1.5rem] border border-yellow-400/25 bg-yellow-500/10 p-4 font-mono text-sm text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.08)]">
          <p className="text-xs uppercase tracking-[0.32em] text-yellow-200/80">Empty state</p>
          <p className="mt-2 leading-6">No active agents available yet. Create and activate an agent before starting a chat.</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-cyan-500/20 bg-slate-950/75 p-4 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.04)]">
            <div className="text-white p-4">TEST: {agentOptions.length} agents available</div>
            <AgentChatSelector
              agents={agentOptions}
              selectedAgentId={selectedAgentId}
              disabled={isSending}
              onSelectAgent={selectAgent}
            />

            {selectedAgent && (
              <div className="mt-4 space-y-2 rounded-2xl border border-cyan-400/20 bg-slate-900/50 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/70">Selected Agent</p>
                <div className="space-y-1 font-mono text-sm text-cyan-100">
                  <p className="font-medium text-cyan-50">{selectedAgent.name}</p>
                  {selectedAgent.description && (
                    <p className="text-xs text-cyan-200/60 line-clamp-2">{selectedAgent.description}</p>
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs uppercase tracking-[0.25em] text-emerald-300/80">Model:</span>
                    <span className={`text-xs ${hasConfiguredModel ? 'text-emerald-100' : 'text-yellow-300'}`}>
                      {selectedModelDisplay}
                    </span>
                  </div>
                  {!hasConfiguredModel && (
                    <p className="text-xs text-yellow-300/80">
                      Warning: This agent does not have a configured model. Chat will not work.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 font-mono text-xs leading-6 text-emerald-100/85">
              <p className="uppercase tracking-[0.32em] text-emerald-300/80">Scope guard</p>
              <p className="mt-2">This screen only lists active agents and sends chat requests using their configured models. No agent management, configuration editing, or chat persistence live here.</p>
            </div>
          </div>

          <ChatComposer
            draft={draft}
            hasSelectedModel={hasConfiguredModel}
            isSending={isSending}
            canClear={messages.length > 0 || Boolean(errorMessage)}
            errorMessage={errorMessage}
            onDraftChange={setDraft}
            onSend={() => {
              void sendMessage();
            }}
            onClear={clearConversation}
          />
        </div>

        <ChatConversation messages={messages} />
      </div>
    </section>
  );
}
