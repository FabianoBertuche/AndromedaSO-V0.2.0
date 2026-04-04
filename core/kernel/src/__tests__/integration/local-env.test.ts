/**
 * Testes de verificação do ambiente de desenvolvimento local.
 *
 * Estes testes requerem infraestrutura real rodando:
 *   - PostgreSQL em DATABASE_URL (padrão: localhost:5432)
 *   - Ollama em OLLAMA_BASE_URL (padrão: http://127.0.0.1:11434)
 *
 * Para subir a infraestrutura:
 *   docker-compose -f docker-compose.infra.yml up -d
 *
 * Para rodar apenas estes testes:
 *   cd core/kernel && npm run test -- local-env
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import { resetProviderRepositoryFactory, getProviderRepository } from '../../modules/providers/infrastructure/repositories/provider.repository.factory.js';

const isCI = process.env.CI === 'true';
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://andromeda:andromeda@localhost:5432/andromeda';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';

describe.skipIf(isCI)('Local Environment Verification', () => {
  describe('PostgreSQL', () => {
    let client: Client;

    beforeAll(async () => {
      client = new Client({ connectionString: DATABASE_URL });
    });

    afterAll(async () => {
      await client.end().catch(() => {});
    });

    it('deve conectar ao PostgreSQL via DATABASE_URL', async () => {
      await expect(client.connect()).resolves.not.toThrow();
    });

    it('deve persistir provider entre restarts da factory', async () => {
      // Forçar modo postgres para este teste
      process.env.PROVIDER_REPOSITORY_MODE = 'postgres';
      resetProviderRepositoryFactory();

      const repo = await getProviderRepository();
      const provider = {
        id: `test-${Date.now()}`,
        name: `test-provider-${Date.now()}`,
        type: 'ollama' as const,
        health: 'warning' as const,
        createdAt: new Date().toISOString(),
        selectedModelIds: [] as string[]
      };

      await repo.create(provider);

      // Simular restart: resetar factory e obter nova instância
      resetProviderRepositoryFactory();
      const repoAfterRestart = await getProviderRepository();
      const found = await repoAfterRestart.findById(provider.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(provider.id);
      expect(found?.name).toBe(provider.name);

      // Cleanup
      resetProviderRepositoryFactory();
      process.env.PROVIDER_REPOSITORY_MODE = 'auto';
    });
  });

  describe('Ollama', () => {
    it('deve conectar ao Ollama via OLLAMA_BASE_URL', async () => {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`).catch(() => null);

      if (!res) {
        throw new Error(
          `Ollama não está acessível em ${OLLAMA_BASE_URL}. ` +
          'Certifique-se de que o Ollama está rodando: https://ollama.ai'
        );
      }

      expect(res.status).toBe(200);
    });

    it('deve listar ao menos um modelo no Ollama', async () => {
      const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      const json = await res.json() as { models: unknown[] };

      expect(Array.isArray(json.models)).toBe(true);
      expect(json.models.length).toBeGreaterThanOrEqual(1);
    });
  });
});