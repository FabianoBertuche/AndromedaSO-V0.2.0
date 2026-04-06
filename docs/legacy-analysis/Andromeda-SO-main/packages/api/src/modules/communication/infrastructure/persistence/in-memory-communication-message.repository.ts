import { UnifiedMessage } from "../../domain/entities/unified-message.entity";
import { CommunicationMessageRepository } from "../../domain/repositories/communication-message.repository";

export class InMemoryCommunicationMessageRepository implements CommunicationMessageRepository {
    private messages: UnifiedMessage[] = [];

    async save(message: UnifiedMessage): Promise<void> {
        this.messages.push(message);
    }

    async findBySessionId(sessionId: string): Promise<UnifiedMessage[]> {
        return this.messages.filter((m) => m.session.id === sessionId);
    }

    async existsByIdempotencyKey(key: string): Promise<boolean> {
        return this.messages.some((m) => m.metadata.messageIdempotencyKey === key);
    }
}
