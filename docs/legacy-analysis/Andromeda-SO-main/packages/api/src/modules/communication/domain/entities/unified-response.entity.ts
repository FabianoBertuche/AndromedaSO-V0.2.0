import { ChannelType } from "./unified-message.entity";

export type ResponseStatus =
    | "accepted"
    | "processing"
    | "completed"
    | "failed";

export type VisualState =
    | "idle"
    | "listening"
    | "thinking"
    | "speaking"
    | "tool_execution"
    | "success"
    | "error";

export interface UnifiedResponse {
    messageId: string;
    sessionId: string;
    channel: ChannelType;
    status: ResponseStatus;

    response: {
        role: "assistant" | "system";
        text?: string;
        payload?: Record<string, unknown>;
    };

    task?: {
        id: string;
        status: string;
        appliedAgentAssets?: Record<string, unknown>;
    };

    visual?: {
        state: VisualState;
        intensity?: number;
        semanticHint?: string;
    };

    events?: Array<{
        type: string;
        timestamp: string;
        data?: Record<string, unknown>;
    }>;

    meta?: {
        requestId?: string;
        correlationId?: string;
        durationMs?: number;
        appliedAgentAssets?: Record<string, unknown>;
    };
}
