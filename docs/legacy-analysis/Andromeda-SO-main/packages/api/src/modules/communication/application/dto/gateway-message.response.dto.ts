export interface GatewayMessageResponseDto {
    messageId: string;
    sessionId: string;
    channel: string;
    status: "accepted" | "processing" | "completed" | "failed";
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
        state:
        | "idle"
        | "listening"
        | "thinking"
        | "speaking"
        | "tool_execution"
        | "success"
        | "error";
        intensity?: number;
        semanticHint?: string;
    };
    meta?: {
        requestId?: string;
        correlationId?: string;
        durationMs?: number;
        appliedAgentAssets?: Record<string, unknown>;
    };
}
