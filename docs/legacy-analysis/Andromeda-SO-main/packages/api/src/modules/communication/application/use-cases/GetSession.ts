import { CommunicationSessionRepository } from "../../domain/repositories/communication-session.repository";

export class GetSession {
    constructor(private readonly sessionRepository: CommunicationSessionRepository) { }

    async execute(sessionId: string) {
        const session = await this.sessionRepository.findById(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }
        return session;
    }
}
