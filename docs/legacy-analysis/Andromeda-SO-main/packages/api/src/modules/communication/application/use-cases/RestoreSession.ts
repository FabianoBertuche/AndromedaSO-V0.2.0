import { CommunicationSessionRepository } from "../../domain/repositories/communication-session.repository";

export class RestoreSession {
    constructor(private sessionRepository: CommunicationSessionRepository) { }

    async execute(sessionId: string): Promise<void> {
        // Here we could add logic to check if session exists or if user has permission
        // but the repository/extension will handle the DB operation.
        await this.sessionRepository.restore(sessionId);
    }
}
