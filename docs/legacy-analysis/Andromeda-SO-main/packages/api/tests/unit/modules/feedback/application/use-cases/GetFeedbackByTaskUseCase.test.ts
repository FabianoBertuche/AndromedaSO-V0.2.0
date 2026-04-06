import { describe, expect, it } from "vitest";
import { GetFeedbackByTaskUseCase } from "../../../../../../src/modules/feedback/application/use-cases/GetFeedbackByTaskUseCase";
import { FeedbackRepository } from "../../../../../../src/modules/feedback/domain/FeedbackRepository";

describe("GetFeedbackByTaskUseCase", () => {
    it("returns feedback summary grouped by task", async () => {
        const useCase = new GetFeedbackByTaskUseCase({
            findByTask: async () => [
                {
                    id: "fb-1",
                    taskId: "task-1",
                    agentId: "agent-1",
                    userId: "user-1",
                    rating: 1,
                    comment: null,
                    submittedAt: new Date().toISOString(),
                },
                {
                    id: "fb-2",
                    taskId: "task-1",
                    agentId: "agent-1",
                    userId: "user-2",
                    rating: -1,
                    comment: null,
                    submittedAt: new Date().toISOString(),
                },
            ],
            findByTaskAndUser: async () => null,
            create: async () => {
                throw new Error("not implemented");
            },
            findExecutionReference: async () => null,
            updateLedgerFeedback: async () => undefined,
        } satisfies FeedbackRepository);

        const summary = await useCase.execute("task-1", "default");

        expect(summary.summary.positive).toBe(1);
        expect(summary.summary.negative).toBe(1);
        expect(summary.summary.score).toBe(0);
    });
});
