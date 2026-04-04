interface DeleteConfirmationDialogProps {
  providerName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

export function DeleteConfirmationDialog({
  providerName,
  onConfirm,
  onCancel,
  isDeleting
}: DeleteConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-xl border border-red-500/40 bg-slate-900 p-6 shadow-xl">
        <p className="font-mono text-white">
          Deletar provider <span className="text-red-400">"{providerName}"</span>?
        </p>
        <p className="mt-1 font-mono text-sm text-slate-400">
          Esta ação removerá o provider e todos os modelos do catálogo associados.
        </p>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded border border-slate-500/50 px-4 py-1 font-mono text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded border border-red-500/50 bg-red-500/20 px-4 py-1 font-mono text-sm text-red-300 disabled:opacity-50"
          >
            {isDeleting ? 'Deletando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
