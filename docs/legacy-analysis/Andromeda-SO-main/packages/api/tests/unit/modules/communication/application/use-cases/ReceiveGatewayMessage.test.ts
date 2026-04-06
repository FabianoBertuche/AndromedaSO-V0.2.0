import { CreateTask } from "@andromeda/core";
import { describe, expect, it } from "vitest";
import { GatewayMessageRequestDto } from "../../../../../../src/modules/communication/application/dto/gateway-message.request.dto";
import { ReceiveGatewayMessage } from "../../../../../../src/modules/communication/application/use-cases/ReceiveGatewayMessage";
import { ResolveSession } from "../../../../../../src/modules/communication/application/use-cases/ResolveSession";
import { CreateTaskFromMessage } from "../../../../../../src/modules/communication/application/use-cases/CreateTaskFromMessage";
import { InMemoryCommunicationSessionRepository } from "../../../../../../src/modules/communication/infrastructure/persistence/in-memory-communication-session.repository";
import { InMemoryCommunicationMessageRepository } from "../../../../../../src/modules/communication/infrastructure/persistence/in-memory-communication-message.repository";
import { InMemoryTaskRepository } from "../../../../../../src/infrastructure/repositories/InMemoryTaskRepository";
import { WebChannelAdapter } from "../../../../../../src/modules/communication/infrastructure/channels/web/web-channel.adapter";

describe("ReceiveGatewayMessage", () => {
    it("keeps gateway normalization, auth, session resolution and unified response intact", async () => {
        const sessionRepository = new InMemoryCommunicationSessionRepository();
        const messageRepository = new InMemoryCommunicationMessageRepository();
        const taskRepository = new InMemoryTaskRepository();
        const resolveSession = new ResolveSession(sessionRepository);
        const createTaskFromMessage = new CreateTaskFromMessage(new CreateTask(taskRepository));

        const useCase = new ReceiveGatewayMessage(
            new WebChannelAdapter(),
            resolveSession,
            messageRepository,
            createTaskFromMessage
        );

        const input: GatewayMessageRequestDto = {
            channel: "web",
            sender: {
                isAuthenticated: true,
            },
            content: {
                type: "text",
                text: "ping hybrid foundation",
            },
            metadata: {
                requestId: "req-1",
                correlationId: "corr-1",
                context: {
                    targetAgentId: "agent-1",
                    targetAgentVersion: "v12",
                    targetTeamId: "team-core",
                    personaProfileId: "persona-balanced",
                    interactionMode: "chat",
                },
            },
        };

        const response = await useCase.execute(input, {
            clientId: "client_web",
            scopes: ["gateway:message:send"],
        });

        const createdTask = await taskRepository.findById(response.task?.id || "");

        expect(response.task?.id).toBeDefined();
        expect(response.meta?.requestId).toBe("req-1");
        expect(response.meta?.correlationId).toBe("corr-1");
        expect(createdTask?.getMetadata()).toMatchObject({
            sessionId: response.sessionId,
            sourceChannel: "web",
            requestId: "req-1",
            correlationId: "corr-1",
            targetAgentId: "agent-1",
            targetAgentVersion: "v12",
            targetTeamId: "team-core",
            personaProfileId: "persona-balanced",
            interactionMode: "chat",
        });

        const persistedMessages = await messageRepository.findBySessionId(response.sessionId);
        expect(persistedMessages).toHaveLength(1);
        expect(persistedMessages[0].metadata.auth?.clientId).toBe("client_web");
        expect(persistedMessages[0].metadata.context).toMatchObject({
            targetAgentId: "agent-1",
            targetTeamId: "team-core",
            personaProfileId: "persona-balanced",
            interactionMode: "chat",
        });
    });
});
