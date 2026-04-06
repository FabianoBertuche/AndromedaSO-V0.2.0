import { ExecutionPlan } from "../../domain/execution-plan";
import { IExecutionPlanRepository } from "../../domain/ports";

export class PrismaExecutionPlanRepository implements IExecutionPlanRepository {
    constructor(private readonly prisma: any) { }

    async create(input: ExecutionPlan): Promise<ExecutionPlan> {
        const record = await this.prisma.executionPlan.create({
            data: mapPlanToPersistence(input),
        });

        return mapExecutionPlan(record);
    }

    async findById(planId: string, tenantId?: string): Promise<ExecutionPlan | null> {
        const record = await this.prisma.executionPlan.findFirst({
            where: {
                id: planId,
                ...(tenantId ? { tenantId } : {}),
            },
        });

        return record ? mapExecutionPlan(record) : null;
    }

    async findByTaskId(taskId: string, tenantId: string): Promise<ExecutionPlan | null> {
        const record = await this.prisma.executionPlan.findFirst({
            where: { taskId, tenantId },
            orderBy: { createdAt: "desc" },
        });

        return record ? mapExecutionPlan(record) : null;
    }

    async findByTenant(tenantId: string): Promise<ExecutionPlan[]> {
        const records = await this.prisma.executionPlan.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
        });

        return records.map(mapExecutionPlan);
    }

    async updateStatus(planId: string, status: ExecutionPlan["status"]): Promise<void> {
        await this.prisma.executionPlan.update({
            where: { id: planId },
            data: { status },
        });
    }

    async softDelete(planId: string, tenantId: string, deletedAt = new Date()): Promise<void> {
        await this.prisma.executionPlan.updateMany({
            where: { id: planId, tenantId },
            data: { deletedAt },
        });
    }
}

function mapExecutionPlan(record: any): ExecutionPlan {
    return {
        id: record.id,
        tenantId: record.tenantId,
        taskId: record.taskId,
        agentId: record.agentId,
        title: record.title,
        description: record.description || null,
        status: record.status,
        totalSteps: record.totalSteps,
        completedSteps: record.completedSteps,
        failedSteps: record.failedSteps,
        requiresApproval: record.requiresApproval,
        approvedBy: record.approvedBy || null,
        approvedAt: record.approvedAt || null,
        startedAt: record.startedAt || null,
        completedAt: record.completedAt || null,
        failedAt: record.failedAt || null,
        rollbackAt: record.rollbackAt || null,
        metadata: record.metadata || null,
        deletedAt: record.deletedAt || null,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
    };
}

function mapPlanToPersistence(input: ExecutionPlan) {
    return {
        id: input.id,
        tenantId: input.tenantId,
        taskId: input.taskId,
        agentId: input.agentId,
        title: input.title,
        description: input.description,
        status: input.status,
        totalSteps: input.totalSteps,
        completedSteps: input.completedSteps,
        failedSteps: input.failedSteps,
        requiresApproval: input.requiresApproval,
        approvedBy: input.approvedBy,
        approvedAt: input.approvedAt,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
        failedAt: input.failedAt,
        rollbackAt: input.rollbackAt,
        metadata: input.metadata,
        deletedAt: input.deletedAt,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
    };
}
