import { useEffect, useState } from 'react';
import { BenchmarkPanel } from '../components/BenchmarkPanel';
import { LLMTestbed } from '../components/LLMTestbed';
import { inferRouting, listProviders, listRouterRankings, listRoutingDecisions } from '../api/kernel';
import type { Provider } from '../types/model';

export function RouterIntelligence() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [decisions, setDecisions] = useState<Array<{ taskType: string; selectedModel: string; score: number }>>([]);
  const [rankings, setRankings] = useState<Array<{ modelId: string; displayName: string; score: number; priceLabel: string; contextWindow: string }>>([]);

  const refresh = async () => {
    const providerPayload = await listProviders();
    setProviders(providerPayload.providers);

    const decisionPayload = await listRoutingDecisions();
    setDecisions(decisionPayload.decisions.slice(0, 5));

    const rankingPayload = await listRouterRankings();
    setRankings(rankingPayload.ranked.slice(0, 10).map((item) => ({
      modelId: item.modelId,
      displayName: item.displayName,
      score: item.score,
      priceLabel: item.priceLabel,
      contextWindow: item.contextWindow
    })));
  };

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section className="grid gap-4">
      <div className="rounded-xl border border-cyan-400/40 bg-white/10 p-4 backdrop-blur-xl">
        <h2 className="font-mono text-2xl text-cyan-200">Router Intelligence</h2>
        <p className="mt-1 font-mono text-sm text-cyan-100">Coding ranking: GPT-4o 9.4 &gt; Claude 8.8</p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {rankings.map((rank) => (
            <article key={rank.modelId} className="rounded border border-cyan-400/40 bg-cyan-500/10 p-3 shadow-[0_0_20px_rgba(0,212,255,0.25)] transition hover:scale-105">
              <p className="font-mono text-sm text-cyan-100">{rank.displayName}</p>
              <p className="font-mono text-xs text-cyan-300">{rank.contextWindow} | {rank.priceLabel}</p>
              <p className="mt-2 font-mono text-lg text-emerald-300">{rank.score}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-cyan-400/40 bg-white/10 p-4 backdrop-blur-xl">
        <h3 className="mb-4 font-mono text-lg text-cyan-200">Benchmark Lab</h3>
        <BenchmarkPanel />
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
