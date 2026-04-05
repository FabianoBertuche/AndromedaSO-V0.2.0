import { ChatComposer } from '../components/chat/ChatComposer';
import { ChatConversation } from '../components/chat/ChatConversation';
import { ModelChatSelector } from '../components/chat/ModelChatSelector';
import { useModelChatConsole } from '../hooks/useModelChatConsole';

export function ModelChatConsole() {
  const {
    modelOptions,
    selectedModelId,
    messages,
    draft,
    isLoadingModels,
    isSending,
    errorMessage,
    modelsError,
    modelNotices,
    setDraft,
    selectModel,
    sendMessage,
    clearConversation
  } = useModelChatConsole();

  if (isLoadingModels) {
    return (
      <section className="rounded-[1.75rem] border border-cyan-500/20 bg-slate-950/80 p-6 font-mono text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        Loading synced models...
      </section>
    );
  }

  if (modelsError) {
    return (
      <section className="rounded-[1.75rem] border border-red-500/30 bg-red-500/10 p-6 font-mono text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.12)]">
        {modelsError.message || 'Unable to load synced models.'}
      </section>
    );
  }

  const hasAvailableModels = modelOptions.length > 0;

  return (
    <section className="space-y-6 rounded-[2rem] border border-cyan-400/25 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_38%),radial-gradient(circle_at_right,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,0.92))] p-4 shadow-[0_0_60px_rgba(34,211,238,0.08)] md:p-6">
      <header className="space-y-3 font-mono">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Chat Console</p>
        <div className="space-y-2">
          <h2 className="text-3xl text-cyan-50 md:text-4xl">Model chat workspace</h2>
          <p className="max-w-3xl text-sm leading-6 text-cyan-200/75">
            Pick one synced model, send a prompt, inspect the reply, and reset the local conversation whenever you want.
          </p>
        </div>
      </header>

      {modelNotices.map((notice) => (
        <div
          key={notice}
          className="rounded-[1.5rem] border border-yellow-400/25 bg-yellow-500/10 p-4 font-mono text-sm text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.08)]"
        >
          {notice}
        </div>
      ))}

      {!hasAvailableModels && (
        <div className="rounded-[1.5rem] border border-yellow-400/25 bg-yellow-500/10 p-4 font-mono text-sm text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.08)]">
          <p className="text-xs uppercase tracking-[0.32em] text-yellow-200/80">Empty state</p>
          <p className="mt-2 leading-6">No synced models available yet. Add models from existing provider catalogs before starting a chat.</p>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.45fr]">
        <div className="space-y-4">
          <div className="rounded-[1.75rem] border border-cyan-500/20 bg-slate-950/75 p-4 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.04)]">
            <ModelChatSelector
              options={modelOptions}
              selectedModelId={selectedModelId}
              disabled={isSending}
              onSelectModel={selectModel}
            />

            <div className="mt-4 rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-4 py-3 font-mono text-xs leading-6 text-emerald-100/85">
              <p className="uppercase tracking-[0.32em] text-emerald-300/80">Scope guard</p>
              <p className="mt-2">This screen only lists already-synced models and sends chat requests. No provider management, sync controls, benchmarks, router tools, or chat persistence live here.</p>
            </div>
          </div>

          <ChatComposer
            draft={draft}
            hasSelectedModel={Boolean(selectedModelId)}
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
