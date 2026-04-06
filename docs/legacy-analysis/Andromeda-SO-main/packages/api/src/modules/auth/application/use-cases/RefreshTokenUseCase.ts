import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { env } from '../../../../shared/config/env';
import { ITokenRepository, IUserRepository } from '../../domain/ports';

export class RefreshTokenUseCase {
    constructor(
        private tokenRepository: ITokenRepository,
        private userRepository: IUserRepository
    ) { }

    async execute(refreshToken: string) {
        try {
            const payload = jwt.verify(refreshToken, env.JWT_SECRET) as any;
            const userId = payload.sub;

            const user = await this.userRepository.findById(userId);
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            // Verificação manual do hash no banco é lenta, mas segura se quisermos revogação
            // Alternativa: o tokenRepository busca pelo tokenHash (bcrypt.compare é necessário se salvarmos hash)
            // Como o bcrypt é one-way, temos que buscar tokens do usuário e comparar um a um
            // ou melhorar o schema para salvar um JTI (JWT ID).

            // Para manter a simplicidade e a regra do usuário (hash bcrypt no DB):
            // Precisamos encontrar o registro do token. O tokenRepository.findRefreshToken(tokenHash)
            // não funciona com bcrypt.hash aleatório. 
            // Solução: Salvar o refreshToken serializado ou um JTI.

            // VOU ASSUMIR que a regra do usuário "hash bcrypt(10) antes de salvar no DB"
            // significa que para validar, temos que buscar tokens do USER_ID e comparar.

            // TODO: Otimizar isto no futuro com JTI
            const storedTokens = await (this.tokenRepository as any).prisma.refreshToken.findMany({
                where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }
            });

            let found = false;
            for (const token of storedTokens) {
                if (await bcrypt.compare(refreshToken, token.tokenHash)) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                return { success: false, error: 'Invalid or revoked refresh token' };
            }

            const accessToken = jwt.sign(
                { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
                env.JWT_SECRET as string,
                { expiresIn: env.JWT_ACCESS_EXPIRES as any }
            );

            return { success: true, data: { accessToken } };
        } catch (error) {
            return { success: false, error: 'Invalid token' };
        }
    }
}
