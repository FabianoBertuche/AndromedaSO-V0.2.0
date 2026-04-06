import React from "react";
import type { PlanStep, PlanStepStatus } from "./PlanStepCard";
import { useTooltipText } from "../../contexts/I18nContext";

const STATUS_COLOR: Record<PlanStepStatus, string> = {
    pending: "border-slate-600 bg-slate-800",
    waiting_dependency: "border-slate-600 bg-slate-800",
    waiting_approval: "border-amber-500 bg-amber-500/10",
    running: "border-blue-500 bg-blue-500/10 animate-pulse",
    completed: "border-emerald-500 bg-emerald-500/10",
    failed: "border-red-500 bg-red-500/10",
    rolled_back: "border-orange-500 bg-orange-500/10",
};

interface PlanStepGraphProps {
    steps: PlanStep[];
    onSelectStep?: (stepId: string) => void;
    selectedStepId?: string;
}

export const PlanStepGraph: React.FC<PlanStepGraphProps> = ({ steps, onSelectStep, selectedStepId }) => {
    const tooltip = useTooltipText();
    const sorted = [...steps].sort((a, b) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0));
    const maxIndex = sorted.length;

    return (
        <div className="relative">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {sorted.map((step, i) => {
                    const colorClass = STATUS_COLOR[step.status] || STATUS_COLOR.pending;
                    const isSelected = step.id === selectedStepId;

                    return (
                        <React.Fragment key={step.id}>
                            <div
                                className={`relative shrink-0 w-40 rounded-xl border-2 ${colorClass} p-3 cursor-pointer transition-all hover:scale-105 ${isSelected ? "ring-2 ring-indigo-500" : ""}`}
                                onClick={() => onSelectStep?.(step.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === "Enter" && onSelectStep?.(step.id)}
                                title={tooltip('plans.graph.step')}
                            >
                                <div className="text-[10px] font-mono text-slate-500 mb-1">
                                    {String(step.stepIndex).padStart(2, "0")}
                                </div>
                                <div className="text-sm font-medium text-white leading-tight">
                                    {step.title}
                                </div>
                                <div className="mt-2 text-[10px] text-slate-400 truncate">
                                    {step.agentId}
                                </div>
                                {step.dependsOn.length > 0 && (
                                    <div className="mt-1 text-[10px] text-amber-400">
                                        ↓ {step.dependsOn.length} deps
                                    </div>
                                )}
                            </div>

                            {i < maxIndex - 1 && (
                                <div className="shrink-0 flex items-center">
                                    <svg width="24" height="24" viewBox="0 0 24 24" className="text-slate-600">
                                        <path d="M5 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {sorted.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                    Nenhum step definido neste plano.
                </div>
            )}
        </div>
    );
};