import type { KernelStatus } from '../api/kernel';

type StatusCardProps = {
  status?: KernelStatus;
  isLoading: boolean;
  error?: Error | null;
};

function StatusPill({ value }: { value: string }) {
  const healthy = value === 'healthy' || value === 'ok';
  return (
    <span
      className={[
        'inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em]',
        healthy
          ? 'bg-aurora/20 text-aurora ring-1 ring-aurora/45'
          : 'bg-ember/20 text-ember ring-1 ring-ember/45'
      ].join(' ')}
    >
      {value}
    </span>
  );
}

export function StatusCard({ status, isLoading, error }: StatusCardProps) {
  return (
    <section className="h-full w-full rounded-2xl border border-cyan/30 bg-white/70 p-6 shadow-glow backdrop-blur-sm dark:bg-slate-900/50">
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-display text-2xl tracking-tight text-slate-900 dark:text-white">Kernel Runtime</h2>
        <StatusPill value={status?.status ?? (isLoading ? 'loading' : 'unknown')} />
      </header>

      {error ? (
        <div className="rounded-xl border border-ember/60 bg-ember/10 p-3 text-sm text-ember">
          Falha ao consultar status: {error.message}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl bg-slate-100/80 p-4 dark:bg-slate-950/60">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Registry Size</p>
          <p className="mt-2 font-display text-3xl text-cyan">{status?.registrySize ?? '--'}</p>
        </article>

        <article className="rounded-xl bg-slate-100/80 p-4 dark:bg-slate-950/60">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Active Modules</p>
          <p className="mt-2 font-display text-3xl text-aurora">{status?.activeModules.length ?? '--'}</p>
        </article>

        <article className="rounded-xl bg-slate-100/80 p-4 dark:bg-slate-950/60">
          <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Retry Storm</p>
          <p className="mt-2 font-display text-3xl text-ember">{status?.metrics.retry_storm_total ?? '--'}</p>
        </article>
      </div>

      <div className="mt-4 rounded-xl bg-slate-100/80 p-4 dark:bg-slate-950/60">
        <p className="text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Active Module IDs</p>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
          {status?.activeModules.length ? status.activeModules.join(', ') : 'Nenhum modulo rodando.'}
        </p>
      </div>
    </section>
  );
}
