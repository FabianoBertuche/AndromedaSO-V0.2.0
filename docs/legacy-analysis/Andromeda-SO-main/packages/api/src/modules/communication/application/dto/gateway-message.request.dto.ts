export interface GatewayMessageRequestDto {
    channel: "web" | "telegram" | "discord" | "cli" | "mobile";
    sender: {
        externalUserId?: string;
        internalUserId?: string;
        displayName?: string;
        isAuthenticated?: boolean;
    };
    session?: {
        id?: string;
        externalSessionId?: string;
        channelSessionId?: string;
    };
    content: {
        type: "text" | "json" | "event" | "command";
        text?: string;
        payload?: Record<string, unknown>;
    };
    metadata?: {
        requestId?: string;
        correlationId?: string;
        messageIdempotencyKey?: string;
        locale?: string;
        timezone?: string;
        client?: {
            platform?: string;
            version?: string;
        };
        context?: Record<string, unknown>;
        modelId?: string;
    };
}
