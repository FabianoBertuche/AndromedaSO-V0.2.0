import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { postTaskFeedback } from '../api/kernel';

type FeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  defaultTaskId?: string;
  defaultAgentId?: string;
  capability?: string;
};

export function FeedbackModal({
  open,
  onClose,
  defaultTaskId = '',
  defaultAgentId = '',
  capability = 'planning'
}: FeedbackModalProps) {
  const queryClient = useQueryClient();
  const [taskId, setTaskId] = useState(defaultTaskId);
  const [agentId, setAgentId] = useState(defaultAgentId);
  const [capabilityInput, setCapabilityInput] = useState(capability);
  const [thumbs, setThumbs] = useState<boolean>(true);
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: postTaskFeedback,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      await queryClient.invalidateQueries({ queryKey: ['cost-dashboard'] });
      onClose();
      setNote('');
    }
  });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/20 bg-white/10 p-6 shadow-glow backdrop-blur-xl transition-all">
        <h3 className="font-display text-2xl text-white">Task Feedback</h3>
        <p className="mt-1 text-sm text-slate-200">POST /tasks/:id/feedback</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            value={taskId}
            onChange={(event) => setTaskId(event.target.value)}
            className="rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-sm text-slate-100"
            placeholder="taskId"
          />
          <input
            value={agentId}
            onChange={(event) => setAgentId(event.target.value)}
            className="rounded-xl border border-white/20 bg-slate-900/50 px-4 py-3 text-sm text-slate-100"
            placeholder="agentId"
          />
          <input
            value={capabilityInput}
            onChange={(event) => setCapabilityInput(event.target.value)}
            className="rounded-xl border border-white/20 bg-slate-900/50 px-4 py-3 text-sm text-slate-100 sm:col-span-2"
            placeholder="capability"
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={() => setThumbs(true)}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-105',
              thumbs ? 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/60' : 'bg-white/10 text-slate-200'
            ].join(' ')}
          >
            👍 Thumbs Up
          </button>
          <button
            type="button"
            onClick={() => setThumbs(false)}
            className={[
              'rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:scale-105',
              !thumbs ? 'bg-rose-500/30 text-rose-300 ring-1 ring-rose-400/60' : 'bg-white/10 text-slate-200'
            ].join(' ')}
          >
            👎 Thumbs Down
          </button>
        </div>

        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-4 h-28 w-full rounded-xl border border-white/20 bg-slate-900/50 px-4 py-3 text-sm text-slate-100"
          placeholder="Observacao da task"
        />

        {mutation.isError ? <p className="mt-2 text-sm text-ember">{(mutation.error as Error).message}</p> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition-all hover:scale-105"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={mutation.isPending || !taskId || !agentId || !capabilityInput}
            onClick={() => mutation.mutate({ taskId, agentId, capability: capabilityInput, thumbs, note })}
            className="rounded-xl bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 px-4 py-2 text-sm font-semibold text-slate-950 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {mutation.isPending ? 'Enviando...' : 'Enviar Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
