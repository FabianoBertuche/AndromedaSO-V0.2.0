import { PrismaClient } from '@prisma/client';
import { IApiKeyRepository } from '../../domain/ports';
import { ApiKey, User } from '../../domain/user';

const prisma = (globalThis.__andromedaPrisma || new PrismaClient());

export class PrismaApiKeyRepository implements IApiKeyRepository {
    async create(apiKey: Partial<ApiKey>): Promise<ApiKey> {
        const created = await prisma.apiKey.create({
            data: {
                name: apiKey.name!,
                keyHash: apiKey.keyHash!,
                userId: apiKey.userId!,
                tenantId: apiKey.tenantId!,
                expiresAt: apiKey.expiresAt,
            },
        });
        return created as ApiKey;
    }

    async findByHash(keyHash: string): Promise<(ApiKey & { user: User }) | null> {
        const apiKey = await prisma.apiKey.findUnique({
            where: { keyHash, revokedAt: null },
            include: { user: true },
        });

        if (!apiKey) return null;

        return apiKey as any;
    }

    async revoke(id: string): Promise<void> {
        await prisma.apiKey.update({
            where: { id },
            data: { revokedAt: new Date() },
        });
    }

    async listByTenant(tenantId: string): Promise<ApiKey[]> {
        const keys = await prisma.apiKey.findMany({
            where: { tenantId, revokedAt: null },
        });
        return keys as ApiKey[];
    }
}

