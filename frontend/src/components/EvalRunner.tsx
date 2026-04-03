import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

type EvalRunnerProps = {
  agentIds: string[];
};

type EvalResponse = {
  agentId: string;
  datasetSize: number;
  averageScore: number;
  results: Array<{
    taskId: string;
    score: number;
  }>;
};

async function runEval(agentId: string): Promise<EvalResponse> {
  const response = await fetch('/eval/run', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ agentId })
  });

  if (!response.ok) {
    throw new Error(`Kernel request failed: ${response.status}`);
  }

  return response.json() as Promise<EvalResponse>;
}

export function EvalRunner({ agentIds }: EvalRunnerProps) {
  const [selectedAgent, setSelectedAgent] = useState(agentIds[0] ?? 'smoke');

  const options = useMemo(() => {
    const values = [...new Set(agentIds)];
    return values.length > 0 ? values : ['smoke'];
  }, [agentIds]);

  const mutation = useMutation({
    mutationFn: runEval
  });

  return (
    <section className="h-full w-full rounded-2xl border border-slate-300/70 bg-white/70 p-6 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/50">
      <header className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-slate-900 dark:text-white">Eval Runner</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">POST /eval/run</p>
        </div>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={selectedAgent}
          onChange={(event) => setSelectedAgent(event.target.value)}
          className="w-full rounded-xl border border-slate-400 bg-white/80 px-4 py-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-950/60 dark:text-slate-100"
        >
          {options.map((agentId) => (
            <option key={agentId} value={agentId}>
              {agentId}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => mutation.mutate(selectedAgent)}
          disabled={mutation.isPending}
          className="rounded-xl bg-cyan px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {mutation.isPending ? 'Running...' : 'Run Golden Dataset'}
        </button>
      </div>

      {mutation.isError ? (
        <p className="mt-3 text-sm text-ember">{(mutation.error as Error).message}</p>
      ) : null}

      {mutation.data ? (
        <div className="mt-4 space-y-3">
          <div className="rounded-xl bg-slate-100/80 p-3 text-sm text-slate-700 dark:bg-slate-950/60 dark:text-slate-200">
            Agent: <span className="font-semibold">{mutation.data.agentId}</span> | Dataset: {mutation.data.datasetSize} |
            Avg Score: {mutation.data.averageScore}
          </div>

          <div className="max-h-56 overflow-auto rounded-xl border border-slate-300/70 dark:border-slate-700/70">
            <table className="min-w-full divide-y divide-slate-300 dark:divide-slate-700 text-left text-sm">
              <thead className="bg-slate-100/70 text-slate-700 dark:bg-slate-950/60 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">task</th>
                  <th className="px-4 py-3 font-medium">score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/60 text-slate-800 dark:divide-slate-800 dark:bg-slate-900/40 dark:text-slate-100">
                {mutation.data.results.map((item) => (
                  <tr key={item.taskId}>
                    <td className="px-4 py-2">{item.taskId}</td>
                    <td className="px-4 py-2">{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}
