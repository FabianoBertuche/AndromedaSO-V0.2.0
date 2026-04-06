export type ChannelType =
    | "web"
    | "telegram"
    | "discord"
    | "cli"
    | "mobile"
    | "system";

export type MessageRole =
    | "user"
    | "assistant"
    | "system";

export type MessageContentType =
    | "text"
    | "json"
    | "event"
    | "command";

export interface UnifiedMessageProps {
    id: string;
    channel: ChannelType;
    role: MessageRole;

    sender: {
        externalUserId?: string;
        internalUserId?: string;
        displayName?: string;
        isAuthenticated: boolean;
    };

    session: {
        id: string;
        externalSessionId?: string;
        channelSessionId?: string;
        isNew?: boolean;
    };

    content: {
        type: MessageContentType;
        text?: string;
        payload?: Record<string, unknown>;
    };

    metadata: {
        requestId?: string;
        correlationId?: string;
        messageIdempotencyKey?: string;
        timestamp: string;
        locale?: string;
        timezone?: string;
        client?: {
            platform?: string;
            version?: string;
            ip?: string;
            userAgent?: string;
        };
        auth?: {
            clientId: string;
            scopes: string[];
        };
        capabilities?: {
            supportsStreaming?: boolean;
            supportsVoice?: boolean;
            supportsVisualState?: boolean;
        };
        attachments?: Array<{
            id: string;
            type: string;
            url?: string;
            mimeType?: string;
            name?: string;
            sizeBytes?: number;
        }>;
        context?: Record<string, unknown>;
        modelId?: string;
    };
}

export class UnifiedMessage {
    constructor(private readonly props: UnifiedMessageProps) { }

    get id(): string { return this.props.id; }
    get channel(): ChannelType { return this.props.channel; }
    get role(): MessageRole { return this.props.role; }
    get sender() { return this.props.sender; }
    get session() { return this.props.session; }
    get content() { return this.props.content; }
    get metadata() { return this.props.metadata; }

    toJSON() {
        return { ...this.props };
    }
}
