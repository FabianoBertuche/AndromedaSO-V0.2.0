import { beforeEach, describe, expect, it, vi } from 'vitest';

const { poolQueryMock } = vi.hoisted(() => ({
  poolQueryMock: vi.fn()
}));

vi.mock('pg', () => {
  class MockPool {
    query = poolQueryMock;
  }

  return { Pool: MockPool };
});

import { ProviderRepositoryPostgres } from '../provider.repository.postgres.js';

describe('ProviderRepositoryPostgres OAuth sessions', () => {
  let repository: ProviderRepositoryPostgres;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ProviderRepositoryPostgres('postgres://example');
    poolQueryMock.mockResolvedValue({ rowCount: 0, rows: [] });
  });

  it('claims a matching oauth session atomically in postgres mode', async () => {
    await repository.initialize();

    poolQueryMock.mockResolvedValueOnce({
      rowCount: 1,
      rows: [
        {
          id: 'session-1',
          provider_type: 'openai-codex',
          state_hash: 'state-hash',
          code_verifier: 'verifier',
          redirect_uri: 'http://localhost:5173/oauth/callback',
          origin: 'http://localhost:5173',
          expires_at: '2099-01-01T00:00:00.000Z',
          consumed_at: '2026-01-01T00:00:00.000Z',
          created_at: '2026-01-01T00:00:00.000Z'
        }
      ]
    });

    const session = await repository.claimOAuthSessionByStateHash(
      'state-hash',
      'openai-codex',
      '2026-01-01T00:00:00.000Z',
      '2025-12-31T23:59:00.000Z'
    );

    expect(session).toEqual({
      id: 'session-1',
      providerType: 'openai-codex',
      stateHash: 'state-hash',
      codeVerifier: 'verifier',
      redirectUri: 'http://localhost:5173/oauth/callback',
      origin: 'http://localhost:5173',
      expiresAt: '2099-01-01T00:00:00.000Z',
      consumedAt: '2026-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z'
    });

    expect(poolQueryMock).toHaveBeenLastCalledWith(
      expect.stringContaining('UPDATE provider_oauth_session'),
      [
        'state-hash',
        'openai-codex',
        '2026-01-01T00:00:00.000Z',
        '2025-12-31T23:59:00.000Z'
      ]
    );
  });

  it('returns null when the atomic claim does not match a reusable session', async () => {
    await repository.initialize();

    poolQueryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await expect(repository.claimOAuthSessionByStateHash(
      'missing-state-hash',
      'openai-codex',
      '2026-01-01T00:00:00.000Z',
      '2025-12-31T23:59:00.000Z'
    )).resolves.toBeNull();
  });

  it('filters atomic claim by provider type and reusable-session guardrails', async () => {
    await repository.initialize();

    poolQueryMock.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    await repository.claimOAuthSessionByStateHash(
      'state-hash',
      'openai-codex',
      '2026-01-01T00:00:00.000Z',
      '2025-12-31T23:59:00.000Z'
    );

    expect(poolQueryMock).toHaveBeenLastCalledWith(
      expect.stringContaining('provider_type = $2'),
      [
        'state-hash',
        'openai-codex',
        '2026-01-01T00:00:00.000Z',
        '2025-12-31T23:59:00.000Z'
      ]
    );
    expect(String(poolQueryMock.mock.calls.at(-1)?.[0])).toContain('consumed_at IS NULL');
    expect(String(poolQueryMock.mock.calls.at(-1)?.[0])).toContain('expires_at > $4');
  });
});
