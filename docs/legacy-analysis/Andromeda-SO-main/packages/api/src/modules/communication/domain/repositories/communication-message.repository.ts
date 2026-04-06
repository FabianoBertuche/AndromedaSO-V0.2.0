import { UnifiedMessage } from "../entities/unified-message.entity";

export interface CommunicationMessageRepository {
    save(message: UnifiedMessage): Promise<void>;
    findBySessionId(sessionId: string): Promise<UnifiedMessage[]>;
    existsByIdempotencyKey(key: string): Promise<boolean>;
}
