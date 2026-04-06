import { CommunicationSession } from "../../domain/entities/communication-session.entity";
import { CommunicationSessionRepository } from "../../domain/repositories/communication-session.repository";

export class InMemoryCommunicationSessionRepository implements CommunicationSessionRepository {
    private sessions: Map<string, CommunicationSession> = new Map();

    async findById(id: string): Promise<CommunicationSession | null> {
        return this.sessions.get(id) || null;
    }

    async findByExternalSession(
        channel: string,
        externalSessionId: string
    ): Promise<CommunicationSession | null> {
        for (const session of this.sessions.values()) {
            if (session.channel === channel && session.externalSessionId === externalSessionId) {
                return session;
            }
        }
        return null;
    }

    async save(session: CommunicationSession): Promise<void> {
        this.sessions.set(session.id, session);
    }

    async restore(id: string): Promise<void> {
        const session = this.sessions.get(id);
        if (!session) {
            return;
        }

        this.sessions.set(id, new CommunicationSession({
            ...session.toJSON(),
            status: "active",
            updatedAt: new Date(),
        }));
    }
}
