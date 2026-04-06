import { PrismaClient } from "@prisma/client";
import { CommunicationSession, SessionChannel, SessionStatus } from "../../domain/entities/communication-session.entity";
import { CommunicationSessionRepository } from "../../domain/repositories/communication-session.repository";
import { getPrismaClient } from "../../../../infrastructure/database/prisma";

export class PrismaCommunicationSessionRepository implements CommunicationSessionRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = getPrismaClient();
    }

    async findById(id: string): Promise<CommunicationSession | null> {
        const record = await this.prisma.communicationSession.findUnique({
            where: { id }
        });

        if (!record) return null;

        return this.mapToDomain(record);
    }

    async findByExternalSession(
        channel: string,
        externalSessionId: string
    ): Promise<CommunicationSession | null> {
        const record = await this.prisma.communicationSession.findFirst({
            where: {
                channel: channel as any,
                externalSessionId
            }
        });

        if (!record) return null;

        return this.mapToDomain(record);
    }

    async save(session: CommunicationSession): Promise<void> {
        const data = {
            id: session.id,
            channel: session.channel as any,
            externalSessionId: session.externalSessionId,
            internalUserId: session.internalUserId,
            externalUserId: session.externalUserId,
            status: session.status as any,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            lastMessageAt: session.lastMessageAt,
            context: session.context || {},
            metadata: session.metadata || {},
        };

        await this.prisma.communicationSession.upsert({
            where: { id: session.id },
            create: data as any,
            update: data as any
        });
    }

    async restore(id: string): Promise<void> {
        await (this.prisma.communicationSession as any).restore({
            where: { id }
        });
    }

    private mapToDomain(record: any): CommunicationSession {
        return new CommunicationSession({
            id: record.id,
            channel: record.channel as SessionChannel,
            externalSessionId: record.externalSessionId,
            internalUserId: record.internalUserId,
            externalUserId: record.externalUserId,
            status: record.status as SessionStatus,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            lastMessageAt: record.lastMessageAt,
            context: record.context as any,
            metadata: record.metadata as any,
        });
    }
}
