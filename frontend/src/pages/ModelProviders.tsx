import { FormEvent, useEffect, useState } from 'react';
import { createProvider, getProviderHealth, listProviders, syncProviderModels } from '../api/kernel';
import type { Provider } from '../types/model';

function healthBadge(health: string, latencyMs?: number) {
  if (health === 'ok') {
    return `OK ${latencyMs ?? 120}ms`;
  }
  if (health === 'warning') {
    return 'Warning';
  }
  return 'Error';
}

export function ModelProviders() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [name, setName] = useState('openai');
  const [displayName, setDisplayName] = useState('OpenAI');
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const result = await listProviders();
    setProviders(result.providers);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addProvider = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createProvider({ name, displayName });
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const syncModels = async (providerId: string) => {
    await syncProviderModels(providerId);
    await refresh();
  };

  const testHealth = async (providerId: string) => {
    await getProviderHealth(providerId);
    await refresh();
  };

  return (
    <section className="rounded-xl border border-cyan-400/40 bg-white/10 p-4 backdrop-blur-xl">
      <h2 className="font-mono text-2xl text-cyan-200">Model Providers</h2>

      <form onSubmit={addProvider} className="mt-3 grid gap-2 sm:grid-cols-3">
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded bg-slate-900/80 p-2 font-mono" placeholder="name" />
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="rounded bg-slate-900/80 p-2 font-mono" placeholder="display name" />
        <button type="submit" disabled={loading} className="rounded border border-cyan-300 bg-cyan-500/20 p-2 font-mono">
          {loading ? 'Adding...' : 'Add Provider'}
        </button>
      </form>

      <div className="mt-4 overflow-auto">
        <table className="min-w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="text-left text-cyan-300">
              <th className="p-2">Provider</th>
              <th className="p-2">Health</th>
              <th className="p-2">Models</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id} className="border-t border-cyan-500/20">
                <td className="p-2">{provider.displayName}</td>
                <td className="p-2">{healthBadge(provider.health)}</td>
                <td className="p-2">{provider.modelsCount}</td>
                <td className="flex gap-2 p-2">
                  <button className="rounded border border-cyan-500/50 px-2" onClick={() => syncModels(provider.id)}>Sync</button>
                  <button className="rounded border border-cyan-500/50 px-2" onClick={() => testHealth(provider.id)}>Test</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
