import { User, RefreshToken, ApiKey } from './user';

export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(user: Partial<User>): Promise<User>;
}

export interface ITokenRepository {
    saveRefreshToken(refreshToken: Partial<RefreshToken>): Promise<RefreshToken>;
    findRefreshToken(tokenHash: string): Promise<RefreshToken | null>;
    revokeRefreshToken(tokenHash: string): Promise<void>;
    revokeAllUserTokens(userId: string): Promise<void>;
}

export interface IApiKeyRepository {
    create(apiKey: Partial<ApiKey>): Promise<ApiKey>;
    findByHash(keyHash: string): Promise<(ApiKey & { user: User }) | null>;
    revoke(id: string): Promise<void>;
    listByTenant(tenantId: string): Promise<ApiKey[]>;
}
