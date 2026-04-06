import { UnifiedMessage } from "../../domain/entities/unified-message.entity";
import { CommunicationSession } from "../../domain/entities/communication-session.entity";
import { UnifiedResponse, VisualState, ResponseStatus } from "../../domain/entities/unified-response.entity";
import { GatewayMessageResponseDto } from "../dto/gateway-message.response.dto";

export class GatewayResponseMapper {
    static fromTaskResult(input: {
        message: UnifiedMessage;
        session: CommunicationSession;
        taskResult: { taskId: string; status: string; outputText?: string; appliedAgentAssets?: Record<string, unknown> };
        durationMs?: number;
    }): UnifiedResponse {
        const { message, session, taskResult, durationMs } = input;

        // Mapeamento básico de status de task para visual state e response status
        const statusMap: Record<string, { visual: VisualState; response: ResponseStatus }> = {
            RECEIVED: { visual: "thinking", response: "accepted" },
            EXECUTING: { visual: "tool_execution", response: "processing" },
            COMPLETED: { visual: "success", response: "completed" },
            FAILED: { visual: "error", response: "failed" },
        };

        const mapped = statusMap[taskResult.status] || { visual: "idle", response: "processing" };

        return {
            messageId: message.id,
            sessionId: session.id,
            channel: message.channel,
            status: mapped.response,
            response: {
                role: "assistant",
                text: taskResult.outputText,
            },
            task: {
                id: taskResult.taskId,
                status: taskResult.status,
                appliedAgentAssets: taskResult.appliedAgentAssets,
            },
            visual: {
                state: mapped.visual,
                intensity: 0.5,
                semanticHint: taskResult.status.toLowerCase(),
            },
            meta: {
                requestId: message.metadata.requestId,
                correlationId: message.metadata.correlationId,
                durationMs,
                appliedAgentAssets: taskResult.appliedAgentAssets,
            },
        };
    }

    static toDto(response: UnifiedResponse): GatewayMessageResponseDto {
        return {
            ...response,
        };
    }
}
