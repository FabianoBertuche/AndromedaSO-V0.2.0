import { useEffect, useState } from 'react';
import { LLMTestbed } from '../components/LLMTestbed';
import { benchmarkModel, inferRouting, listProviders, listRoutingDecisions } from '../api/kernel';
import type { ModelBenchmark, Provider } from '../types/model';

export function RouterIntelligence() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [benchmarks, setBenchmarks] = useState<ModelBenchmark[]>([]);
  const [decisions, setDecisions] = useState<Array<{ taskType: string; selectedModel: string; score: number }>>([]);

  const refresh = async () => {
    const providerPayload = await listProviders();
    setProviders(providerPayload.providers);

    const decisionPayload = await listRoutingDecisions();
    setDecisions(decisionPayload.decisions.slice(0, 5));
  };

  useEffect(() => {
    refresh();
  }, []);

  const runBenchmark = async () => {
    const result = await benchmarkModel('gpt-4o', 'coding');
    setBenchmarks((previous) => [
      {
        modelId: result.result.modelId,
        taskType: result.result.taskType,
        score: result.result.score,
        latencyMs: result.result.latencyMs
      },
      ...previous
    ].slice(0, 10));
  };

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-cyan-400/40 bg-white/10 p-4 backdrop-blur-xl">
        <h2 className="font-mono text-2xl text-cyan-200">Router Intelligence</h2>
        <p className="mt-1 font-mono text-sm text-cyan-100">Coding ranking: GPT-4o 9.4 &gt; Claude 8.8</p>

        <button
          onClick={runBenchmark}
          className="mt-3 rounded border border-cyan-300 bg-cyan-500/20 px-3 py-2 font-mono"
        >
          Run Benchmark Lab
        </button>

        <div className="mt-3 overflow-auto">
          <table className="min-w-full font-mono text-sm">
            <thead>
              <tr className="text-left text-cyan-300">
                <th className="p-2">Model</th>
                <th className="p-2">Task</th>
                <th className="p-2">Score</th>
                <th className="p-2">Latency</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((item, index) => (
                <tr key={`${item.modelId}-${index}`} className="border-t border-cyan-500/20">
                  <td className="p-2">{item.modelId}</td>
                  <td className="p-2">{item.taskType}</td>
                  <td className="p-2">{item.score}</td>
                  <td className="p-2">{item.latencyMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LLMTestbed
        providers={providers}
        onInfer={async (taskType) => {
          const payload = await inferRouting(taskType);
          await refresh();
          return {
            selectedModel: payload.decision.selectedModel,
            score: payload.decision.score
          };
        }}
      />

      <div className="rounded-xl border border-cyan-400/40 bg-white/10 p-4 backdrop-blur-xl">
        <h3 className="font-mono text-lg text-cyan-300">Routing History</h3>
        <ul className="mt-2 space-y-1 font-mono text-sm text-cyan-100">
          {decisions.map((decision, index) => (
            <li key={`${decision.selectedModel}-${index}`}>
              {decision.taskType} -&gt; {decision.selectedModel} ({decision.score})
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
