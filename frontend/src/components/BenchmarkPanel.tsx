import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBenchmark, useProviders } from '../hooks/useProviders';
import type { BenchmarkResultRow } from '../hooks/useProviders';
import { getProviderCatalog, listProviders } from '../api/kernel';
import { ModelSelector } from './ModelSelector';
import { SimulatedBadge } from './SimulatedBadge';
import { ToastNotification } from './ToastNotification';

interface FlatCatalogModel {
  modelId: string;
  displayName: string;
  providerId: string;
  providerName: string;
}

export function BenchmarkPanel() {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [taskType, setTaskType] = useState<'coding' | 'chat'>('coding');
  const [results, setResults] = useState<BenchmarkResultRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: providersData } = useProviders();

  const { data: allModels = [] } = useQuery<FlatCatalogModel[]>({
    queryKey: ['all-catalogs'],
    queryFn: async () => {
      const { providers } = await listProviders();
      const catalogs = await Promise.all(
        providers.map((p) => getProviderCatalog(p.id).then((c) => ({ provider: p, catalog: c })))
      );
      return catalogs.flatMap(({ provider, catalog }) =>
        catalog.models.map((m) => ({
          modelId: m.modelId,
          displayName: m.displayName,
          providerId: provider.id,
          providerName: provider.name
        }))
      );
    },
    enabled: Boolean(providersData?.providers?.length)
  });

  const { run, isPending } = useBenchmark();

  async function handleRun() {
    if (!selectedModelId) return;
    setError(null);
    try {
      const result = await run(selectedModelId, taskType);
      setResults((prev) => [result, ...prev].slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao executar benchmark.');
    }
  }

  return (
    <div className="flex flex-col gap-4 font-mono">
      <div className="flex flex-wrap items-end gap-3">
        <ModelSelector
          models={allModels}
          value={selectedModelId}
          onChange={setSelectedModelId}
        />

        <select
          value={taskType}
          onChange={(e) => setTaskType(e.target.value as 'coding' | 'chat')}
          className="rounded bg-slate-900/80 p-2 font-mono text-cyan-100"
        >
          <option value="coding">Coding</option>
          <option value="chat">Chat</option>
        </select>

        <button
          onClick={() => void handleRun()}
          disabled={!selectedModelId || isPending}
          className="rounded border border-cyan-500/60 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? (
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
              Executando...
            </span>
          ) : (
            'Executar Benchmark'
          )}
        </button>
      </div>

      {results.length > 0 && (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-slate-400">
              <th className="pb-2 pr-4">Modelo</th>
              <th className="pb-2 pr-4">Tipo</th>
              <th className="pb-2 pr-4">Score</th>
              <th className="pb-2 pr-4">Latência</th>
              <th className="pb-2">Simulado</th>
            </tr>
          </thead>
          <tbody>
            {results.map((row, idx) => (
              <tr key={idx} className="border-b border-slate-800 text-slate-200">
                <td className="py-2 pr-4">{row.modelId}</td>
                <td className="py-2 pr-4">{row.taskType}</td>
                <td className="py-2 pr-4">{row.score.toFixed(2)}</td>
                <td className="py-2 pr-4">{row.latencyMs}ms</td>
                <td className="py-2">
                  {row.simulated === true && <SimulatedBadge />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {error !== null && (
        <ToastNotification
          message={error}
          onClose={() => setError(null)}
        />
      )}
    </div>
  );
}
