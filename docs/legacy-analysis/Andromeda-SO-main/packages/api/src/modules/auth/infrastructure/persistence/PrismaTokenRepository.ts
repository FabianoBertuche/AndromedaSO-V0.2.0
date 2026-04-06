import { PrismaClient } from '@prisma/client';
import { ITokenRepository } from '../../domain/ports';
import { RefreshToken } from '../../domain/user';

const prisma = (globalThis.__andromedaPrisma || new PrismaClient());

export class PrismaTokenRepository implements ITokenRepository {
    async saveRefreshToken(token: Partial<RefreshToken>): Promise<RefreshToken> {
        const saved = await prisma.refreshToken.create({
            data: {
                userId: token.userId!,
                tokenHash: token.tokenHash!,
                expiresAt: token.expiresAt!,
            },
        });
        return saved as RefreshToken;
    }

    async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
        const token = await prisma.refreshToken.findUnique({
            where: { tokenHash },
        });
        return token as RefreshToken | null;
    }

    async revokeRefreshToken(tokenHash: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { tokenHash },
            data: { revokedAt: new Date() },
        });
    }

    async revokeAllUserTokens(userId: string): Promise<void> {
        await prisma.refreshToken.updateMany({
            where: { userId },
            data: { revokedAt: new Date() },
        });
    }
}

