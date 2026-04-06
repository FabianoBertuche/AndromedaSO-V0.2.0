import { randomUUID } from "node:crypto";
import { buildPlannerPrompt } from "../buildPlannerPrompt";
import { createExecutionPlan, ExecutionPlan } from "../../domain/execution-plan";
import { MaxStepsExceededError, PlanCreationError } from "../../domain/errors";
import { createPlanStep, PlanStep } from "../../domain/plan-step";
import { IAgentRepository, IAuditService, IExecutionPlanRepository, ILlmRouter, IPlanStepRepository, PlannerLlmResponse } from "../../domain/ports";
import { TaskGraph } from "../../domain/task-graph";

const PLANNER_AGENT_ID = "planner-system";

export interface CreateExecutionPlanInput {
    taskId: string;
    goal: string;
    tenantId: string;
    requestedBy: string;
}

export interface CreateExecutionPlanResult {
    plan: ExecutionPlan;
    steps: PlanStep[];
}

export class CreateExecutionPlanUseCase {
    constructor(
        private readonly planRepo: IExecutionPlanRepository,
        private readonly stepRepo: IPlanStepRepository,
        private readonly agentRepo: IAgentRepository,
        private readonly llmRouter: ILlmRouter,
        private readonly auditService: IAuditService,
    ) { }

    async execute(input: CreateExecutionPlanInput): Promise<CreateExecutionPlanResult> {
        const agents = await this.agentRepo.findByTenant(input.tenantId);
        if (agents.length === 0) {
            throw new PlanCreationError("Nenhum agente disponível");
        }

        const raw = await this.llmRouter.complete({
            prompt: buildPlannerPrompt(input.goal, agents),
            capability: "planning",
            tenantId: input.tenantId,
            agentId: PLANNER_AGENT_ID,
        });

        const planData = this.parsePlannerResponse(raw.content);
        const maxSteps = Number(process.env.PLANNER_MAX_STEPS ?? 10);
        if (planData.steps.length > maxSteps) {
            throw new MaxStepsExceededError();
        }

        const plan = await this.planRepo.create(createExecutionPlan({
            id: randomUUID(),
            taskId: input.taskId,
            tenantId: input.tenantId,
            agentId: PLANNER_AGENT_ID,
            title: planData.title,
            description: planData.description,
            requiresApproval: planData.requiresApproval,
            totalSteps: planData.steps.length,
            status: "pending",
            metadata: {
                requestedBy: input.requestedBy,
                goal: input.goal,
            },
        }));

        const steps = await this.stepRepo.createMany(this.buildSteps(plan.id, input.tenantId, planData));
        new TaskGraph(steps).validateNoCycles();

        await this.auditService.log("plan.created", plan.id, input.requestedBy, {
            taskId: input.taskId,
            totalSteps: steps.length,
        });

        return { plan, steps };
    }

    private parsePlannerResponse(content: string): PlannerLlmResponse {
        try {
            const parsed = JSON.parse(content) as PlannerLlmResponse;
            if (!parsed || typeof parsed.title !== "string" || !Array.isArray(parsed.steps)) {
                throw new Error("invalid_shape");
            }
            return parsed;
        } catch {
            throw new PlanCreationError("LLM retornou JSON inválido");
        }
    }

    private buildSteps(planId: string, tenantId: string, planData: PlannerLlmResponse): PlanStep[] {
        const sortedSteps = [...planData.steps].sort((left, right) => left.stepIndex - right.stepIndex);
        const idByStepIndex = new Map<number, string>();

        for (const step of sortedSteps) {
            idByStepIndex.set(step.stepIndex, randomUUID());
        }

        return sortedSteps.map((step) => createPlanStep({
            id: idByStepIndex.get(step.stepIndex)!,
            tenantId,
            planId,
            stepIndex: step.stepIndex,
            title: step.title,
            description: step.description,
            agentId: step.agentId,
            skillId: step.skillId,
            dependsOn: (step.dependsOn || []).map((dependencyRef: string) => this.resolveDependencyId(dependencyRef, idByStepIndex)),
            canRunParallel: step.canRunParallel ?? false,
            requiresApproval: step.requiresApproval ?? false,
            continuationInstructions: step.continuationInstructions,
            expectedOutputFormat: step.expectedOutputFormat,
            maxRetries: step.maxRetries ?? 2,
        }));
    }

    private resolveDependencyId(dependencyRef: string, idByStepIndex: Map<number, string>): string {
        const normalized = String(dependencyRef).trim();
        const match = normalized.match(/(\d+)$/);
        if (!match) {
            throw new PlanCreationError(`Dependência inválida: ${dependencyRef}`);
        }

        const dependencyId = idByStepIndex.get(Number(match[1]));
        if (!dependencyId) {
            throw new PlanCreationError(`Dependência desconhecida: ${dependencyRef}`);
        }

        return dependencyId;
    }
}
