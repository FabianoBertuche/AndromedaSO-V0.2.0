import { ChannelAdapterPort } from "../../../domain/ports/integration.ports";
import { UnifiedMessage, MessageRole, ChannelType } from "../../../domain/entities/unified-message.entity";
import { UnifiedResponse } from "../../../domain/entities/unified-response.entity";
import { GatewayMessageRequestDto } from "../../../application/dto/gateway-message.request.dto";
import { v4 as uuidv4 } from "uuid";

export class WebChannelAdapter implements ChannelAdapterPort {
    readonly channel = "web";

    async normalize(input: GatewayMessageRequestDto): Promise<UnifiedMessage> {
        const messageId = uuidv4();
        const timestamp = new Date().toISOString();

        return new UnifiedMessage({
            id: messageId,
            channel: (input.channel as ChannelType) || "web",
            role: "user" as MessageRole,
            sender: {
                externalUserId: input.sender?.externalUserId,
                internalUserId: input.sender?.internalUserId,
                displayName: input.sender?.displayName,
                isAuthenticated: input.sender?.isAuthenticated ?? false,
            },
            session: {
                id: input.session?.id || "", // Resolvido depois pelo SessionResolver
                externalSessionId: input.session?.externalSessionId,
                channelSessionId: input.session?.channelSessionId,
            },
            content: {
                type: input.content.type,
                text: input.content.text,
                payload: input.content.payload,
            },
            metadata: {
                requestId: input.metadata?.requestId || uuidv4(),
                correlationId: input.metadata?.correlationId || uuidv4(),
                messageIdempotencyKey: input.metadata?.messageIdempotencyKey,
                timestamp,
                locale: input.metadata?.locale,
                timezone: input.metadata?.timezone,
                client: {
                    platform: input.metadata?.client?.platform,
                    version: input.metadata?.client?.version,
                },
                context: input.metadata?.context,
                modelId: input.metadata?.modelId,
            },
        });
    }

    async buildResponse(output: UnifiedResponse): Promise<unknown> {
        // Para o canal web, a resposta unificada já é o DTO final.
        return output;
    }
}
