import React, { useEffect, useState } from 'react';
import { Activity, MessageSquare, Code, Play, CheckCircle, XCircle } from 'lucide-react';
import { useWs } from '../../contexts/WsContext';
import { useTooltipText } from '../../contexts/I18nContext';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  type: 'message' | 'task_created' | 'task_status' | 'task_result';
  summary: string;
  details?: any;
}

export const TimelineView: React.FC = () => {
  const { session, activeTask } = useWs();
  const tooltip = useTooltipText();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.sessionId) return;

    const fetchTimeline = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/gateway/sessions/${session.sessionId}/timeline`);

        if (!response.ok) {
          setError('Falha ao carregar a timeline da sessão.');
          return;
        }

        const data = await response.json() as { entries?: TimelineEntry[] };
        setTimeline(data.entries || []);
      } catch (err) {
        console.error('Erro ao buscar timeline', err);
        setError('Erro ao buscar a timeline da sessão.');
      } finally {
        setLoading(false);
      }
    };

    void fetchTimeline();

    const interval = window.setInterval(() => {
      void fetchTimeline();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [session?.sessionId, activeTask?.taskId, activeTask?.status]);

  if (!session) {
    return <div className="text-slate-500 text-center p-8">Aguardando sessao...</div>;
  }

  const getIconForType = (type: string, details?: any) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-400" />;
      case 'task_created':
        return <Play className="w-5 h-5 text-emerald-400" />;
      case 'task_status':
        return <Activity className="w-5 h-5 text-indigo-400" />;
      case 'task_result':
        return details?.success === false
          ? <XCircle className="w-5 h-5 text-red-400" />
          : <CheckCircle className="w-5 h-5 text-emerald-400" />;
      default:
        return <Code className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <h3 className="text-xl font-medium text-slate-200 mb-6 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-indigo-400" />
        Historico Operacional (Timeline)
        {loading && <span className="ml-4 w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></span>}
      </h3>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
        {timeline.map((entry, index) => {
          const expanded = expandedEntryId === entry.id;
          return (
            <div key={entry.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors duration-500">
                {getIconForType(entry.type, entry.details)}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/50 backdrop-blur-md p-4 rounded-xl border border-slate-700/50 shadow-xl transition-transform duration-500 hover:-translate-y-1">
                <div className="flex items-center justify-between space-x-2 mb-1">
                  <div className="font-bold text-slate-200 capitalize">{entry.type.replace('_', ' ')}</div>
                  <time className="text-xs font-mono text-indigo-400">{new Date(entry.timestamp).toLocaleTimeString()}</time>
                </div>
                <div className="text-sm text-slate-400">{entry.summary}</div>

                {entry.details && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedEntryId(expanded ? null : entry.id)}
                      title={tooltip('timeline.toggleDetails')}
                      className="text-xs rounded border border-slate-700 px-2 py-1 text-slate-300 hover:border-indigo-400"
                    >
                      {expanded ? 'Recolher detalhes' : 'Mostrar detalhes'}
                    </button>

                    {expanded && (
                      <div className="mt-3 text-xs font-mono bg-black/30 p-2 rounded text-slate-500 overflow-x-auto">
                        <pre>{JSON.stringify(entry.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {timeline.length === 0 && !loading && !error && (
        <div className="text-center text-slate-500 mt-10">Nenhum evento registrado nesta sessao.</div>
      )}
    </div>
  );
};

const Clock = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
