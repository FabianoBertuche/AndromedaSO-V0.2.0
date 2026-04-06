import { CommunicationSession } from "../entities/communication-session.entity";

export interface CommunicationSessionRepository {
    findById(id: string): Promise<CommunicationSession | null>;
    findByExternalSession(
        channel: string,
        externalSessionId: string
    ): Promise<CommunicationSession | null>;
    save(session: CommunicationSession): Promise<void>;
    restore(id: string): Promise<void>;
}
