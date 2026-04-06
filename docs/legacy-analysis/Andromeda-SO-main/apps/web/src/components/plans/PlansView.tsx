import React, { useCallback, useEffect, useState } from "react";
import { useWs } from "../../contexts/WsContext";
import { listPlans, getPlan, executePlan, approvePlanStep, rollbackPlan } from "../../lib/plans";
import type { ExecutionPlanSummary, PlanDetail } from "../../lib/plans";
import type { PlanStep } from "./PlanStepCard";
import { PlanList } from "./PlanList";
import { PlanStepGraph } from "./PlanStepGraph";
import { PlanStepCard } from "./PlanStepCard";
import { PlanApprovalModal } from "./PlanApprovalModal";
import { PlanRollbackModal } from "./PlanRollbackModal";
import { useTooltipText } from "../../contexts/I18nContext";

interface PlansViewProps {
    sessionId?: string;
}

export const PlansView: React.FC<PlansViewProps> = () => {
    const { socket } = useWs();
    const tooltip = useTooltipText();
    const [plans, setPlans] = useState<ExecutionPlanSummary[]>([]);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<PlanDetail | null>(null);
    const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [approvalModal, setApprovalModal] = useState<{ planId: string; stepId: string; stepTitle: string; stepDescription?: string } | null>(null);
    const [isApprovalLoading, setIsApprovalLoading] = useState(false);
    const [rollbackModal, setRollbackModal] = useState<{ planId: string; planTitle: string } | null>(null);
    const [isRollbackLoading, setIsRollbackLoading] = useState(false);
    const [executingPlanId, setExecutingPlanId] = useState<string | null>(null);

    const loadPlans = useCallback(async () => {
        try {
            const data = await listPlans();
            setPlans(data);
        } catch {
        }
    }, []);

    const loadPlanDetail = useCallback(async (planId: string) => {
        try {
            const data = await getPlan(planId);
            setSelectedPlan(data);
        } catch {
        }
    }, []);

    useEffect(() => {
        void loadPlans();
    }, [loadPlans]);

    useEffect(() => {
        if (!socket) return;

        const handlePlanEvent = (event: string, payload: any) => {
            if (event === "plan.step.approval_required") {
                if (selectedPlanId === payload.planId) {
                    void loadPlanDetail(payload.planId);
                }
                const step = selectedPlan?.steps.find(s => s.id === payload.stepId);
                if (step) {
                    setApprovalModal({
                        planId: payload.planId,
                        stepId: payload.stepId,
                        stepTitle: step.title,
                        stepDescription: step.description,
                    });
                }
            }
            if (event === "plan.step.completed" || event === "plan.step.failed" || event === "plan.step.started") {
                if (selectedPlanId === payload.planId) {
                    void loadPlanDetail(payload.planId);
                }
                void loadPlans();
            }
            if (event === "plan.completed" || event === "plan.failed" || event === "plan.deadlock_detected" || event === "plan.rolled_back") {
                void loadPlans();
                if (selectedPlanId === payload.planId) {
                    void loadPlanDetail(payload.planId);
                }
            }
        };

        socket.on("planner.event", handlePlanEvent);

        return () => {
            socket.off("planner.event", handlePlanEvent);
        };
    }, [socket, selectedPlanId, selectedPlan, loadPlanDetail, loadPlans]);

    const handleSelectPlan = useCallback((planId: string) => {
        setSelectedPlanId(planId);
        void loadPlanDetail(planId);
    }, [loadPlanDetail]);

    const handleExecutePlan = useCallback(async (planId: string) => {
        setExecutingPlanId(planId);
        setError(null);
        try {
            await executePlan(planId);
            void loadPlanDetail(planId);
            void loadPlans();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao executar plano");
        } finally {
            setExecutingPlanId(null);
        }
    }, [loadPlanDetail, loadPlans]);

    const handleApproveStep = useCallback(async (stepId: string) => {
        if (!approvalModal) return;
        setIsApprovalLoading(true);
        try {
            await approvePlanStep(approvalModal.planId, stepId);
            setApprovalModal(null);
            void loadPlanDetail(approvalModal.planId);
            void loadPlans();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao aprovar step");
        } finally {
            setIsApprovalLoading(false);
        }
    }, [approvalModal, loadPlanDetail, loadPlans]);

    const handleRollbackPlan = useCallback(async () => {
        if (!rollbackModal) return;
        setIsRollbackLoading(true);
        try {
            await rollbackPlan(rollbackModal.planId);
            setRollbackModal(null);
            void loadPlanDetail(rollbackModal.planId);
            void loadPlans();
            setSelectedPlanId(null);
            setSelectedPlan(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao reverter plano");
        } finally {
            setIsRollbackLoading(false);
        }
    }, [rollbackModal, loadPlanDetail, loadPlans]);

    const selectedStep = selectedPlan?.steps.find(s => s.id === selectedStepId) ?? null;

    const canRollback = selectedPlan && !["pending", "rolled_back"].includes(selectedPlan.status);

    return (
        <div className="flex flex-col gap-6 h-full min-h-0">
            <div className="text-center py-4">
                <h2 className="text-2xl font-light text-slate-200">Planos de Execução</h2>
                <p className="text-sm text-slate-500 mt-1">Orquestração multi-step com aprovação humana</p>
            </div>

            {error && (
                <div className="mx-6 px-4 py-3 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl">
                    {error}
                    <button onClick={() => setError(null)} className="ml-3 text-xs underline">Dismiss</button>
                </div>
            )}

            <div className="flex-1 flex gap-6 px-6 min-h-0 overflow-hidden">
                <div className="w-80 shrink-0 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-300">Planos</h3>
                        <button
                            onClick={() => void loadPlans()}
                            title={tooltip('plans.refresh')}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                        >
                            ↻
                        </button>
                    </div>
                    <PlanList
                        plans={plans}
                        onSelectPlan={handleSelectPlan}
                        onExecutePlan={handleExecutePlan}
                        isExecutingPlanId={executingPlanId ?? undefined}
                    />
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    {selectedPlan ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-medium text-white">{selectedPlan.title}</h3>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span>Status: <span className="text-indigo-300">{selectedPlan.status}</span></span>
                                        <span>{selectedPlan.totalSteps} steps</span>
                                        <span>{selectedPlan.completedSteps} concluídos</span>
                                        {selectedPlan.failedSteps > 0 && <span className="text-red-400">{selectedPlan.failedSteps} falharam</span>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {canRollback && (
                                        <button
                                            onClick={() => setRollbackModal({ planId: selectedPlan.id, planTitle: selectedPlan.title })}
                                            title={tooltip('plans.detail.rollback')}
                                            className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 transition"
                                        >
                                            ↩ Reverter
                                        </button>
                                    )}
                                    <button
                                        onClick={() => { setSelectedPlanId(null); setSelectedPlan(null); setSelectedStepId(null); }}
                                        title={tooltip('plans.detail.close')}
                                        className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                                    >
                                        ✕ Fechar
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
                                <h4 className="text-sm font-semibold text-slate-300 mb-3">Fluxo dos Steps</h4>
                                <PlanStepGraph
                                    steps={selectedPlan.steps as PlanStep[]}
                                    onSelectStep={setSelectedStepId}
                                    selectedStepId={selectedStepId ?? undefined}
                                />
                            </div>

                            {selectedStep && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-slate-300">Step Selecionado</h4>
                                    <PlanStepCard
                                        step={selectedStep as PlanStep}
                                        onApprove={(stepId) => {
                                            setApprovalModal({
                                                planId: selectedPlan.id,
                                                stepId,
                                                stepTitle: selectedStep.title,
                                                stepDescription: selectedStep.description,
                                            });
                                        }}
                                        isApprovalLoading={isApprovalLoading}
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <div className="text-4xl mb-4">📋</div>
                            <p className="text-sm">Selecione um plano para ver os detalhes</p>
                        </div>
                    )}
                </div>
            </div>

            {approvalModal && (
                <PlanApprovalModal
                    stepTitle={approvalModal.stepTitle}
                    stepDescription={approvalModal.stepDescription}
                    planId={approvalModal.planId}
                    stepId={approvalModal.stepId}
                    onConfirm={() => void handleApproveStep(approvalModal.stepId)}
                    onCancel={() => setApprovalModal(null)}
                    isLoading={isApprovalLoading}
                />
            )}

            {rollbackModal && (
                <PlanRollbackModal
                    planTitle={rollbackModal.planTitle}
                    planId={rollbackModal.planId}
                    onConfirm={() => void handleRollbackPlan()}
                    onCancel={() => setRollbackModal(null)}
                    isLoading={isRollbackLoading}
                />
            )}
        </div>
    );
};