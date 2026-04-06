import { useEffect, useMemo, useState } from 'react';
import { Database, Pin, RefreshCw } from 'lucide-react';
import {
  deleteMemory,
  getMemory,
  getMemoryLinks,
  getMemoryUsage,
  invalidateMemory,
  listMemory,
  listMemoryPolicies,
  pinMemory,
  type MemoryEntry,
  type MemoryPolicy,
  type MemoryStatus,
  type MemoryType,
} from '../../lib/memory';
import { useTooltipText } from '../../contexts/I18nContext';

interface Props {
  sessionId?: string;
  agentId?: string;
  taskId?: string;
}

export function MemoryView({ sessionId, agentId, taskId }: Props) {
  const tooltip = useTooltipText();
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [policies, setPolicies] = useState<MemoryPolicy[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null);
  const [links, setLinks] = useState<Array<{ id: string; linkedEntityType: string; linkedEntityId: string; relationType: string; createdAt: string }>>([]);
  const [usage, setUsage] = useState<Array<{ id: string; taskId: string; memoryEntryId: string; retrievalReason: string; retrievalScore: number; usedInPromptAssembly: boolean; usedAt: string }>>([]);
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<MemoryType | ''>('');
  const [statusFilter, setStatusFilter] = useState<MemoryStatus | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filters = useMemo(() => ({
    q: searchText.trim() || undefined,
    type: typeFilter || undefined,
    status: statusFilter || undefined,
    agentId,
    sessionId,
    taskId,
    limit: 100,
  }), [agentId, sessionId, taskId, typeFilter, statusFilter, searchText]);

  useEffect(() => {
    void refresh();
    void loadPolicies();
  }, [filters]);

  useEffect(() => {
    if (!selectedId) {
      setSelectedEntry(null);
      setLinks([]);
      setUsage([]);
      return;
    }

    void loadDetails(selectedId);
  }, [selectedId]);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await listMemory(filters);
      setEntries(data);
      if (!selectedId && data[0]) {
        setSelectedId(data[0].id);
      }
      if (selectedId && !data.some((entry) => entry.id === selectedId)) {
        setSelectedId(data[0]?.id || '');
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar memórias.');
    } finally {
      setLoading(false);
    }
  }

  async function loadPolicies() {
    try {
      setPolicies(await listMemoryPolicies());
    } catch {
      setPolicies([]);
    }
  }

  async function loadDetails(id: string) {
    try {
      const [entry, nextLinks, nextUsage] = await Promise.all([
        getMemory(id),
        getMemoryLinks(id),
        getMemoryUsage(id),
      ]);
      setSelectedEntry(entry);
      setLinks(nextLinks);
      setUsage(nextUsage);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao carregar detalhe.');
    }
  }

  async function handleAction(action: () => Promise<unknown>) {
    try {
      await action();
      await refresh();
      if (selectedId) {
        await loadDetails(selectedId);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Falha ao executar ação.');
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-400" />
            Memory Layer v1
          </h2>
          <p className="text-sm text-slate-500">Sessões, episódios e memória semântica persistida e auditável.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            title={tooltip('memory.search')}
            placeholder="Buscar por título, conteúdo, tag ou fonte"
            className="min-w-[280px] rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
          />
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value as MemoryType | '')}
            title={tooltip('memory.typeFilter')}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Todos os tipos</option>
            <option value="session">Session</option>
            <option value="episodic">Episodic</option>
            <option value="semantic">Semantic</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as MemoryStatus | '')}
            title={tooltip('memory.statusFilter')}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200"
          >
            <option value="">Todos os status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="invalidated">Invalidated</option>
            <option value="deleted">Deleted</option>
          </select>
          <button
            onClick={() => void refresh()}
            title={tooltip('memory.refresh')}
            className="inline-flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 hover:border-indigo-400"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <span className="text-sm font-semibold text-slate-200">Memórias</span>
            <span className="text-xs text-slate-500">{entries.length} itens</span>
          </div>

          <div className="max-h-[65vh] overflow-auto">
            {entries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelectedId(entry.id)}
                title={tooltip('memory.entry')}
                className={`w-full text-left border-b border-slate-800 px-4 py-3 transition-colors ${selectedId === entry.id ? 'bg-indigo-500/10' : 'hover:bg-slate-800/50'}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-white">
                      {entry.isPinned && <Pin className="w-3 h-3 text-amber-300" />}
                      <span>{entry.title}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {entry.type} • {entry.scopeType}:{entry.scopeId} • {entry.status} • score {entry.importanceScore}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">{new Date(entry.updatedAt).toLocaleString()}</div>
                </div>
                <p className="mt-2 text-sm text-slate-300 max-h-12 overflow-hidden">{entry.summary || entry.content}</p>
              </button>
            ))}

            {entries.length === 0 && !loading && (
              <div className="p-6 text-sm text-slate-500">Nenhuma memória encontrada com os filtros atuais.</div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Detalhe</h3>
              {selectedEntry && (
                <div className="flex gap-2">
                  <button onClick={() => void handleAction(() => pinMemory(selectedEntry.id))} title={tooltip('memory.pin')} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-amber-400">
                    Pin
                  </button>
                  <button onClick={() => void handleAction(() => invalidateMemory(selectedEntry.id))} title={tooltip('memory.invalidate')} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-red-400">
                    Invalidate
                  </button>
                  <button onClick={() => void handleAction(() => deleteMemory(selectedEntry.id))} title={tooltip('memory.delete')} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-red-400">
                    Delete
                  </button>
                </div>
              )}
            </div>

            {selectedEntry ? (
              <div className="mt-4 space-y-3 text-sm">
                <div className="text-white font-medium">{selectedEntry.title}</div>
                <div className="text-slate-400 whitespace-pre-wrap">{selectedEntry.content}</div>
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <div>Source: {selectedEntry.source}</div>
                  <div>Tags: {(selectedEntry.tags || []).join(', ') || 'none'}</div>
                  <div>Created: {new Date(selectedEntry.createdAt).toLocaleString()}</div>
                  <div>Expires: {selectedEntry.expiresAt ? new Date(selectedEntry.expiresAt).toLocaleString() : 'never'}</div>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">Selecione uma memória para ver o detalhe.</div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Uso e vínculos</h3>
            <div className="text-xs text-slate-500">Links: {links.length} • Usage records: {usage.length}</div>
            <div className="max-h-44 overflow-auto space-y-2 text-xs">
              {links.map((link) => (
                <div key={link.id} className="rounded border border-slate-800 bg-slate-950/50 p-2 text-slate-300">
                  {link.linkedEntityType}:{link.linkedEntityId} — {link.relationType}
                </div>
              ))}
              {usage.map((record) => (
                <div key={record.id} className="rounded border border-slate-800 bg-slate-950/50 p-2 text-slate-300">
                  task {record.taskId} • score {record.retrievalScore} • {record.retrievalReason}
                </div>
              ))}
              {links.length === 0 && usage.length === 0 && (
                <div className="text-slate-500">Sem vínculos ou usos registrados.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-200 mb-2">Policies</h3>
            <div className="space-y-2 text-xs text-slate-400">
              {policies.map((policy) => (
                <div key={policy.id} className="rounded border border-slate-800 bg-slate-950/50 p-2">
                  <div className="font-medium text-slate-200">{policy.memoryType}/{policy.scopeType}</div>
                  <div>retention: {policy.retentionMode} • max: {policy.maxEntries ?? '∞'} • ttl: {policy.ttlDays ?? 'n/a'}</div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {loading && <div className="text-sm text-slate-500">Carregando memórias...</div>}
        </div>
      </div>
    </div>
  );
}
