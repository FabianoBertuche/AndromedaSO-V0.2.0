import { Job, Queue, Worker } from "bullmq";
import { randomUUID } from "node:crypto";
import { redisConnection } from "../../../shared/redis";
import { IPlanStepRepository, IAgentHandoffRepository, ITaskExecutionPort } from "../domain/ports";
import { HandoffPayload } from "../domain/handoff-payload";
import { emitPlanEvent } from "./PlannerEventEmitter";
import { PlanStepStatus } from "../domain/plan-step";
import { memoryService } from "../../memory/dependencies";
import { PrismaKnowledgeRepository } from "../../knowledge/infrastructure/persistence/PrismaKnowledgeRepository";
import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { PlannerAuditService } from "./PlannerAuditService";
import { IExecutionPlanRepository } from "../domain/ports";

export interface ExecutePlanStepJobPayload {
    planId: string;
    stepId: string;
    tenantId: string;
}

interface KnowledgeSearchResult {
    id: string;
}

interface MemoryRetrievalAdapterResult {
    episodic: { id: string }[];
    semantic: { content: string }[];
}

export class ExecutePlanStepJob {
    private readonly queueName = "planner-steps";
    private readonly queue: Queue<ExecutePlanStepJobPayload>;
    private readonly worker: Worker<ExecutePlanStepJobPayload>;

    constructor(
        private readonly stepRepo: IPlanStepRepository,
        private readonly handoffRepo: IAgentHandoffRepository,
        private readonly taskExecutionPort: ITaskExecutionPort,
        private readonly planRepo: IExecutionPlanRepository,
        private readonly auditService: PlannerAuditService,
    ) {
        this.queue = new Queue(this.queueName, { connection: redisConnection as any });
        this.worker = new Worker(
            this.queueName,
            async (job: Job<ExecutePlanStepJobPayload>) => this.process(job),
            {
                connection: redisConnection as any,
                settings: {
                    backoffStrategy: (attemptsMade: number) => {
                        return Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
                    },
                },
            },
        );
        this.setupListeners();
    }

    async addStep(planId: string, stepId: string, tenantId: string): Promise<string> {
        const jobId = `plan-${planId}-step-${stepId}-${randomUUID()}`;
        await this.queue.add(
            "execute-plan-step",
            { planId, stepId, tenantId },
            {
                jobId,
                removeOnComplete: 20,
                removeOnFail: 20,
            },
        );
        return jobId;
    }

    async removeJob(jobId: string): Promise<void> {
        const job = await this.queue.getJob(jobId);
        if (job) {
            await job.remove();
        }
    }

    private async retrieveRelevantMemory(agentId: string, context: string): Promise<MemoryRetrievalAdapterResult> {
        try {
            const result = await memoryService.retrieveMemoryForTask({
                taskId: `planner-${randomUUID()}`,
                agentId,
                prompt: context,
                limit: 5,
            });
            return {
                episodic: result.entries.filter((e) => e.type === "episodic").map((e) => ({ id: e.id })),
                semantic: result.entries.filter((e) => e.type === "semantic").map((e) => ({ content: e.content || e.id })),
            };
        } catch {
            return { episodic: [], semantic: [] };
        }
    }

    private async retrieveKnowledgeChunks(agentId: string, query: string, tenantId: string): Promise<KnowledgeSearchResult[]> {
        try {
            const repo = new PrismaKnowledgeRepository(getPrismaClient());
            const results = await repo.searchDocuments(query, tenantId, { limit: 3 });
            return results.map((r) => ({ id: r.id }));
        } catch {
            return [];
        }
    }

