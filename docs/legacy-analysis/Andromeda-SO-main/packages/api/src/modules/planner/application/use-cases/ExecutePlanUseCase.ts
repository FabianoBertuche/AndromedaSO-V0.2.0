import { IExecutionPlanRepository, IPlanStepRepository, IPlannerQueue, IPlanEventEmitter } from "../../domain/ports";
import { PlanDeadlockError, PlanStepNotFoundError } from "../../domain/errors";
import { TaskGraph } from "../../domain/task-graph";

export interface ExecutePlanInput {
    planId: string;
    tenantId: string;
}

export class ExecutePlanUseCase {
    constructor(
        private readonly planRepo: IExecutionPlanRepository,
        private readonly stepRepo: IPlanStepRepository,
        private readonly queue: IPlannerQueue,
        private readonly eventEmitter: IPlanEventEmitter,
    ) { }

    async execute(input: ExecutePlanInput): Promise<void> {
        const { planId, tenantId } = input;

        const plan = await this.planRepo.findById(planId, tenantId);
        if (!plan) {
            throw new PlanStepNotFoundError(planId);
        }

        await this.planRepo.updateStatus(planId, "running");

        let steps = await this.stepRepo.findByPlanId(planId, tenantId);
        const graph = new TaskGraph(steps);

        this.eventEmitter.emit("plan.started", { planId, tenantId });

        while (true) {
            const ready = graph.getReadySteps();
            if (ready.length === 0) {
                if (graph.isDeadlocked()) {
                    await this.planRepo.updateStatus(planId, "failed");
                    this.eventEmitter.emit("plan.deadlock_detected", { planId });
                    throw new PlanDeadlockError();
                }
                break;
            }

            const [parallel, sequential] = graph.getParallelGroups();
            const maxParallel = Number(process.env.PLANNER_MAX_PARALLEL_STEPS ?? 4);

            const toRunParallel = parallel.slice(0, maxParallel);
            const toRunSequential = [...sequential];

            if (toRunParallel.length > 0) {
                const parallelPromises = toRunParallel.map((step) => this.dispatchStep(step, planId, tenantId));
                await Promise.all(parallelPromises);
            }

            for (const step of toRunSequential) {
                await this.dispatchStep(step, planId, tenantId);
                await this.waitForStep(step.id, planId, tenantId);
            }

            await this.waitForAnyStepCompletion(planId, tenantId);
            steps = await this.stepRepo.findByPlanId(planId, tenantId);
            graph.updateSteps(steps);
        }

        const allDone = steps.every((s) => s.status === "completed");
        const finalStatus = allDone ? "completed" : "failed";
        await this.planRepo.updateStatus(planId, finalStatus);
        this.eventEmitter.emit(allDone ? "plan.completed" : "plan.failed", { planId });
    }

    private async dispatchStep(step: { id: string; requiresApproval?: boolean | null; approvedAt?: Date | null }, planId: string, tenantId: string): Promise<void> {
        if (step.requiresApproval && !step.approvedAt) {
            await this.stepRepo.updateStatus(step.id, "waiting_approval");
            this.eventEmitter.emit("plan.step.approval_required", { planId, stepId: step.id });
            return;
        }

        await this.stepRepo.updateStatus(step.id, "running");
        this.eventEmitter.emit("plan.step.started", { planId, stepId: step.id });
        await this.queue.add("execute-plan-step", { planId, stepId: step.id, tenantId });
    }

    private async waitForAnyStepCompletion(_planId: string, _tenantId: string): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    private async waitForStep(stepId: string, _planId: string, _tenantId: string): Promise<void> {
        let attempts = 0;
        const maxAttempts = 120;
        while (attempts < maxAttempts) {
            const step = await this.stepRepo.findById(stepId);
            if (!step) break;
            if (step.status === "completed" || step.status === "failed") {
                break;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
            attempts++;
        }
    }
}
