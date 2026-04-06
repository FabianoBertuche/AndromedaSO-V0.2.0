import { CommunicationSession, SessionChannel, SessionStatus } from "../../domain/entities/communication-session.entity";
import { CommunicationSessionRepository } from "../../domain/repositories/communication-session.repository";
import { UnifiedMessage } from "../../domain/entities/unified-message.entity";
import { v4 as uuidv4 } from "uuid";

export class ResolveSession {
    constructor(private readonly sessionRepository: CommunicationSessionRepository) { }

    async execute(message: UnifiedMessage): Promise<CommunicationSession> {
        let session: CommunicationSession | null = null;

        // 1. Tentar resolver por session.id (ID interno do Andromeda)
        if (message.session.id) {
            session = await this.sessionRepository.findById(message.session.id);
        }

        // 2. Tentar resolver por externalSessionId (ID do canal que o cliente enviou)
        if (!session && message.session.externalSessionId) {
            session = await this.sessionRepository.findByExternalSession(
                message.channel,
                message.session.externalSessionId
            );
        }

        // 3. Se não encontrou, cria nova
        if (!session) {
            session = new CommunicationSession({
                id: message.session.id || `sess_${uuidv4()}`,
                channel: message.channel as SessionChannel,
                externalSessionId: message.session.externalSessionId,
                internalUserId: message.sender.internalUserId,
                externalUserId: message.sender.externalUserId,
                status: "active" as SessionStatus,
                createdAt: new Date(),
                updatedAt: new Date(),
                context: {},
            });
            (message.session as any).isNew = true;
        } else {
            (message.session as any).isNew = false;
        }

        // 4. Injeta o ID oficial da sessão na mensagem
        (message.session as any).id = session.id;

        // 5. Atualiza metadados da sessão
        session.updateLastMessage(message.id);
        await this.sessionRepository.save(session);

        return session;
    }
}
