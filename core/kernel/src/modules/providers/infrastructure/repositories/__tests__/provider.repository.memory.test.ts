/**
 * Unit tests for ProviderRepositoryMemory.delete.
 *
 * Feature: provider-management-v2, Task 3.2: Testes unitários para ProviderRepositoryMemory.delete
 *
 * Validates:
 * - Requisito 1.4: Confirmação de exclusão na UI antes de deletar
 * - Requisito 1.5:DELETE /api/providers/:id retorna 404 se provider não existe
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRepositoryMemory } from '../provider.repository.memory.js';
import type { Provider } from '../../../domain/entities/provider.entity.js';
import type { OpenAiCodexOAuthSession } from '../../../domain/repositories/provider.repository.js';

describe('ProviderRepositoryMemory.delete', () => {
  let repo: ProviderRepositoryMemory;

  beforeEach(() => {
    repo = new ProviderRepositoryMemory();
  });

  it('provider existente é removido com sucesso', async () => {
    // Arrange: criar e inserir provider
    const provider: Provider = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'test-provider',
      type: 'openai',
      health: 'ok',
      createdAt: new Date().toISOString(),
      selectedModelIds: []
    };
    await repo.create(provider);

    // Act: deletar o provider
    await repo.delete(provider.id);

    // Assert: provider não deve ser encontrado
    const result = await repo.findById(provider.id);
    expect(result).toBeNull();
  });

  it('provider inexistente lança Error("Provider not found")', async () => {
    // Arrange: ID de um provider que não existe
    const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

    // Act & Assert: deletar deve lançar erro
    await expect(repo.delete(nonExistentId)).rejects.toThrow('Provider not found');
  });

  it('após deletar, list() não deve incluir o provider removido', async () => {
    // Arrange: criar dois providers
    const provider1: Provider = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'provider-one',
      type: 'openai',
      health: 'ok',
      createdAt: new Date().toISOString(),
      selectedModelIds: []
    };
    const provider2: Provider = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'provider-two',
      type: 'anthropic',
      health: 'ok',
      createdAt: new Date().toISOString(),
      selectedModelIds: []
    };
    await repo.create(provider1);
    await repo.create(provider2);

    // Act: deletar apenas o primeiro
    await repo.delete(provider1.id);

    // Assert: list deve retornar apenas o segundo
    const providers = await repo.list();
    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe(provider2.id);
    expect(providers[0].name).toBe('provider-two');
  });

  it('deletar provider remove também seu catalog', async () => {
    // Arrange: criar provider com catalog
    const provider: Provider = {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'provider-with-catalog',
      type: 'openai',
      health: 'ok',
      createdAt: new Date().toISOString(),
      selectedModelIds: []
    };
    await repo.create(provider);
    await repo.setCatalog(provider.id, [
      {
        id: 'model-1',
        modelId: 'gpt-4o',
        providerId: provider.id,
        displayName: 'GPT-4o',
        capabilities: ['chat', 'coding'],
        priceLabel: '$0.00',
        score: 8.5,
        latencyMs: 100,
        contextWindow: '128000'
      }
    ]);

    // Act: deletar provider
    await repo.delete(provider.id);

    // Assert: catalog deve estar vazio
    const catalog = await repo.getCatalog(provider.id);
    expect(catalog).toHaveLength(0);
  });
});

describe('ProviderRepositoryMemory OAuth sessions', () => {
  let repo: ProviderRepositoryMemory;

  beforeEach(() => {
    repo = new ProviderRepositoryMemory();
  });

  it('stores, finds, consumes, and expires codex oauth sessions', async () => {
    const activeSession: OpenAiCodexOAuthSession = {
      id: 'session-active',
      providerType: 'openai-codex',
      stateHash: 'state-hash-active',
      codeVerifier: 'verifier-active',
      redirectUri: 'http://localhost:5173/oauth/callback',
      origin: 'http://localhost:5173',
      expiresAt: '2099-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z'
    };
    const expiredSession: OpenAiCodexOAuthSession = {
      id: 'session-expired',
      providerType: 'openai-codex',
      stateHash: 'state-hash-expired',
      codeVerifier: 'verifier-expired',
      redirectUri: 'http://localhost:5173/oauth/callback',
      origin: 'http://localhost:5173',
      expiresAt: '2025-01-01T00:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z'
    };

    await repo.createOAuthSession(activeSession);
    await repo.createOAuthSession(expiredSession);

    expect(await repo.findOAuthSessionByStateHash(activeSession.stateHash)).toEqual(activeSession);
    expect(await repo.claimOAuthSessionByStateHash(
      activeSession.stateHash,
      activeSession.providerType,
      '2026-01-01T01:00:00.000Z',
      '2026-01-01T00:00:00.000Z'
    )).toEqual({
      ...activeSession,
      consumedAt: '2026-01-01T01:00:00.000Z'
    });
    expect(await repo.claimOAuthSessionByStateHash(
      activeSession.stateHash,
      activeSession.providerType,
      '2026-01-01T01:05:00.000Z',
      '2026-01-01T00:00:00.000Z'
    )).toBeNull();
    expect(await repo.consumeOAuthSession(activeSession.id, '2026-01-01T02:00:00.000Z')).toBe(false);

    const consumedSession = await repo.findOAuthSessionByStateHash(activeSession.stateHash);
    expect(consumedSession?.consumedAt).toBe('2026-01-01T01:00:00.000Z');

    await repo.deleteExpiredOAuthSessions('2026-01-01T00:00:00.000Z');

    expect(await repo.findOAuthSessionByStateHash(expiredSession.stateHash)).toBeNull();
    expect(await repo.findOAuthSessionByStateHash(activeSession.stateHash)).not.toBeNull();
  });

  it('claims using only state hash and provider type without any redirect-uri input', async () => {
    const session: OpenAiCodexOAuthSession = {
      id: 'session-provider-check',
      providerType: 'openai-codex',
      stateHash: 'state-provider-check',
      codeVerifier: 'verifier-provider-check',
      redirectUri: 'http://localhost:5173/oauth/callback',
      origin: 'http://localhost:5173',
      expiresAt: '2099-01-01T00:00:00.000Z',
      createdAt: '2026-01-01T00:00:00.000Z'
    };

    await repo.createOAuthSession(session);

    expect(await repo.claimOAuthSessionByStateHash(
      session.stateHash,
      'openai-codex' as OpenAiCodexOAuthSession['providerType'],
      '2026-01-01T00:10:00.000Z',
      '2026-01-01T00:00:00.000Z'
    )).toEqual({
      ...session,
      consumedAt: '2026-01-01T00:10:00.000Z'
    });
  });
});
