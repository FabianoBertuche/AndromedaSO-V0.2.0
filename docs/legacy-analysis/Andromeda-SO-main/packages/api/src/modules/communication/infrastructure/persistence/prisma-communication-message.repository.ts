import { PrismaClient } from "@prisma/client";
import { UnifiedMessage, ChannelType, MessageRole } from "../../domain/entities/unified-message.entity";
import { CommunicationMessageRepository } from "../../domain/repositories/communication-message.repository";
import { getPrismaClient } from "../../../../infrastructure/database/prisma";

export class PrismaCommunicationMessageRepository implements CommunicationMessageRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = getPrismaClient();
    }

    async save(message: UnifiedMessage): Promise<void> {
        await this.prisma.communicationMessage.upsert({
            where: { id: message.id },
            create: {
                id: message.id,
                sessionId: message.session.id,
                channel: message.channel as any,
                role: message.role as any,
                content: message.content as any,
                sender: message.sender as any,
                metadata: message.metadata as any,
                createdAt: new Date(message.metadata.timestamp),
            },
            update: {
                // Mensagens geralmente são imutáveis, mas upsert exige update
                metadata: message.metadata as any,
            }
        });
    }

    async findBySessionId(sessionId: string): Promise<UnifiedMessage[]> {
        const records = await this.prisma.communicationMessage.findMany({
            where: { sessionId },
            orderBy: { createdAt: "asc" }
        });

        return records.map(record => this.mapToDomain(record));
    }

    async existsByIdempotencyKey(key: string): Promise<boolean> {
        const count = await this.prisma.communicationMessage.count({
            where: {
                metadata: {
                    path: ["messageIdempotencyKey"],
                    equals: key
                }
            }
        });
        return count > 0;
    }

    private mapToDomain(record: any): UnifiedMessage {
        return new UnifiedMessage({
            id: record.id,
            channel: record.channel as ChannelType,
            role: record.role as MessageRole,
            sender: record.sender as any,
            session: {
                id: record.sessionId,
            },
            content: record.content as any,
            metadata: {
                ...record.metadata as any,
                timestamp: record.createdAt.toISOString(),
            }
        });
    }
}
