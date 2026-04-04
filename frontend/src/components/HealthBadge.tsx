interface HealthBadgeProps {
  health?: string;
  latencyMs?: number;
}

const colorMap: Record<string, string> = {
  ok: 'text-emerald-400 border-emerald-400/60',
  warning: 'text-yellow-400 border-yellow-400/60',
  error: 'text-red-400 border-red-400/60'
};

export function HealthBadge({ health, latencyMs }: HealthBadgeProps) {
  if (!health) {
    return (
      <span className="rounded border border-slate-400/40 px-2 py-0.5 font-mono text-xs text-slate-400">
        Unknown
      </span>
    );
  }

  const colorClass = colorMap[health] ?? 'text-red-400 border-red-400/60';
  const label = health === 'ok'
    ? `OK${latencyMs !== undefined ? ` ${latencyMs}ms` : ''}`
    : health === 'warning'
      ? `Warning${latencyMs !== undefined ? ` ${latencyMs}ms` : ''}`
      : 'Error';

  return (
    <span className={`rounded border px-2 py-0.5 font-mono text-xs ${colorClass}`}>
      {label}
    </span>
  );
}
