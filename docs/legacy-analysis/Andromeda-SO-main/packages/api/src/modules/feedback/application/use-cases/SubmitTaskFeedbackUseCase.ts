import { FeedbackSubmitted, globalEventBus, TaskRepository } from "@andromeda/core";
import { FeedbackRepository } from "../../domain/FeedbackRepository";
import { SubmitTaskFeedbackInput, TaskFeedbackView } from "../../domain/TaskFeedback";

export class SubmitTaskFeedbackUseCase {
    constructor(
        private readonly repository: FeedbackRepository,
        private readonly taskRepository: TaskRepository,
    ) { }

    async execute(input: SubmitTaskFeedbackInput): Promise<TaskFeedbackView> {
        if (input.rating !== 1 && input.rating !== -1) {
            throw new Error("Feedback rating must be 1 or -1");
        }

        const existing = await this.repository.findByTaskAndUser(input.taskId, input.tenantId, input.userId);
        if (existing) {
            throw new Error("Feedback already submitted for this task by the current user");
        }

        const reference = await this.resolveExecutionReference(input.taskId, input.tenantId);
        if (!reference) {
            throw new Error(`Task ${input.taskId} not found`);
        }

        const feedback = await this.repository.create({
            ...input,
            rating: input.rating,
            comment: input.comment?.trim() || undefined,
            agentId: reference.agentId,
        });

        await this.repository.updateLedgerFeedback(input.taskId, input.tenantId, input.rating);

        globalEventBus.publish(new FeedbackSubmitted(
            input.taskId,
            reference.agentId,
            input.userId,
            input.tenantId,
            input.rating,
        ));

        return feedback;
    }

    private async resolveExecutionReference(taskId: string, tenantId: string) {
        const task = await this.taskRepository.findById(taskId);
        if (task) {
            const resultAgentId = task.getResult()?.agent?.id;
            const metadataAgentId = task.getMetadata().targetAgentId;
            const agentId = typeof resultAgentId === "string" && resultAgentId.trim().length > 0
                ? resultAgentId.trim()
                : typeof metadataAgentId === "string" && metadataAgentId.trim().length > 0
                    ? metadataAgentId.trim()
                    : undefined;
            if (agentId) {
                return { taskId, agentId };
            }
        }

        return this.repository.findExecutionReference(taskId, tenantId);
    }
}
