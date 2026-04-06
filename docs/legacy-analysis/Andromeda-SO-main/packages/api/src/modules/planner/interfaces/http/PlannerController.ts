import { Request, Response } from "express";
import { CreateExecutionPlanUseCase } from "../../application/use-cases/CreateExecutionPlanUseCase";
import { ExecutePlanUseCase } from "../../application/use-cases/ExecutePlanUseCase";
import { ApprovePlanStepUseCase } from "../../application/use-cases/ApprovePlanStepUseCase";
import { RollbackPlanUseCase } from "../../application/use-cases/RollbackPlanUseCase";
import { GetPlanUseCase } from "../../application/use-cases/GetPlanUseCase";
import { ListPlansUseCase } from "../../application/use-cases/ListPlansUseCase";
import { MaxStepsExceededError, PlanCreationError, PlanDeadlockError, PlanStepNotFoundError } from "../../domain/errors";
import { sendError } from "../../../../shared/http/error-response";
import { RequestWithContext } from "../../../../shared/http/request-context";

export class PlannerController {
    constructor(
        private readonly createExecutionPlanUseCase: CreateExecutionPlanUseCase,
        private readonly executePlanUseCase: ExecutePlanUseCase,
        private readonly approvePlanStepUseCase: ApprovePlanStepUseCase,
        private readonly rollbackPlanUseCase: RollbackPlanUseCase,
        private readonly getPlanUseCase: GetPlanUseCase,
        private readonly listPlansUseCase: ListPlansUseCase,
    ) { }

    async createPlan(req: RequestWithContext, res: Response) {
        try {
            const taskId = typeof req.body?.taskId === "string" ? req.body.taskId : "";
            const goal = typeof req.body?.goal === "string" ? req.body.goal : "";
            if (!taskId || !goal) {
                return sendError(req as Request, res, 400, "BAD_REQUEST", "taskId and goal are required");
            }

            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const requestedBy = req.user?.id || "system";
            const result = await this.createExecutionPlanUseCase.execute({
                taskId,
                goal,
                tenantId,
                requestedBy,
            });

            return res.status(201).json({
                planId: result.plan.id,
                title: result.plan.title,
                totalSteps: result.plan.totalSteps,
                status: result.plan.status,
                steps: result.steps,
            });
        } catch (error: any) {
            if (error instanceof MaxStepsExceededError) {
                return sendError(req as Request, res, 422, "MAX_STEPS_EXCEEDED", error.message);
            }
            if (error instanceof PlanCreationError) {
                return sendError(req as Request, res, 422, "PLAN_CREATION_ERROR", error.message);
            }
            return sendError(req as Request, res, 500, "INTERNAL_SERVER_ERROR", error.message || "Failed to create execution plan");
        }
    }

    async executePlan(req: RequestWithContext, res: Response) {
        try {
            const planId = req.params?.id;
            if (!planId) {
                return sendError(req as Request, res, 400, "BAD_REQUEST", "plan id is required");
            }

            const tenantId = req.tenantId || req.user?.tenantId || "default";
            await this.executePlanUseCase.execute({ planId, tenantId });

            return res.status(202).json({ planId, status: "running" });
        } catch (error: any) {
            if (error instanceof PlanStepNotFoundError) {
                return sendError(req as Request, res, 404, "NOT_FOUND", error.message);
            }
            if (error instanceof PlanDeadlockError) {
                return sendError(req as Request, res, 422, "PLAN_DEADLOCK", error.message);
            }
            return sendError(req as Request, res, 500, "INTERNAL_SERVER_ERROR", error.message || "Failed to execute plan");
        }
    }

    async approveStep(req: RequestWithContext, res: Response) {
        try {
            const planId = req.params?.id;
            const stepId = req.params?.stepId;
            if (!planId || !stepId) {
                return sendError(req as Request, res, 400, "BAD_REQUEST", "plan id and step id are required");
            }

            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const approvedBy = req.user?.id || "system";
            await this.approvePlanStepUseCase.execute({ planId, stepId, tenantId, approvedBy });

            return res.status(200).json({ planId, stepId, status: "approved" });
        } catch (error: any) {
            return sendError(req as Request, res, 400, "BAD_REQUEST", error.message || "Failed to approve step");
        }
    }

    async rollbackPlan(req: RequestWithContext, res: Response) {
        try {
            const planId = req.params?.id;
            if (!planId) {
                return sendError(req as Request, res, 400, "BAD_REQUEST", "plan id is required");
            }

            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const requestedBy = req.user?.id || "system";
            await this.rollbackPlanUseCase.execute({ planId, tenantId, requestedBy });

            return res.status(200).json({ planId, status: "rolled_back" });
        } catch (error: any) {
            return sendError(req as Request, res, 500, "INTERNAL_SERVER_ERROR", error.message || "Failed to rollback plan");
        }
    }

    async listPlans(req: RequestWithContext, res: Response) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const plans = await this.listPlansUseCase.execute(tenantId);

            return res.status(200).json(plans.map(p => ({
                id: p.id,
                taskId: p.taskId,
                title: p.title,
                description: p.description,
                status: p.status,
                totalSteps: p.totalSteps,
                completedSteps: p.completedSteps,
                failedSteps: p.failedSteps,
                requiresApproval: p.requiresApproval,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            })));
        } catch (error: any) {
            return sendError(req as Request, res, 500, "INTERNAL_SERVER_ERROR", error.message || "Failed to list plans");
        }
    }

    async getPlan(req: RequestWithContext, res: Response) {
        try {
            const planId = req.params?.id;
            if (!planId) {
                return sendError(req as Request, res, 400, "BAD_REQUEST", "plan id is required");
            }

            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const { plan, steps } = await this.getPlanUseCase.execute({ planId, tenantId });

            return res.status(200).json({
                id: plan!.id,
                taskId: plan!.taskId,
                title: plan!.title,
                description: plan!.description,
                status: plan!.status,
                totalSteps: plan!.totalSteps,
                completedSteps: plan!.completedSteps,
                failedSteps: plan!.failedSteps,
                requiresApproval: plan!.requiresApproval,
                createdAt: plan!.createdAt,
                updatedAt: plan!.updatedAt,
                steps: steps.map(s => ({
                    id: s.id,
                    stepIndex: s.stepIndex,
                    title: s.title,
                    description: s.description,
                    agentId: s.agentId,
                    status: s.status,
                    canRunParallel: s.canRunParallel,
                    requiresApproval: s.requiresApproval,
                    dependsOn: s.dependsOn,
                    startedAt: s.startedAt,
                    completedAt: s.completedAt,
                    errorMessage: s.errorMessage,
                })),
            });
        } catch (error: any) {
            return sendError(req as Request, res, 500, "INTERNAL_SERVER_ERROR", error.message || "Failed to get plan");
        }
    }
}
