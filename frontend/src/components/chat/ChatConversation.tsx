import type { ChatMessage } from '../../types/model';

type ChatConversationProps = {
  messages: ChatMessage[];
};

export function ChatConversation({ messages }: ChatConversationProps) {
  if (messages.length === 0) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-[1.75rem] border border-dashed border-cyan-500/25 bg-slate-950/70 p-8 text-center font-mono text-sm text-cyan-300/70">
        Start the conversation with a synced model to see replies appear here.
      </div>
    );
  }

  return (
    <div className="flex min-h-[320px] max-h-[560px] flex-col gap-4 overflow-y-auto rounded-[1.75rem] border border-cyan-500/20 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_45%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,0.88))] p-4 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.06)]">
      {messages.map((message) => {
        const isUser = message.role === 'user';

        return (
          <article
            key={message.id}
            data-testid={`chat-message-${message.role}`}
            className={`max-w-[85%] rounded-[1.5rem] border px-4 py-3 font-mono text-sm shadow-[0_0_24px_rgba(15,23,42,0.45)] ${
              isUser
                ? 'self-end border-emerald-400/40 bg-emerald-500/12 text-emerald-100'
                : 'self-start border-cyan-400/35 bg-cyan-500/10 text-cyan-100'
            }`}
          >
            <p className={`mb-2 text-[10px] uppercase tracking-[0.35em] ${isUser ? 'text-emerald-300/80' : 'text-cyan-300/80'}`}>
              {isUser ? 'Operator' : 'Assistant'}
            </p>
            <p className="whitespace-pre-wrap leading-6">{message.content}</p>
          </article>
        );
      })}
    </div>
  );
}
