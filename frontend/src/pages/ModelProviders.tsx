import { FormEvent, useMemo, useState } from 'react';
import {
  useCreateProvider,
  useDeleteProvider,
  useProviderCatalog,
  useProviderHealthCheck,
  useProviderHealthStream,
  useProviderLoadingState,
  useProviders,
  useSaveSelectedModels,
  useSyncProviderModels
} from '../hooks/useProviders';
import { DeleteConfirmationDialog } from '../components/DeleteConfirmationDialog';
import { generateCodeChallenge, generateCodeVerifier } from '../utils/pkce';
import { HealthBadge } from '../components/HealthBadge';
import { ToastNotification } from '../components/ToastNotification';
import type { Provider, ProviderType } from '../types/model';

type AuthMode = 'api-key' | 'oauth' | 'none';

const getAuthMode = (type: ProviderType): AuthMode[] => {
  if (type === 'openai') return ['api-key', 'oauth'];
  if (type === 'ollama' || type === 'lmstudio' || type === 'vllm') return ['none'];
  return ['api-key'];
};

function HealthStreamSubscriber({ providerId }: { providerId: string }) {
  useProviderHealthStream(providerId);
  return null;
}

const PROVIDER_OPTIONS: ProviderType[] = [
  'openai', 'anthropic', 'google', 'xai', 'mistral', 'groq', 'together',
  'fireworks', 'deepinfra', 'novita', 'ollama', 'lmstudio', 'vllm',
  'openrouter', 'hyperbolic', 'replicate', 'aws-bedrock', 'azure-openai',
  'google-vertex', 'cohere'
];

