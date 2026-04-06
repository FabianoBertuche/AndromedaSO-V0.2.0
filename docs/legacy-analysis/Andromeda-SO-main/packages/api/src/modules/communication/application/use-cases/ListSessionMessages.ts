import { CommunicationMessageRepository } from "../../domain/repositories/communication-message.repository";

export class ListSessionMessages {
    constructor(private readonly messageRepository: CommunicationMessageRepository) { }

    async execute(sessionId: string) {
        return this.messageRepository.findBySessionId(sessionId);
    }
}
