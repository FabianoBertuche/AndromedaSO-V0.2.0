/**
 * Unit tests for OpenAI adapter.
 *
 * Feature: real-provider-adapters, Task 3.2
 *
 * Tests:
 * - listModels() sem apiKey → retorna seed
 * - listModels() com falha HTTP → retorna seed
 * - listModels() com sucesso → filtra prefixos corretos e mapeia campos
 * - ping() com sucesso → { ok: true, latencyMs: N }
 * - ping() com timeout → { ok: false, latencyMs: 3000 }
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { openAiAdapterFactory } from '../openai.adapter.js';
import { listSeedModels } from '../providerCatalog.js';

describe('OpenAI Adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── listModels ───────────────────────────────────────────────────────────

  describe('listModels()', () => {
    it('retorna seed data quando apiKey é undefined', async () => {
      const adapter = openAiAdapterFactory(undefined);
      const models = await adapter.listModels();
      const seedModels = listSeedModels('openai');

      expect(models).toEqual(seedModels);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna seed data quando apiKey é string vazia', async () => {
      const adapter = openAiAdapterFactory('');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('openai');

      expect(models).toEqual(seedModels);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna seed data quando fetch falha com erro de rede', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const adapter = openAiAdapterFactory('sk-test-key');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('openai');

      expect(models).toEqual(seedModels);
    });

    it('retorna seed data quando fetch retorna status não-ok', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      } as unknown as Response);

      const adapter = openAiAdapterFactory('sk-invalid-key');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('openai');

      expect(models).toEqual(seedModels);
    });

    it('filtra modelos com prefixos corretos (gpt-, o1, o3, o4) e mapeia campos', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [
            { id: 'gpt-4o', object: 'model' },
            { id: 'whisper-1', object: 'model' }, // deve ser filtrado
            { id: 'o3-mini', object: 'model' },
            { id: 'dall-e-3', object: 'model' }, // deve ser filtrado
            { id: 'o4-mini', object: 'model' },
            { id: 'gpt-4o-mini', object: 'model' }
          ],
          object: 'list'
        })
      } as unknown as Response);

      const adapter = openAiAdapterFactory('sk-test-key');
      const models = await adapter.listModels();

      const modelIds = models.map((m) => m.modelId);
      expect(modelIds).toEqual(['gpt-4o', 'o3-mini', 'o4-mini', 'gpt-4o-mini']);

      // Verifica mapeamento de campos
      const gpt4o = models.find((m) => m.modelId === 'gpt-4o');
      expect(gpt4o).toMatchObject({
        modelId: 'gpt-4o',
        displayName: 'gpt-4o',
        contextWindow: 'unknown',
        priceLabel: 'N/A',
        score: 0,
        latencyMs: 0
      });
      expect(gpt4o?.capabilities).toContain('chat');
    });

    it('retorna array vazio quando API retorna dados sem modelos com prefixos válidos', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [
            { id: 'whisper-1', object: 'model' },
            { id: 'dall-e-3', object: 'model' },
            { id: 'text-embedding-3-small', object: 'model' }
          ],
          object: 'list'
        })
      } as unknown as Response);

      const adapter = openAiAdapterFactory('sk-test-key');
      const models = await adapter.listModels();

      expect(models).toEqual([]);
    });
  });

  // ─── ping ────────────────────────────────────────────────────────────────

  describe('ping()', () => {
    it('retorna { ok: true, latencyMs: N } quando fetch completa com sucesso', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], object: 'list' })
      } as unknown as Response);

      const adapter = openAiAdapterFactory('sk-test-key');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('retorna { ok: false, latencyMs: 3000 } quando ocorre timeout', async () => {
      // Simula fetch abortado pelo timeout
      vi.mocked(fetch).mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      const adapter = openAiAdapterFactory('sk-test-key');
      const result = await adapter.ping();

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(3000);
    });

    it('retorna latência fixa simulada quando apiKey é undefined', async () => {
      const adapter = openAiAdapterFactory(undefined);
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBe(110); // Valor fixo do seed
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna latência fixa simulada quando apiKey é string vazia', async () => {
      const adapter = openAiAdapterFactory('');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBe(110);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });
  });
});
