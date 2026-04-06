import { PlanStep } from "../../domain/plan-step";
import { IPlanStepRepository } from "../../domain/ports";

export class PrismaPlanStepRepository implements IPlanStepRepository {
    constructor(private readonly prisma: any) { }

    async create(input: PlanStep): Promise<PlanStep> {
        const record = await this.prisma.planStep.create({ data: mapPlanStepToPersistence(input) });
        return mapPlanStep(record);
    }

    async createMany(input: PlanStep[]): Promise<PlanStep[]> {
        const records = await this.prisma.$transaction(
            input.map((step) => this.prisma.planStep.create({ data: mapPlanStepToPersistence(step) })),
        );
        return records.map(mapPlanStep);
    }

    async findById(stepId: string, tenantId?: string): Promise<PlanStep | null> {
        const record = await this.prisma.planStep.findFirst({
            where: {
                id: stepId,
                ...(tenantId ? { tenantId } : {}),
            },
        });

        return record ? mapPlanStep(record) : null;
    }

    async findByPlanId(planId: string, tenantId?: string): Promise<PlanStep[]> {
        const records = await this.prisma.planStep.findMany({
            where: {
                planId,
                ...(tenantId ? { tenantId } : {}),
            },
            orderBy: { stepIndex: "asc" },
        });

        return records.map(mapPlanStep);
    }

    async findCompletedByPlanId(planId: string, tenantId?: string): Promise<PlanStep[]> {
        const records = await this.prisma.planStep.findMany({
            where: {
                planId,
                status: "completed",
                ...(tenantId ? { tenantId } : {}),
            },
            orderBy: { stepIndex: "asc" },
        });

        return records.map(mapPlanStep);
    }

    async updateStatus(stepId: string, status: PlanStep["status"]): Promise<void> {
        await this.prisma.planStep.update({ where: { id: stepId }, data: { status } });
    }

    async update(stepId: string, patch: Partial<PlanStep>): Promise<PlanStep> {
        const record = await this.prisma.planStep.update({
            where: { id: stepId },
            data: mapPlanStepToPersistence(patch),
        });
        return mapPlanStep(record);
    }

    async softDeleteByPlanId(planId: string, tenantId: string, deletedAt = new Date()): Promise<void> {
        await this.prisma.planStep.updateMany({
            where: { planId, tenantId },
            data: { deletedAt },
        });
    }
}

function mapPlanStep(record: any): PlanStep {
    return {
        id: record.id,
        tenantId: record.tenantId,
        planId: record.planId,
        stepIndex: record.stepIndex,
        title: record.title,
        description: record.description || null,
        agentId: record.agentId,
        skillId: record.skillId || null,
        status: record.status,
        input: record.input || null,
        output: record.output || null,
        errorMessage: record.errorMessage || null,
        dependsOn: Array.isArray(record.dependsOn) ? record.dependsOn : [],
        canRunParallel: record.canRunParallel,
        requiresApproval: record.requiresApproval,
        approvedBy: record.approvedBy || null,
        approvedAt: record.approvedAt || null,
        continuationInstructions: record.continuationInstructions || null,
        expectedOutputFormat: record.expectedOutputFormat || null,
        startedAt: record.startedAt || null,
        completedAt: record.completedAt || null,
        failedAt: record.failedAt || null,
        retryCount: record.retryCount,
        maxRetries: record.maxRetries,
        deletedAt: record.deletedAt || null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

function mapPlanStepToPersistence(input: Partial<PlanStep>) {
    return {
        ...(input.id !== undefined ? { id: input.id } : {}),
        ...(input.tenantId !== undefined ? { tenantId: input.tenantId } : {}),
        ...(input.planId !== undefined ? { planId: input.planId } : {}),
        ...(input.stepIndex !== undefined ? { stepIndex: input.stepIndex } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.agentId !== undefined ? { agentId: input.agentId } : {}),
        ...(input.skillId !== undefined ? { skillId: input.skillId } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.input !== undefined ? { input: input.input } : {}),
        ...(input.output !== undefined ? { output: input.output } : {}),
        ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
        ...(input.dependsOn !== undefined ? { dependsOn: input.dependsOn } : {}),
        ...(input.canRunParallel !== undefined ? { canRunParallel: input.canRunParallel } : {}),
        ...(input.requiresApproval !== undefined ? { requiresApproval: input.requiresApproval } : {}),
        ...(input.approvedBy !== undefined ? { approvedBy: input.approvedBy } : {}),
        ...(input.approvedAt !== undefined ? { approvedAt: input.approvedAt } : {}),
        ...(input.continuationInstructions !== undefined ? { continuationInstructions: input.continuationInstructions } : {}),
        ...(input.expectedOutputFormat !== undefined ? { expectedOutputFormat: input.expectedOutputFormat } : {}),
        ...(input.startedAt !== undefined ? { startedAt: input.startedAt } : {}),
        ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {}),
        ...(input.failedAt !== undefined ? { failedAt: input.failedAt } : {}),
        ...(input.retryCount !== undefined ? { retryCount: input.retryCount } : {}),
        ...(input.maxRetries !== undefined ? { maxRetries: input.maxRetries } : {}),
        ...(input.deletedAt !== undefined ? { deletedAt: input.deletedAt } : {}),
        ...(input.createdAt !== undefined ? { createdAt: input.createdAt } : {}),
        ...(input.updatedAt !== undefined ? { updatedAt: input.updatedAt } : {}),
    };
}
