import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from './LoginUseCase';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('bcrypt');
vi.mock('jsonwebtoken');
vi.mock('../../../../shared/config/env', () => ({
    env: {
        JWT_SECRET: 'test-secret-test-secret-test-secret-test-secret',
        JWT_ACCESS_EXPIRES: '15m',
        JWT_REFRESH_EXPIRES: '30d',
        BCRYPT_ROUNDS: 10,
    },
}));

describe('LoginUseCase', () => {
    let loginUseCase: LoginUseCase;
    const mockUserRepository = {
        findByEmail: vi.fn(),
        findById: vi.fn(),
        create: vi.fn(),
    };
    const mockTokenRepository = {
        saveRefreshToken: vi.fn(),
        findRefreshToken: vi.fn(),
        revokeRefreshToken: vi.fn(),
        revokeAllUserTokens: vi.fn(),
    };

    beforeEach(() => {
        loginUseCase = new LoginUseCase(mockUserRepository, mockTokenRepository);
        vi.clearAllMocks();
    });

    it('should return error if user not found', async () => {
        mockUserRepository.findByEmail.mockResolvedValue(null);

        const result = await loginUseCase.execute('test@example.com', 'password');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
    });

    it('should return error if password invalid', async () => {
        mockUserRepository.findByEmail.mockResolvedValue({
            id: '1',
            email: 'test@example.com',
            passwordHash: 'hashed',
        });
        vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

        const result = await loginUseCase.execute('test@example.com', 'wrong');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Invalid credentials');
    });

    it('should return tokens if login success', async () => {
        const user = {
            id: '1',
            email: 'test@example.com',
            passwordHash: 'hashed',
            role: 'admin',
            tenantId: 'default',
        };
        mockUserRepository.findByEmail.mockResolvedValue(user);
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        vi.mocked(jwt.sign).mockReturnValue('token' as any);
        vi.mocked(bcrypt.hash).mockResolvedValue('tokenHash' as never);

        const result = await loginUseCase.execute('test@example.com', 'password');

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.accessToken).toBe('token');
        expect(mockTokenRepository.saveRefreshToken).toHaveBeenCalled();
    });
});
