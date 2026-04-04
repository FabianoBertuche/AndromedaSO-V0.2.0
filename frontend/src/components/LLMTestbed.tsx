import { FormEvent, useState } from 'react';

type Props = {
  providers: Array<{ id: string; name: string; displayName?: string }>;
  onInfer: (taskType: 'coding' | 'chat') => Promise<{ selectedModel: string; score: number }>;
};

export function LLMTestbed({ providers, onInfer }: Props) {
  const [providerId, setProviderId] = useState('');
  const [taskType, setTaskType] = useState<'coding' | 'chat'>('chat');
  const [chatInput, setChatInput] = useState('Route this prompt for best model.');
  const [decision, setDecision] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await onInfer(taskType);
      setDecision(`${result.selectedModel} (${result.score}) -> ${chatInput}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-cyan-500/40 bg-white/10 p-4 backdrop-blur-xl">
      <h3 className="font-mono text-lg text-cyan-300">LLM Testbed</h3>
      <form className="mt-3 grid gap-2" onSubmit={handleSubmit}>
        <select
          value={providerId}
          onChange={(event) => setProviderId(event.target.value)}
          className="rounded bg-slate-900/80 p-2 font-mono text-cyan-100"
        >
          <option value="">Select provider</option>
          {providers.map((provider) => (
            <option key={provider.id} value={provider.id}>{provider.displayName || provider.name}</option>
          ))}
        </select>

        <select
          value={taskType}
          onChange={(event) => setTaskType(event.target.value as 'coding' | 'chat')}
          className="rounded bg-slate-900/80 p-2 font-mono text-cyan-100"
        >
          <option value="coding">coding</option>
          <option value="chat">chat</option>
        </select>

        <textarea
          value={chatInput}
          onChange={(event) => setChatInput(event.target.value)}
          className="rounded bg-slate-900/80 p-2 font-mono text-cyan-100"
          rows={3}
        />

        <button
          type="submit"
          disabled={loading}
          className="rounded border border-cyan-400 bg-cyan-500/20 p-2 font-mono text-cyan-100"
        >
          {loading ? 'Routing...' : 'Run Routing Decision'}
        </button>
      </form>

      {decision && (
        <p className="mt-3 font-mono text-sm text-cyan-200">Decision: {decision}</p>
      )}
    </section>
  );
}
