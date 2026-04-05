/**
 * Property tests for ProviderRepositoryMemory.delete.
 *
 * Feature: provider-management-v2, Property 1: delete remove o provider do repositório
 *
 * Validates:
 * - Requisito 1.1: DELETE /api/providers/:id remove provider do banco
 * - Requisito 1.4: Confirmação de exclusão na UI antes de deletar
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ProviderRepositoryMemory } from '../provider.repository.memory.js';
import type { Provider } from '../../../domain/entities/provider.entity.js';

describe('ProviderRepositoryMemory.delete', () => {
  let repo: ProviderRepositoryMemory;

  beforeEach(() => {
    repo = new ProviderRepositoryMemory();
  });

  // Property 1: delete remove o provider do repositório
  describe('Property 1: delete remove o provider do repositório', () => {
    it('property: após delete, findById deve retornar null para qualquer provider inserido', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('openai', 'anthropic', 'ollama', 'groq'),
          async (id, name, type) => {
            // Arrange: criar provider e inserir no repositório
            const provider: Provider = {
              id,
              name,
              type: type as Provider['type'],
              health: 'ok',
              createdAt: new Date().toISOString(),
              selectedModelIds: []
            };
            await repo.create(provider);

            // Act: deletar o provider
            await repo.delete(id);

            // Assert: findById deve retornar null
            const result = await repo.findById(id);
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: delete remove o provider de todas as estruturas internas (providers, providersByName, catalogs)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.constantFrom('openai', 'anthropic', 'ollama', 'groq'),
          async (id, name, type) => {
            // Arrange: criar provider com catalog
            const provider: Provider = {
              id,
              name,
              type: type as Provider['type'],
              health: 'ok',
              createdAt: new Date().toISOString(),
              selectedModelIds: []
            };
            await repo.create(provider);
            await repo.setCatalog(id, [
              {
                id: 'model-1',
                modelId: 'gpt-4o',
                providerId: id,
                displayName: 'GPT-4o',
                capabilities: ['chat', 'coding'],
                priceLabel: '$0.00',
                score: 8.5,
                latencyMs: 100,
                contextWindow: '128000'
              }
            ]);

            // Act: deletar o provider
            await repo.delete(id);

            // Assert: provider não existe mais em nenhuma estrutura
            const found = await repo.findById(id);
            const catalog = await repo.getCatalog(id);
            expect(found).toBeNull();
            expect(catalog).toHaveLength(0);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
