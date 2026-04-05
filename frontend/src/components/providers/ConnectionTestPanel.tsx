import type { ConsoleApiError, ProviderConnectionTestResponse } from '../../types/model';

interface ConnectionTestPanelProps {
  result: ProviderConnectionTestResponse | null;
  error: ConsoleApiError | Error | null;
}

export function ConnectionTestPanel({ result, error }: ConnectionTestPanelProps) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4 font-mono text-sm text-cyan-100">
      <h3 className="text-lg font-semibold text-cyan-100">Connection test</h3>
      {!result && !error && <p className="mt-2 text-cyan-300/70">Run a test to validate the current variant payload before saving.</p>}
      {result && (
        <div className="mt-3 rounded border border-emerald-500/30 bg-emerald-500/5 p-3 text-emerald-200">
          <p>{result.health.message}</p>
          <p className="mt-1 text-xs">Validated fields: {result.validatedFields.join(', ') || 'none'}</p>
        </div>
      )}
      {error && (
        <div className="mt-3 rounded border border-red-500/30 bg-red-500/5 p-3 text-red-200">
          <p>{error.message}</p>
        </div>
      )}
    </section>
  );
}