    private async process(job: Job<ExecutePlanStepJobPayload>): Promise<void> {
        const { planId, stepId, tenantId } = job.data;
        console.info(`[ExecutePlanStepJob] Starting step ${stepId} for plan ${planId}`);

        const step = await this.stepRepo.findById(stepId, tenantId);
        if (!step) {
            throw new Error(`Step ${stepId} not found`);
        }

        const plan = await this.planRepo.findById(planId, tenantId);
        if (!plan) {
            throw new Error(`Plan ${planId} not found`);
        }

        emitPlanEvent("plan.step.started", { planId, stepId });

        try {
            const completedSteps = await this.stepRepo.findCompletedByPlanId(planId, tenantId);
            const previousStep = completedSteps[completedSteps.length - 1];

            const relevantMemory = await this.retrieveRelevantMemory(step.agentId, step.description || step.title);
            const knowledgeChunks = await this.retrieveKnowledgeChunks(step.agentId, step.description || step.title, tenantId);

            const payload = this.buildHandoffPayload(step, plan, completedSteps as any, previousStep?.agentId, relevantMemory, knowledgeChunks);

            await this.handoffRepo.create({
                id: randomUUID(),
                tenantId,
                planId,
                stepId,
                fromAgentId: previousStep?.agentId || "planner-system",
                toAgentId: step.agentId,
                status: "accepted",
                payload,
                createdAt: new Date(),
            });

            await this.auditService.log("handoff.created", stepId, "planner-system", { planId, stepId, toAgentId: step.agentId });
            emitPlanEvent("plan.handoff.created", { planId, stepId });

            const result = await this.taskExecutionPort.execute({
                tenantId,
                taskId: stepId,
                agentId: step.agentId,
                payload,
            });

            await this.stepRepo.update(stepId, {
                status: "completed" as PlanStepStatus,
                output: {
                    summary: String(result?.content || JSON.stringify(result)),
                    artifacts: [],
                },
                completedAt: new Date(),
            });

            emitPlanEvent("plan.step.completed", { planId, stepId });
            console.info(`[ExecutePlanStepJob] Step ${stepId} completed successfully`);
        } catch (error: any) {
            console.error(`[ExecutePlanStepJob] Step ${stepId} failed:`, error.message);
            await this.handleStepFailure(step, planId, error);
        }
    }

    private async handleStepFailure(
        step: { id: string; retryCount: number; maxRetries: number },
        planId: string,
        error: Error,
    ): Promise<void> {
        const newRetryCount = step.retryCount + 1;

        if (newRetryCount < step.maxRetries) {
            await this.stepRepo.update(step.id, { retryCount: newRetryCount });
            throw error;
        }

        await this.stepRepo.update(step.id, {
            status: "failed" as PlanStepStatus,
            errorMessage: error.message,
            failedAt: new Date(),
        });

        emitPlanEvent("plan.step.failed", { planId, stepId: step.id, error: error.message });
        console.error(`[ExecutePlanStepJob] Step ${step.id} exhausted retries, marked as failed`);
    }

    private buildHandoffPayload(
        step: { id: string; agentId: string; title: string; description?: string | null; continuationInstructions?: string | null; expectedOutputFormat?: string | null; requiresApproval?: boolean | null },
        plan: { taskId: string; description?: string | null },
        completedSteps: { id: string; output: { summary?: string; artifacts?: string[] } | null }[],
        fromAgentId: string | undefined,
        relevantMemory: MemoryRetrievalAdapterResult,
        knowledgeChunks: KnowledgeSearchResult[],
    ): HandoffPayload {
        const completedSoFar = completedSteps.map((s) => s.output?.summary || "").join("\n");
        const constraints = (step.continuationInstructions || "").split("\n").filter(Boolean);

        return {
            planId: plan.taskId,
            stepId: step.id,
            fromAgentId: fromAgentId || "planner-system",
            toAgentId: step.agentId,
            taskContext: {
                originalTaskId: plan.taskId,
                originalGoal: plan.description || "",
                completedSoFar,
                currentObjective: step.description || step.title,
                constraints,
            },
            relevantMemory: {
                episodicEntries: relevantMemory.episodic.map((m) => m.id),
                semanticFacts: relevantMemory.semantic.map((m) => m.content),
                knowledgeChunks: knowledgeChunks.map((c) => c.id),
            },
            intermediateResults: completedSteps.map((s) => ({
                stepId: s.id,
                summary: s.output?.summary || "",
                artifacts: s.output?.artifacts || [],
            })),
            continuationInstructions: step.continuationInstructions || "",
            expectedOutputFormat: step.expectedOutputFormat || "text",
            humanApprovalRequired: step.requiresApproval || false,
        };
    }

    private setupListeners(): void {
        this.worker.on("completed", (job) => {
            console.info(`[ExecutePlanStepJob] Job ${job.id} completed`);
        });

        this.worker.on("failed", (job, err) => {
            console.error(`[ExecutePlanStepJob] Job ${job?.id} failed:`, err.message);
        });
    }

    async close(): Promise<void> {
        await this.worker.close();
        await this.queue.close();
    }
}
