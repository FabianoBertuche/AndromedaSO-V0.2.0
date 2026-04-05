import { HealthBadge } from '../HealthBadge';
import type { Provider, ProviderHealthSummary } from '../../types/model';

interface VariantHealthSummaryProps {
  provider: Provider | null;
  healthDetails?: ProviderHealthSummary;
}

export function VariantHealthSummary({ provider, healthDetails }: VariantHealthSummaryProps) {
  const resolvedHealth = healthDetails ?? provider?.healthDetails;
  const badgeHealth = resolvedHealth?.status === 'degraded'
    ? 'warning'
    : resolvedHealth?.status ?? provider?.health;

  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4 font-mono text-sm text-cyan-100">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Health</h3>
        <HealthBadge health={badgeHealth} latencyMs={resolvedHealth?.latencyMs ?? provider?.latencyMs} />
      </div>
      <p className="mt-3 text-cyan-200/80">{resolvedHealth?.message ?? 'Health unavailable.'}</p>
      {resolvedHealth?.checkedAt && (
        <p className="mt-1 text-xs text-cyan-300/60">Checked at {new Date(resolvedHealth.checkedAt).toLocaleString()}</p>
      )}
    </section>
  );
}
