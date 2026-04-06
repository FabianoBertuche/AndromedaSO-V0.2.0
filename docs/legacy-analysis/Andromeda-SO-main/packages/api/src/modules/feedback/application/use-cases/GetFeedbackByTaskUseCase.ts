import { FeedbackRepository } from "../../domain/FeedbackRepository";
import { TaskFeedbackSummaryView } from "../../domain/TaskFeedback";

export class GetFeedbackByTaskUseCase {
    constructor(private readonly repository: FeedbackRepository) { }

    async execute(taskId: string, tenantId: string): Promise<TaskFeedbackSummaryView> {
        const items = await this.repository.findByTask(taskId, tenantId);
        const positive = items.filter((item) => item.rating > 0).length;
        const negative = items.filter((item) => item.rating < 0).length;

        return {
            taskId,
            items,
            summary: {
                positive,
                negative,
                score: items.length > 0 ? Math.round((items.reduce((sum, item) => sum + item.rating, 0) / items.length) * 100) / 100 : 0,
            },
        };
    }
}
