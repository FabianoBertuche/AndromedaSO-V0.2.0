import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../../shared/config/env';
import { IUserRepository, ITokenRepository } from '../../domain/ports';
import { validatePassword } from '../../../../shared/services/password-policy';
import { Role } from '../../domain/user';

export class LoginUseCase {
    constructor(
        private userRepository: IUserRepository,
        private tokenRepository: ITokenRepository
    ) { }

    async execute(email: string, password: string) {
        const user = await this.userRepository.findByEmail(email);

        if (!user) {
            return { success: false, error: 'Invalid credentials' };
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return { success: false, error: 'Invalid credentials' };
        }

        const accessToken = jwt.sign(
            { sub: user.id, email: user.email, role: user.role, tenantId: user.tenantId },
            env.JWT_SECRET as string,
            { expiresIn: env.JWT_ACCESS_EXPIRES as any }
        );

        const refreshTokenRaw = jwt.sign({ sub: user.id }, env.JWT_SECRET as string, {
            expiresIn: env.JWT_REFRESH_EXPIRES as any,
        });

        const tokenHash = await bcrypt.hash(refreshTokenRaw, env.BCRYPT_ROUNDS);

        await this.tokenRepository.saveRefreshToken({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        });

        return {
            success: true,
            data: {
                accessToken,
                refreshToken: refreshTokenRaw,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    tenantId: user.tenantId,
                },
            },
        };
    }
}

export class RegisterUseCase {
    constructor(
        private userRepository: IUserRepository
    ) { }

    async execute(email: string, password: string, tenantId: string = 'default') {
        const { valid, errors } = validatePassword(password);
        
        if (!valid) {
            return { success: false, errors };
        }

        const existingUser = await this.userRepository.findByEmail(email);
        if (existingUser) {
            return { success: false, error: 'Email already registered' };
        }

        const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

        const user = await this.userRepository.create({
            email,
            passwordHash,
            role: Role.VIEWER,
            tenantId,
        });

        return {
            success: true,
            data: {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: user.tenantId,
            },
        };
    }
}