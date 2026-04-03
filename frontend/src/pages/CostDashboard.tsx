import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { fetchCostDashboard } from '../api/kernel';

export function CostDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cost-dashboard'],
    queryFn: fetchCostDashboard,
    refetchInterval: 5000,
    staleTime: 2000
  });

  const chartData = useMemo(() => {
    if (!data) {
      return [] as Array<Record<string, string | number>>;
    }

    const grouped = new Map<string, Record<string, string | number>>();
    for (const point of data.trend) {
      const row = grouped.get(point.month) ?? { month: point.month };
      row[point.agentId] = point.spent;
      grouped.set(point.month, row);
    }

    return [...grouped.values()];
  }, [data]);

  function exportCsv() {
    if (!data) {
      return;
    }

    const rows = [
      'agentId,spentDaily,spentMonthly,remainingDaily,remainingMonthly',
      ...data.agents.map((agent) => [
        agent.agentId,
        agent.spentDaily,
        agent.spentMonthly,
        agent.remainingDaily,
        agent.remainingMonthly
      ].join(','))
    ];

    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'data.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="h-full w-full rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl transition-all">
      <header className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-display text-xl text-white">Cost Dashboard</h3>
          <p className="mt-1 text-sm text-slate-300">GET /dashboard/costs</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:scale-105"
        >
          Export CSV
        </button>
      </header>

      {error ? <p className="mb-3 text-sm text-rose-300">Erro no dashboard: {(error as Error).message}</p> : null}

      <div className="h-72 w-full rounded-xl border border-white/20 bg-slate-950/35 p-3">
        {isLoading || !data ? (
          <p className="text-sm text-slate-300">Carregando grafico...</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 18, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{ background: '#0b1220', border: '1px solid #334155', borderRadius: 12 }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Legend />
              {[...new Set(data.trend.map((t) => t.agentId))].map((agentId, index) => {
                const palette = ['#00e5ff', '#8bffb0', '#ff9d4d', '#f472b6', '#38bdf8'];
                return (
                  <Area
                    key={agentId}
                    type="monotone"
                    dataKey={agentId}
                    stroke={palette[index % palette.length]}
                    fill={palette[index % palette.length]}
                    fillOpacity={0.25}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-white/20">
        <table className="min-w-full divide-y divide-white/10 text-left text-sm">
          <thead className="bg-slate-950/40 text-slate-200">
            <tr>
              <th className="px-4 py-3 font-medium">agent</th>
              <th className="px-4 py-3 font-medium">spent (day)</th>
              <th className="px-4 py-3 font-medium">remaining (day)</th>
              <th className="px-4 py-3 font-medium">spent (month)</th>
              <th className="px-4 py-3 font-medium">remaining (month)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-slate-950/20 text-slate-100">
            {data?.agents.map((agent) => (
              <tr key={agent.agentId} className="transition-all hover:scale-[1.01] hover:bg-indigo-500/20">
                <td className="px-4 py-3 font-medium text-cyan-300">{agent.agentId}</td>
                <td className="px-4 py-3">{agent.spentDaily}</td>
                <td className="px-4 py-3">{agent.remainingDaily}</td>
                <td className="px-4 py-3">{agent.spentMonthly}</td>
                <td className="px-4 py-3">{agent.remainingMonthly}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
