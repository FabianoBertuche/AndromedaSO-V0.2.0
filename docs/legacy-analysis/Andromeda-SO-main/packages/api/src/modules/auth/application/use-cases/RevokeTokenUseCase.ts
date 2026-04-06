import { ITokenRepository } from '../../domain/ports';
import bcrypt from 'bcrypt';

export class RevokeTokenUseCase {
    constructor(private tokenRepository: ITokenRepository) { }

    async execute(refreshToken: string, userId: string) {
        // Buscar tokens do usuário e revogar o que bate com o hash
        // Novamente, sem JTI é difícil revogar UM token específico sem comparar todos.
        const storedTokens = await (this.tokenRepository as any).prisma.refreshToken.findMany({
            where: { userId, revokedAt: null }
        });

        for (const token of storedTokens) {
            if (await bcrypt.compare(refreshToken, token.tokenHash)) {
                await (this.tokenRepository as any).prisma.refreshToken.update({
                    where: { id: token.id },
                    data: { revokedAt: new Date() }
                });
                break;
            }
        }

        return { success: true };
    }
}
