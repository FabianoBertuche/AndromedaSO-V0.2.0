import { UnifiedMessage } from "../entities/unified-message.entity";
import { UnifiedResponse } from "../entities/unified-response.entity";

export interface ChannelAdapterPort {
    channel: string;
    normalize(input: unknown): Promise<UnifiedMessage>;
    buildResponse(output: UnifiedResponse): Promise<unknown>;
}

export interface ChannelAuthPort {
    authenticate(input: {
        channel: string;
        token?: string;
    }): Promise<{
        authenticated: boolean;
        clientId?: string;
        scopes?: string[];
    }>;
}

export interface TaskIngressPort {
    createFromMessage(input: {
        sessionId: string;
        message: UnifiedMessage;
    }): Promise<{
        taskId: string;
        status: string;
        outputText?: string;
    }>;
}
