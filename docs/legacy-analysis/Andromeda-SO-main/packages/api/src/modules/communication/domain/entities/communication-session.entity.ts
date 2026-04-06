export type SessionChannel =
    | "web"
    | "telegram"
    | "discord"
    | "cli"
    | "mobile";

export type SessionStatus =
    | "active"
    | "idle"
    | "closed";

export interface CommunicationSessionProps {
    id: string;
    channel: SessionChannel;

    externalSessionId?: string;
    internalUserId?: string;
    externalUserId?: string;

    status: SessionStatus;

    createdAt: Date;
    updatedAt: Date;
    lastMessageAt?: Date;

    context: {
        currentTaskId?: string;
        currentAgentId?: string;
        lastMessageId?: string;
        conversationTitle?: string;
    };

    metadata?: {
        locale?: string;
        timezone?: string;
        client?: Record<string, unknown>;
    };
}

export class CommunicationSession {
    constructor(private readonly props: CommunicationSessionProps) { }

    get id(): string { return this.props.id; }
    get channel(): SessionChannel { return this.props.channel; }
    get externalSessionId() { return this.props.externalSessionId; }
    get internalUserId() { return this.props.internalUserId; }
    get externalUserId() { return this.props.externalUserId; }
    get status(): SessionStatus { return this.props.status; }
    get createdAt(): Date { return this.props.createdAt; }
    get updatedAt(): Date { return this.props.updatedAt; }
    get lastMessageAt(): Date | undefined { return this.props.lastMessageAt; }
    get context() { return this.props.context; }
    get metadata() { return this.props.metadata; }

    updateLastMessage(messageId: string): void {
        this.props.context.lastMessageId = messageId;
        this.props.lastMessageAt = new Date();
        this.props.updatedAt = new Date();
    }

    setCurrentTask(taskId: string): void {
        this.props.context.currentTaskId = taskId;
        this.props.updatedAt = new Date();
    }

    toJSON() {
        return { ...this.props };
    }
}
