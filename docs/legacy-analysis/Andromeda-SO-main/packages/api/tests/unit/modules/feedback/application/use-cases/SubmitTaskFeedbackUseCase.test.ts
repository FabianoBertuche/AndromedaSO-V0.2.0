import { Task, TaskRepository } from "@andromeda/core";
import { describe, expect, it, vi } from "vitest";
import { SubmitTaskFeedbackUseCase } from "../../../../../../src/modules/feedback/application/use-cases/SubmitTaskFeedbackUseCase";
import { FeedbackRepository } from "../../../../../../src/modules/feedback/domain/FeedbackRepository";
import { TaskFeedbackView } from "../../../../../../src/modules/feedback/domain/TaskFeedback";

describe("SubmitTaskFeedbackUseCase", () => {
    it("submits feedback for a known task", async () => {
        const repository = createRepository();
        const taskRepository = createTaskRepository(new Task({
            id: "task-1",
            rawRequest: "hello",
            metadata: { targetAgentId: "agent-1" },
        }));
        const useCase = new SubmitTaskFeedbackUseCase(repository, taskRepository);

        const feedback = await useCase.execute({
            tenantId: "default",
            taskId: "task-1",
            userId: "user-1",
            rating: 1,
            comment: "Great answer",
        });

        expect(feedback.agentId).toBe("agent-1");
        expect(repository.create).toHaveBeenCalled();
        expect(repository.updateLedgerFeedback).toHaveBeenCalledWith("task-1", "default", 1);
    });

    it("rejects duplicate feedback by the same user", async () => {
        const existingFeedback: TaskFeedbackView = {
            id: "fb-1",
            taskId: "task-1",
            agentId: "agent-1",
            userId: "user-1",
            rating: 1,
            comment: null,
            submittedAt: new Date().toISOString(),
        };
        const repository = createRepository(existingFeedback);
        const taskRepository = createTaskRepository(new Task({ id: "task-1", rawRequest: "hello" }));
        const useCase = new SubmitTaskFeedbackUseCase(repository, taskRepository);

        await expect(useCase.execute({
            tenantId: "default",
            taskId: "task-1",
            userId: "user-1",
            rating: -1,
        })).rejects.toThrow(/already submitted/i);
    });
});

function createRepository(existing: TaskFeedbackView | null = null): any {
    const create = vi.fn(async (input: any) => ({
        id: "fb-2",
        taskId: input.taskId,
        agentId: input.agentId,
        userId: input.userId,
        rating: input.rating,
        comment: input.comment || null,
        submittedAt: new Date().toISOString(),
    }));
    const updateLedgerFeedback = vi.fn(async () => undefined);

    return {
        findByTask: async () => [],
        findByTaskAndUser: async () => existing,
        create,
        findExecutionReference: async () => ({ taskId: "task-1", agentId: "agent-1" }),
        updateLedgerFeedback,
    };
}

function createTaskRepository(task: Task | null): TaskRepository {
    return {
        save: async () => undefined,
        findById: async () => task,
        findAll: async () => task ? [task] : [],
        findBySessionId: async () => task ? [task] : [],
    };
}
