import React from "react";
import { useTooltipText } from "../../contexts/I18nContext";

interface PlanRollbackModalProps {
    planTitle: string;
    planId: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const PlanRollbackModal: React.FC<PlanRollbackModalProps> = ({
    planTitle,
    onConfirm,
    onCancel,
    isLoading,
}) => {
    const tooltip = useTooltipText();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-orange-500/30 bg-slate-900 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">↩</div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Reverter Plano</h2>
                        <p className="text-sm text-slate-400">Esta ação não pode ser desfeita</p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 mb-4">
                    <div className="text-sm font-medium text-white">{planTitle}</div>
                </div>

                <p className="text-sm text-slate-400 mb-6">
                    Todos os steps completados serão marcados como revertidos. Steps em execução serão cancelados. Continuar?
                </p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onCancel}
                        title={tooltip('plans.modal.rollback.cancel')}
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onConfirm}
                        title={tooltip('plans.modal.rollback.confirm')}
                        className="flex-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-300 hover:bg-orange-500/20 transition disabled:opacity-50"
                    >
                        {isLoading ? "Revertendo..." : "Reverter Plano"}
                    </button>
                </div>
            </div>
        </div>
    );
};