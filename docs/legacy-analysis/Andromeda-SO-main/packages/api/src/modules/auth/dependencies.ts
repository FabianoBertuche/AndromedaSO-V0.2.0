import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { PrismaTokenRepository } from './infrastructure/persistence/PrismaTokenRepository';
import { PrismaApiKeyRepository } from './infrastructure/persistence/PrismaApiKeyRepository';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase';
import { RevokeTokenUseCase } from './application/use-cases/RevokeTokenUseCase';
import { CreateApiKeyUseCase } from './application/use-cases/CreateApiKeyUseCase';
import { AuthController } from './interfaces/http/auth.controller';

const userRepository = new PrismaUserRepository();
const tokenRepository = new PrismaTokenRepository();
const apiKeyRepository = new PrismaApiKeyRepository();

const loginUseCase = new LoginUseCase(userRepository, tokenRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(tokenRepository, userRepository);
const revokeTokenUseCase = new RevokeTokenUseCase(tokenRepository);
const createApiKeyUseCase = new CreateApiKeyUseCase(apiKeyRepository);

export const authController = new AuthController(
    loginUseCase,
    refreshTokenUseCase,
    revokeTokenUseCase,
    createApiKeyUseCase
);
