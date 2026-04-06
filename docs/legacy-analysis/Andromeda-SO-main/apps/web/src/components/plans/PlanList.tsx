import React from "react";
import type { ExecutionPlanSummary } from "../../lib/plans";
import { useTooltipText } from "../../contexts/I18nContext";

interface PlanListProps {
    plans: ExecutionPlanSummary[];
    onSelectPlan: (planId: string) => void;
    onExecutePlan: (planId: string) => void;
    isExecutingPlanId?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: "Pendente", color: "text-slate-400", bg: "bg-slate-700" },
    running: { label: "Executando", color: "text-blue-400", bg: "bg-blue-600" },
    completed: { label: "Concluído", color: "text-emerald-400", bg: "bg-emerald-700" },
    failed: { label: "Falhou", color: "text-red-400", bg: "bg-red-700" },
    rolled_back: { label: "Revertido", color: "text-orange-400", bg: "bg-orange-700" },
};

export const PlanList: React.FC<PlanListProps> = ({ plans, onSelectPlan, onExecutePlan, isExecutingPlanId }) => {
    const tooltip = useTooltipText();
    return (
        <div className="space-y-3">
            {plans.length === 0 && (
                <div className="text-center text-slate-500 py-12">
                    Nenhum plano criado ainda.
                </div>
            )}

            {plans.map((plan) => {
                const status = STATUS_CONFIG[plan.status] || STATUS_CONFIG.pending;
                const canExecute = plan.status === "pending";

                return (
                    <div
                        key={plan.id}
                        className="rounded-xl border border-slate-700 bg-slate-900 p-4 hover:border-indigo-500/50 transition-colors"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelectPlan(plan.id)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onSelectPlan(plan.id)} title={tooltip('plans.list.card')}>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.color} ${status.bg}`}>
                                        {status.label}
                                    </span>
                                    {plan.requiresApproval && (
                                        <span className="text-xs text-amber-400">🔒 Requer aprovação</span>
                                    )}
                                </div>
                                <div className="mt-2 text-white font-medium truncate">{plan.title}</div>
                                <div className="mt-1 text-xs text-slate-500">
                                    Task: <span className="font-mono text-indigo-300">{plan.taskId}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-4 text-xs text-slate-500">
                                    <span>{plan.totalSteps} steps</span>
                                    <span className="text-emerald-400">{plan.completedSteps} concluídos</span>
                                    {plan.failedSteps > 0 && <span className="text-red-400">{plan.failedSteps} falharam</span>}
                                </div>
                                <div className="mt-2 text-[10px] text-slate-600">
                                    Criado em {new Date(plan.createdAt).toLocaleString("pt-BR")}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                {canExecute && (
                                    <button
                                        type="button"
                                        disabled={!!isExecutingPlanId}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onExecutePlan(plan.id);
                                        }}
                                        title={tooltip('plans.list.execute')}
                                        className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition disabled:opacity-50"
                                    >
                                        {isExecutingPlanId === plan.id ? "Executando..." : "Executar"}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectPlan(plan.id);
                                    }}
                                    title={tooltip('plans.list.details')}
                                    className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                                >
                                    Ver Detalhes
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};