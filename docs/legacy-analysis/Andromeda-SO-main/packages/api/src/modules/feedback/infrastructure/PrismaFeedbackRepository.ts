import { FeedbackRepository } from "../domain/FeedbackRepository";
import { SubmitTaskFeedbackInput, TaskExecutionReference, TaskFeedbackView } from "../domain/TaskFeedback";

export class PrismaFeedbackRepository implements FeedbackRepository {
    constructor(private readonly prisma: any) { }

    async findByTask(taskId: string, tenantId: string): Promise<TaskFeedbackView[]> {
        const records = await this.prisma.taskFeedback.findMany({
            where: {
                taskId,
                tenantId,
            },
            orderBy: { submittedAt: "asc" },
        });

        return records.map(mapFeedback);
    }

    async findByTaskAndUser(taskId: string, tenantId: string, userId: string): Promise<TaskFeedbackView | null> {
        const record = await this.prisma.taskFeedback.findUnique({
            where: {
                tenantId_taskId_userId: {
                    tenantId,
                    taskId,
                    userId,
                },
            },
        });

        return record ? mapFeedback(record) : null;
    }

    async create(input: SubmitTaskFeedbackInput & { agentId: string }): Promise<TaskFeedbackView> {
        const record = await this.prisma.taskFeedback.create({
            data: {
                tenantId: input.tenantId,
                taskId: input.taskId,
                agentId: input.agentId,
                userId: input.userId,
                rating: input.rating,
                comment: input.comment,
                metadata: input.metadata,
            },
        });

        return mapFeedback(record);
    }

    async findExecutionReference(taskId: string, tenantId: string): Promise<TaskExecutionReference | null> {
        const record = await this.prisma.agentExecutionLedger.findUnique({
            where: {
                tenantId_taskId: {
                    tenantId,
                    taskId,
                },
            },
            select: {
                taskId: true,
                agentId: true,
            },
        });

        return record || null;
    }

    async updateLedgerFeedback(taskId: string, tenantId: string, rating: number): Promise<void> {
        await this.prisma.agentExecutionLedger.updateMany({
            where: {
                taskId,
                tenantId,
            },
            data: {
                feedbackRating: rating,
            },
        });
    }
}

function mapFeedback(record: any): TaskFeedbackView {
    return {
        id: record.id,
        taskId: record.taskId,
        agentId: record.agentId,
        userId: record.userId,
        rating: record.rating,
        comment: record.comment || null,
        submittedAt: record.submittedAt.toISOString(),
    };
}
