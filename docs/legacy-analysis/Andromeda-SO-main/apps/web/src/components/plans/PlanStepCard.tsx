import React from "react";
import { useTooltipText } from "../../contexts/I18nContext";

export type PlanStepStatus = "pending" | "waiting_dependency" | "waiting_approval" | "running" | "completed" | "failed" | "rolled_back";

export interface PlanStep {
    id: string;
    stepIndex: number;
    title: string;
    description?: string;
    agentId: string;
    status: PlanStepStatus;
    canRunParallel: boolean;
    requiresApproval: boolean;
    dependsOn: string[];
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
}

const STATUS_CONFIG: Record<PlanStepStatus, { label: string; color: string; bgColor: string; borderColor: string; icon: string }> = {
    pending: { label: "Pendente", color: "text-slate-400", bgColor: "bg-slate-800", borderColor: "border-slate-700", icon: "⏳" },
    waiting_dependency: { label: "Aguardando", color: "text-slate-400", bgColor: "bg-slate-800", borderColor: "border-slate-700", icon: "⏳" },
    waiting_approval: { label: "Aguardando Aprovação", color: "text-amber-300", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30", icon: "🔒" },
    running: { label: "Executando", color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", icon: "⟳" },
    completed: { label: "Concluído", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30", icon: "✓" },
    failed: { label: "Falhou", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30", icon: "✗" },
    rolled_back: { label: "Revertido", color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30", icon: "↩" },
};

interface PlanStepCardProps {
    step: PlanStep;
    onApprove?: (stepId: string) => void;
    isApprovalLoading?: boolean;
}

export const PlanStepCard: React.FC<PlanStepCardProps> = ({ step, onApprove, isApprovalLoading }) => {
    const tooltip = useTooltipText();
    const config = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
    const isApprovalStep = step.status === "waiting_approval" && step.requiresApproval;

    return (
        <div className={`rounded-xl border ${config.borderColor} ${config.bgColor} p-4 transition-all`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{config.icon}</span>
                    <div>
                        <div className="text-xs font-mono text-slate-500">Step {step.stepIndex}</div>
                        <div className="font-medium text-white">{step.title}</div>
                    </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${config.color} ${config.borderColor} ${config.bgColor}`}>
                    {config.label}
                </span>
            </div>

            {step.description && (
                <p className="mt-2 text-sm text-slate-400">{step.description}</p>
            )}

            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                <span>Agent: <span className="text-indigo-300 font-mono">{step.agentId}</span></span>
                {step.canRunParallel && <span className="text-cyan-400" title={tooltip('plans.step.parallel')}>∥ Paralelo</span>}
                {step.dependsOn.length > 0 && <span title={tooltip('plans.step.dependencies')}>Depende de: {step.dependsOn.length} step(s)</span>}
            </div>

            {step.startedAt && (
                <div className="mt-2 text-xs text-slate-600">
                    Iniciado: {new Date(step.startedAt).toLocaleString("pt-BR")}
                </div>
            )}

            {step.completedAt && step.status === "completed" && (
                <div className="mt-2 text-xs text-emerald-500">
                    Concluído: {new Date(step.completedAt).toLocaleString("pt-BR")}
                </div>
            )}

            {step.errorMessage && (
                <div className="mt-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
                    {step.errorMessage}
                </div>
            )}

            {isApprovalStep && onApprove && (
                <button
                    type="button"
                    disabled={isApprovalLoading}
                    onClick={() => onApprove(step.id)}
                    title={tooltip('plans.step.approve')}
                    className="mt-3 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20 transition disabled:opacity-50"
                >
                    {isApprovalLoading ? "Aprovando..." : "Aprovar Step"}
                </button>
            )}
        </div>
    );
};