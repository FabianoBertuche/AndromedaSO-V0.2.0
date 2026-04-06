import { UnifiedMessage } from "../../domain/entities/unified-message.entity";
import { CreateTask } from "@andromeda/core";
import { MemoryService } from "../../../memory/application/MemoryService";
import { memoryService } from "../../../memory/dependencies";

export interface CreateTaskFromMessageInput {
    sessionId: string;
    message: UnifiedMessage;
}

export class CreateTaskFromMessage {
    constructor(
        private readonly createTaskUseCase: CreateTask,
        private readonly memoryLayer: MemoryService = memoryService,
    ) { }

    async execute(input: CreateTaskFromMessageInput) {
        const { message, sessionId } = input;

        const task = await this.createTaskUseCase.execute({
            rawRequest: message.content.text || "",
            metadata: {
                ...message.metadata.context,
                sourceChannel: message.channel,
                sessionId: sessionId,
                correlationId: message.metadata.correlationId,
                originMessageId: message.id,
                requestId: message.metadata.requestId,
                modelId: message.metadata.modelId,
            },
        });

        await this.memoryLayer.registerSessionMessageMemory({
            sessionId,
            agentId: asOptionalString(message.metadata.context?.targetAgentId),
            taskId: task.getId(),
            userId: asOptionalString(message.sender.internalUserId),
            teamId: asOptionalString(message.metadata.context?.targetTeamId),
            title: `Gateway message on ${message.channel}`,
            content: message.content.text || "",
            tags: [message.channel, asOptionalString(message.metadata.context?.interactionMode) || "chat"],
            sourceEventId: message.id,
            metadata: {
                requestId: message.metadata.requestId,
                correlationId: message.metadata.correlationId,
                modelId: message.metadata.modelId,
                context: message.metadata.context,
            },
        }).catch((error) => {
            console.warn("[memory.gateway.record.failed]", {
                sessionId,
                taskId: task.getId(),
                error: error instanceof Error ? error.message : "unknown_error",
            });
        });

        return {
            taskId: task.getId(),
            status: task.getStatus(),
            appliedAgentAssets: task.getMetadata().appliedAgentAssets,
        };
    }
}

function asOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
