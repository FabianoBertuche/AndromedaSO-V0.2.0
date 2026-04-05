import type { KeyboardEvent } from 'react';

type ChatComposerProps = {
  draft: string;
  hasSelectedModel: boolean;
  isSending: boolean;
  canClear: boolean;
  errorMessage: string | null;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
};

export function ChatComposer({
  draft,
  hasSelectedModel,
  isSending,
  canClear,
  errorMessage,
  onDraftChange,
  onSend,
  onClear
}: ChatComposerProps) {
  const canSend = hasSelectedModel && draft.trim().length > 0 && !isSending;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || !canSend) {
      return;
    }

    event.preventDefault();
    onSend();
  };

  return (
    <div className="rounded-[1.75rem] border border-cyan-500/20 bg-slate-950/80 p-4 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
      <label className="flex flex-col gap-3 font-mono text-sm text-cyan-100">
        <span className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Message</span>
        <textarea
          aria-label="Message"
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          placeholder="Ask the selected model for a fast answer..."
          className="min-h-28 rounded-2xl border border-cyan-400/25 bg-slate-900/85 px-4 py-3 text-sm text-cyan-50 outline-none transition placeholder:text-cyan-300/35 focus:border-emerald-400/60"
        />
      </label>

      {errorMessage && (
        <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-200">
          {errorMessage}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onClear}
          disabled={!canClear || isSending}
          className="rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-cyan-100 transition hover:border-cyan-300/50 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear conversation
        </button>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.3em] text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSending ? 'Sending...' : 'Send message'}
        </button>
      </div>
    </div>
  );
}
