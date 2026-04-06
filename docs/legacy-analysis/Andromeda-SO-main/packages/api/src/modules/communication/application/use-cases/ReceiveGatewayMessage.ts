import { GatewayMessageRequestDto } from "../dto/gateway-message.request.dto";
import { GatewayMessageResponseDto } from "../dto/gateway-message.response.dto";
import { ChannelAdapterPort } from "../../domain/ports/integration.ports";
import { ResolveSession } from "./ResolveSession";
import { CommunicationMessageRepository } from "../../domain/repositories/communication-message.repository";
import { CreateTaskFromMessage } from "./CreateTaskFromMessage";
import { GatewayResponseMapper } from "../mappers/GatewayResponseMapper";
import { validateGatewayMessageRequest } from "../validators/gateway-message.validator";

export class ReceiveGatewayMessage {
    constructor(
        private readonly channelAdapter: ChannelAdapterPort,
        private readonly resolveSession: ResolveSession,
        private readonly messageRepository: CommunicationMessageRepository,
        private readonly createTaskFromMessage: CreateTaskFromMessage
    ) { }

    async execute(
        input: GatewayMessageRequestDto,
        auth: { clientId: string; scopes: string[] }
    ): Promise<GatewayMessageResponseDto> {
        const startTime = Date.now();

        validateGatewayMessageRequest(input);

        // 1. Normalizar a mensagem para o formato unificado
        const normalized = await this.channelAdapter.normalize(input);

        // 2. Anexar dados de autenticação do canal
        normalized.metadata.auth = {
            clientId: auth.clientId,
            scopes: auth.scopes,
        };

        // 3. Resolver ou criar sessão
        const session = await this.resolveSession.execute(normalized);

        // 4. Persistir a mensagem normalizada
        await this.messageRepository.save(normalized);

        // 5. Encaminhar para o sistema de tasks do kernel
        const taskResult = await this.createTaskFromMessage.execute({
            sessionId: session.id,
            message: normalized,
        });

        const durationMs = Date.now() - startTime;

        // 6. Mapear para resposta unificada e DTO final
        const response = GatewayResponseMapper.fromTaskResult({
            message: normalized,
            session,
            taskResult,
            durationMs,
        });

        return GatewayResponseMapper.toDto(response);
    }
}
