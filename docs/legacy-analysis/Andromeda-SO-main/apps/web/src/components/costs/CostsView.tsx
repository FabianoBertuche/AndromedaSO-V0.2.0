import React, { useEffect, useMemo, useState } from 'react';
import { DollarSign, Download, Gauge, Layers3, ReceiptText } from 'lucide-react';
import { exportCostsCsv, getCostsByAgent, getCostsSummary } from '../../lib/costs';
import type { CostsByAgentView, CostsSummaryView } from '../../lib/costs';
import { useTooltipText } from '../../contexts/I18nContext';

export function CostsView() {
  const tooltip = useTooltipText();
  const [summary, setSummary] = useState<CostsSummaryView | null>(null);
  const [byAgent, setByAgent] = useState<CostsByAgentView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const maxCost = useMemo(() => Math.max(...(summary?.series || []).map((item) => item.costUsd), 0), [summary]);

  useEffect(() => {
    void loadCosts();
  }, []);

  async function loadCosts() {
    setLoading(true);
    setError('');
    try {
      const [nextSummary, nextByAgent] = await Promise.all([
        getCostsSummary(),
        getCostsByAgent({ limit: 8 }),
      ]);
      setSummary(nextSummary);
      setByAgent(nextByAgent);
    } catch (nextError) {
      console.error(nextError);
      setError('Nao foi possivel carregar o dashboard de custos.');
    } finally {
      setLoading(false);
    }
  }

  async function handleExport(groupBy: 'agent' | 'day') {
    setExporting(true);
    try {
      const csv = await exportCostsCsv({ groupBy });
      const blob = new Blob([csv.data], { type: csv.contentType });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = csv.fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (nextError) {
      console.error(nextError);
      setError('Falha ao exportar o CSV de custos.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-emerald-300">FinOps</div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Costs Dashboard</h2>
          <p className="mt-2 text-sm text-slate-400">Acompanhe custo, consumo de tokens e exportacao CSV por periodo e por agente.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void handleExport('agent')} disabled={exporting} className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50" title={tooltip('app.costs.exportAgent')}>
            <Download className="mr-2 inline h-4 w-4" />Export by Agent
          </button>
          <button type="button" onClick={() => void handleExport('day')} disabled={exporting} className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 disabled:opacity-50" title={tooltip('app.costs.exportDay')}>
            <Download className="mr-2 inline h-4 w-4" />Export by Day
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<DollarSign className="h-4 w-4" />} label="Total Cost" value={formatCurrency(summary?.totals.costUsd)} />
        <StatCard icon={<Layers3 className="h-4 w-4" />} label="Tokens Used" value={formatInteger(summary?.totals.tokensUsed)} />
        <StatCard icon={<ReceiptText className="h-4 w-4" />} label="Executions" value={formatInteger(summary?.totals.executions)} />
        <StatCard icon={<Gauge className="h-4 w-4" />} label="Avg Cost / Exec" value={formatCurrency(summary?.totals.avgCostPerExecutionUsd)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 text-sm font-semibold text-slate-100">Daily Cost Series</div>
          <div className="space-y-3">
            {(summary?.series || []).map((item: CostsSummaryView['series'][number]) => (
              <div key={item.bucket}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{new Date(item.bucket).toLocaleDateString()}</span>
                  <span>{formatCurrency(item.costUsd)} · {formatInteger(item.executions)} execs</span>
                </div>
                <div className="h-3 rounded-full bg-slate-800">
                  <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${maxCost > 0 ? Math.max(6, (item.costUsd / maxCost) * 100) : 0}%` }} />
                </div>
              </div>
            ))}
            {!loading && (summary?.series || []).length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-500">Nenhuma serie de custo disponivel.</div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 text-sm font-semibold text-slate-100">Top Agents by Spend</div>
          <div className="space-y-3">
            {(byAgent?.items || []).map((item: CostsByAgentView['items'][number], index: number) => (
              <div key={item.agentId} className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm text-white">#{index + 1} {item.agentId}</div>
                    <div className="mt-1 text-xs text-slate-500">{formatInteger(item.executions)} execs · {formatInteger(item.tokensUsed)} tokens</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-emerald-300">{formatCurrency(item.costUsd)}</div>
                    <div className="text-xs text-slate-500">{item.avgLatencyMs ? `${item.avgLatencyMs}ms avg` : 'latency n/a'}</div>
                  </div>
                </div>
              </div>
            ))}
            {!loading && (byAgent?.items || []).length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-sm text-slate-500">Nenhum agente com custo registrado no periodo.</div>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="mb-4 text-sm font-semibold text-slate-100">Cost Breakdown</div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="pb-3">Agent</th>
                <th className="pb-3">Executions</th>
                <th className="pb-3">Tokens</th>
                <th className="pb-3">Avg Latency</th>
                <th className="pb-3 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {(byAgent?.items || []).map((item: CostsByAgentView['items'][number]) => (
                <tr key={item.agentId} className="border-t border-slate-800">
                  <td className="py-3 text-white">{item.agentId}</td>
                  <td className="py-3">{formatInteger(item.executions)}</td>
                  <td className="py-3">{formatInteger(item.tokensUsed)}</td>
                  <td className="py-3">{item.avgLatencyMs ? `${item.avgLatencyMs}ms` : 'n/a'}</td>
                  <td className="py-3 text-right text-emerald-300">{formatCurrency(item.costUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500">{icon}<span>{label}</span></div>
      <div className="mt-4 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function formatCurrency(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  return `$${value.toFixed(2)}`;
}

function formatInteger(value: number | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'n/a';
  return new Intl.NumberFormat('en-US').format(value);
}
