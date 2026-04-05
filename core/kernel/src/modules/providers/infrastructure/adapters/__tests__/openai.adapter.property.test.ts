/**
 * Property tests for OpenAI adapter model filtering.
 *
 * Feature: real-provider-adapters, Task 3.3
 * Propriedade 3: Filtragem de modelos OpenAI
 *
 * Para qualquer lista de modelos retornada pela API,
 * listModels() deve retornar apenas modelos cujo id
 * começa com gpt-, o1, o3 ou o4.
 *
 * Valida: Requisito 2.2
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { openAiAdapterFactory } from '../openai.adapter.js';

describe('OpenAI Adapter Property Tests', () => {
  describe('Propriedade 3: Filtragem de modelos OpenAI', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('listModels() retorna apenas modelos com prefixos permitidos (gpt-, o1, o3, o4)', async () => {
      const PREFIXES = ['gpt-', 'o1', 'o3', 'o4'];

      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1 }),
              object: fc.string()
            }),
            { minLength: 1 }
          ),
          async (models) => {
            vi.mocked(fetch).mockResolvedValueOnce({
              json: async () => ({ data: models, object: 'list' })
            } as unknown as Response);

            const adapter = openAiAdapterFactory('sk-test-key');
            const result = await adapter.listModels();

            // Todos os modelos retornados devem ter prefixos válidos
            const allValid = result.every((m) =>
              PREFIXES.some((p) => m.modelId.startsWith(p))
            );

            if (!allValid) {
              throw new Error(
                `Encontrado modelo sem prefixo válido: ${result
                  .filter((m) => !PREFIXES.some((p) => m.modelId.startsWith(p)))
                  .map((m) => m.modelId)
                  .join(', ')}`
              );
            }

            expect(allValid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('prefixos o1, o3, o4 também são aceitos (sem o traço)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [
            { id: 'o1-preview', object: 'model' },
            { id: 'o3-mini', object: 'model' },
            { id: 'o4', object: 'model' }
          ],
          object: 'list'
        })
      } as unknown as Response);

      const adapter = openAiAdapterFactory('sk-test-key');
      const result = await adapter.listModels();

      expect(result.length).toBe(3);
      expect(result.map((m) => m.modelId)).toEqual(['o1-preview', 'o3-mini', 'o4']);
    });

    it('nenhum modelo é retornado quando nenhum tem prefixo válido', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [
            { id: 'whisper-1', object: 'model' },
            { id: 'dall-e-3', object: 'model' },
            { id: 'text-embedding-3-large', object: 'model' }
          ],
          object: 'list'
        })
      } as unknown as Response);

      const adapter = openAiAdapterFactory('sk-test-key');
      const result = await adapter.listModels();

      expect(result).toEqual([]);
    });

    it('modelos com ids muito longos ainda são filtrados corretamente', async () => {
      const longModelId = 'gpt-' + 'a'.repeat(100);
      const invalidId = 'whisper-' + 'b'.repeat(100);

      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [
            { id: longModelId, object: 'model' },
            { id: invalidId, object: 'model' }
          ],
          object: 'list'
        })
      } as unknown as Response);

      const adapter = openAiAdapterFactory('sk-test-key');
      const result = await adapter.listModels();

      expect(result.length).toBe(1);
      expect(result[0].modelId).toBe(longModelId);
    });
  });
});
