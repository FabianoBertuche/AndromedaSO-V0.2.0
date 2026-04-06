import React from "react";
import { useTooltipText } from "../../contexts/I18nContext";

interface PlanApprovalModalProps {
    stepTitle: string;
    stepDescription?: string;
    planId: string;
    stepId: string;
    onConfirm: () => void;
    onCancel: () => void;
    isLoading?: boolean;
}

export const PlanApprovalModal: React.FC<PlanApprovalModalProps> = ({
    stepTitle,
    stepDescription,
    onConfirm,
    onCancel,
    isLoading,
}) => {
    const tooltip = useTooltipText();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">🔒</div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Aprovação Humana Necessária</h2>
                        <p className="text-sm text-slate-400">Um step do plano aguarda sua aprovação</p>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 mb-4">
                    <div className="text-sm font-medium text-white">{stepTitle}</div>
                    {stepDescription && (
                        <p className="mt-1 text-sm text-slate-400">{stepDescription}</p>
                    )}
                </div>

                <p className="text-sm text-slate-400 mb-6">
                    Este step será executado automaticamente após sua aprovação. Deseja continuar?
                </p>

                <div className="flex gap-3">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onCancel}
                        title={tooltip('plans.modal.approval.cancel')}
                        className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onConfirm}
                        title={tooltip('plans.modal.approval.confirm')}
                        className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
                    >
                        {isLoading ? "Aprovando..." : "Aprovar e Executar"}
                    </button>
                </div>
            </div>
        </div>
    );
};