export function ModelProviders() {
  const [search, setSearch] = useState('');
  const [providerType, setProviderType] = useState<ProviderType>('openai');
  const [name, setName] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Provider | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('api-key');

  const providersQuery = useProviders();
  const createProviderMutation = useCreateProvider();
  const deleteProviderMutation = useDeleteProvider();
  const syncProviderMutation = useSyncProviderModels();
  const healthCheckMutation = useProviderHealthCheck();
  const saveSelectedMutation = useSaveSelectedModels();
  const catalogQuery = useProviderCatalog(activeProviderId);
  const { isLoading: isProviderLoading, setLoading: setProviderLoading } = useProviderLoadingState();

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deleteProviderMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const startOAuthFlow = async () => {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const clientId = import.meta.env.VITE_OPENAI_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_OPENAI_REDIRECT_URI;
    if (!clientId || !redirectUri) {
      setSyncError('OAuth configuration missing. Please set VITE_OPENAI_CLIENT_ID and VITE_OPENAI_REDIRECT_URI.');
      return;
    }
    
    // Armazenar o code_verifier para recuperar no callback
    sessionStorage.setItem('oauth_code_verifier', codeVerifier);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid email profile offline_access',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    window.location.href = `https://auth.openai.com/authorize?${params.toString()}`;
  };

  const providers: Provider[] = providersQuery.data?.providers ?? [];
  const models = catalogQuery.data?.models ?? [];
  const loading = createProviderMutation.isPending;

  const filteredProviderOptions = useMemo(
    () => PROVIDER_OPTIONS.filter((option) => option.includes(search.toLowerCase())),
    [search]
  );

  const addProvider = async (event: FormEvent) => {
    event.preventDefault();
    const created = await createProviderMutation.mutateAsync({
      type: providerType,
      name,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined
    });
    setActiveProviderId(created.id);
  };

  const syncModels = async (providerId: string) => {
    setProviderLoading(providerId, true);
    try {
      await syncProviderMutation.mutateAsync(providerId);
      setActiveProviderId(providerId);
      await catalogQuery.refetch();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : 'Falha ao sincronizar modelos.');
    } finally {
      setProviderLoading(providerId, false);
    }
  };

  const testHealth = async (providerId: string) => {
    setProviderLoading(providerId, true);
    try {
      await healthCheckMutation.mutateAsync(providerId);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : 'Falha ao verificar health.');
    } finally {
      setProviderLoading(providerId, false);
    }
  };

  const selectAll = () => setSelectedModelIds(models.map((item) => item.modelId));
  const clearAll = () => setSelectedModelIds([]);

  const toggleModel = (modelId: string) => {
    setSelectedModelIds((prev) =>
      prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [...prev, modelId]
    );
  };

  const saveSelected = async () => {
    if (!activeProviderId) return;
    await saveSelectedMutation.mutateAsync({ providerId: activeProviderId, modelIds: selectedModelIds });
    await providersQuery.refetch();
  };

  return (
    <section className="rounded-xl border border-cyan-400/40 bg-white/10 p-4 backdrop-blur-xl">
      <h2 className="font-mono text-2xl text-cyan-200">Model Providers</h2>

      {providers.map((provider) => (
        <HealthStreamSubscriber key={provider.id} providerId={provider.id} />
      ))}

      <form onSubmit={addProvider} className="mt-3 grid gap-2 sm:grid-cols-5">
        <div className="col-span-2 rounded border border-emerald-500/40 bg-slate-900/80 p-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search provider type"
            className="mb-2 w-full rounded bg-slate-950/70 p-2 font-mono text-emerald-200"
          />
          <select
            value={providerType}
            onChange={(e) => { const v = e.target.value as ProviderType; setProviderType(v); setName(v); setAuthMode(getAuthMode(v)[0]); setApiKey(''); }}
            className="w-full rounded bg-slate-950/70 p-2 font-mono text-emerald-200"
          >
            {filteredProviderOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} className="rounded bg-slate-900/80 p-2 font-mono" placeholder="provider name" />
        {providerType === 'openai' && (
          <div className="flex gap-2">
            <button type="button" className={`rounded border p-2 font-mono text-xs ${authMode === 'api-key' ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-600'}`} onClick={() => setAuthMode('api-key')}>API Key</button>
            <button type="button" className={`rounded border p-2 font-mono text-xs ${authMode === 'oauth' ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-600'}`} onClick={() => setAuthMode('oauth')}>OAuth</button>
          </div>
        )}
        {authMode === 'api-key' && <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="rounded bg-slate-900/80 p-2 font-mono" placeholder="apiKey (optional)" />}
        {providerType === 'openai' && authMode === 'oauth' && (
          <button type="button" onClick={() => void startOAuthFlow()} className="rounded border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 font-mono text-xs text-emerald-300">
            Login com OpenAI
          </button>
        )}
        {authMode !== 'none' && <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="rounded bg-slate-900/80 p-2 font-mono" placeholder="baseUrl (optional)" />}
        <button type="submit" disabled={loading} className="rounded border border-cyan-300 bg-cyan-500/20 p-2 font-mono">
          {loading ? 'Adding...' : 'Add Provider'}
        </button>
      </form>

      <div className="mt-4 overflow-auto">
        <table className="min-w-full border-collapse font-mono text-sm">
          <thead>
            <tr className="text-left text-cyan-300">
              <th className="p-2">Provider</th>
              <th className="p-2">Type</th>
              <th className="p-2">Health</th>
              <th className="p-2">Models</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id} className="border-t border-cyan-500/20">
                <td className="p-2">{provider.name}</td>
                <td className="p-2 text-emerald-300">{provider.type}</td>
                <td className="p-2">
                  <HealthBadge health={provider.health} latencyMs={provider.latencyMs} />
                </td>
                <td className="p-2">{provider.modelsCount}</td>
                <td className="flex gap-2 p-2">
                  <button className="rounded border border-emerald-500/50 px-2" onClick={() => setActiveProviderId(provider.id)}>Catalog</button>
                  <button
                    className="rounded border border-cyan-500/50 px-2 disabled:opacity-50"
                    disabled={isProviderLoading(provider.id)}
                    onClick={() => void syncModels(provider.id)}
                  >
                    {isProviderLoading(provider.id) ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    className="rounded border border-cyan-500/50 px-2 disabled:opacity-50"
                    disabled={isProviderLoading(provider.id)}
                    onClick={() => void testHealth(provider.id)}
                  >
                    {isProviderLoading(provider.id) ? 'Testing...' : 'Test'}
                  </button>
                  <button className="rounded border border-red-500/50 px-2 text-red-300" onClick={() => setDeleteTarget(provider)}>Deletar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-emerald-400/40 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-lg text-emerald-200">Available Models Catalog</h3>
          <div className="flex gap-2">
            <button className="rounded border border-emerald-400/60 px-2 py-1 font-mono text-sm" onClick={selectAll}>All</button>
            <button className="rounded border border-emerald-400/60 px-2 py-1 font-mono text-sm" onClick={clearAll}>None</button>
            <button className="rounded border border-cyan-400/60 px-2 py-1 font-mono text-sm" onClick={() => void saveSelected()}>Save Selected</button>
          </div>
        </div>
        <div className="overflow-auto">
          <table className="min-w-full border-collapse font-mono text-xs">
            <thead>
              <tr className="text-left text-emerald-300">
                <th className="p-2">Select</th>
                <th className="p-2">Model</th>
                <th className="p-2">Context</th>
                <th className="p-2">Capabilities</th>
                <th className="p-2">Price</th>
                <th className="p-2">Score</th>
              </tr>
            </thead>
            <tbody>
              {models.map((item) => (
                <tr key={item.id} className="border-t border-emerald-500/20 hover:bg-cyan-500/5">
                  <td className="p-2">
                    <input type="checkbox" checked={selectedModelIds.includes(item.modelId)} onChange={() => toggleModel(item.modelId)} />
                  </td>
                  <td className="p-2">{item.displayName}</td>
                  <td className="p-2">{item.contextWindow}</td>
                  <td className="p-2">{item.capabilities.join(', ')}</td>
                  <td className="p-2">{item.priceLabel}</td>
                  <td className="p-2 text-cyan-300">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {syncError && <ToastNotification message={syncError} onClose={() => setSyncError(null)} />}
      {healthError && <ToastNotification message={healthError} onClose={() => setHealthError(null)} />}
      {deleteTarget && (
        <DeleteConfirmationDialog
          providerName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
          isDeleting={deleteProviderMutation.isPending}
        />
      )}
    </section>
  );
}
