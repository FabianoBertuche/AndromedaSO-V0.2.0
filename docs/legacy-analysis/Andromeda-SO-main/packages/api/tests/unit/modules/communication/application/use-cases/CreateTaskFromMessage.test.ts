import { CreateTask, TaskStatus } from "@andromeda/core";
import { describe, expect, it } from "vitest";
import { InMemoryTaskRepository } from "../../../../../../src/infrastructure/repositories/InMemoryTaskRepository";
import { UnifiedMessage } from "../../../../../../src/modules/communication/domain/entities/unified-message.entity";
import { CreateTaskFromMessage } from "../../../../../../src/modules/communication/application/use-cases/CreateTaskFromMessage";

describe("CreateTaskFromMessage", () => {
    it("creates tasks with the same session and trace metadata received by the gateway", async () => {
        const repository = new InMemoryTaskRepository();
        const createTask = new CreateTask(repository);
        const useCase = new CreateTaskFromMessage(createTask);

        const message = new UnifiedMessage({
            id: "msg-1",
            channel: "web",
            role: "user",
            sender: {
                isAuthenticated: true,
                internalUserId: "user-1",
            },
            session: {
                id: "session-1",
            },
            content: {
                type: "text",
                text: "please summarize the timeline",
            },
            metadata: {
                timestamp: "2026-03-18T12:00:00.000Z",
                requestId: "req-1",
                correlationId: "corr-1",
                modelId: "model-1",
                context: {
                    locale: "pt-BR",
                    targetAgentId: "agent-1",
                    targetTeamId: "team-core",
                    personaProfileId: "persona-balanced",
                    interactionMode: "chat",
                },
            },
        });

        const result = await useCase.execute({
            sessionId: "session-1",
            message,
        });

        const task = await repository.findById(result.taskId);

        expect(result.status).toBe(TaskStatus.RECEIVED);
        expect(task?.getRawRequest()).toBe("please summarize the timeline");
        expect(task?.getMetadata()).toMatchObject({
            sessionId: "session-1",
            correlationId: "corr-1",
            requestId: "req-1",
            sourceChannel: "web",
            originMessageId: "msg-1",
            modelId: "model-1",
            locale: "pt-BR",
            targetAgentId: "agent-1",
            targetTeamId: "team-core",
            personaProfileId: "persona-balanced",
            interactionMode: "chat",
        });
    });
});
