/**
 * Unit tests for Groq adapter.
 *
 * Feature: real-provider-adapters, Task 5.2
 *
 * Tests:
 * - listModels() sem apiKey → retorna seed
 * - listModels() com falha HTTP → retorna seed
 * - listModels() com sucesso → mapeia campos corretamente
 * - ping() com sucesso → { ok: true, latencyMs: N }
 * - ping() com timeout → { ok: false, latencyMs: 3000 }
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { groqAdapterFactory } from '../groq.adapter.js';
import { listSeedModels } from '../providerCatalog.js';

describe('Groq Adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── listModels ───────────────────────────────────────────────────────────

  describe('listModels()', () => {
    it('retorna seed data quando apiKey é undefined', async () => {
      const adapter = groqAdapterFactory(undefined);
      const models = await adapter.listModels();
      const seedModels = listSeedModels('groq');

      expect(models).toEqual(seedModels);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna seed data quando apiKey é string vazia', async () => {
      const adapter = groqAdapterFactory('');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('groq');

      expect(models).toEqual(seedModels);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna seed data quando fetch falha com erro de rede', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const adapter = groqAdapterFactory('gsk_mock-key');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('groq');

      expect(models).toEqual(seedModels);
    });

    it('retorna seed data quando fetch retorna erro HTTP', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API key' } })
      } as unknown as Response);

      const adapter = groqAdapterFactory('gsk_invalid_key');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('groq');

      expect(models).toEqual(seedModels);
    });

    it('mapeia campos corretamente para ModelCatalogItem', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [
            { id: 'llama-3.1-8b-instant', object: 'model' },
            { id: 'mixtral-8x7b-32768', object: 'model' },
            { id: 'gemma2-9b-it', object: 'model' }
          ],
          object: 'list'
        })
      } as unknown as Response);

      const adapter = groqAdapterFactory('gsk_test_key');
      const models = await adapter.listModels();

      expect(models.length).toBe(3);

      const llama = models.find((m) => m.modelId === 'llama-3.1-8b-instant');
      expect(llama).toMatchObject({
        modelId: 'llama-3.1-8b-instant',
        displayName: 'llama-3.1-8b-instant',
        contextWindow: 'unknown',
        capabilities: ['chat'],
        priceLabel: 'N/A',
        score: 0,
        latencyMs: 0
      });
    });

    it('preenche campos padrão quando API não fornece', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [{ id: 'groq-test-model', object: 'model' }]
        })
      } as unknown as Response);

      const adapter = groqAdapterFactory('gsk_test_key');
      const models = await adapter.listModels();

      const model = models[0];
      expect(model.contextWindow).toBe('unknown');
      expect(model.priceLabel).toBe('N/A');
      expect(model.score).toBe(0);
      expect(model.latencyMs).toBe(0);
    });

    it('usa headers corretos na requisição', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({ data: [] })
      } as unknown as Response);

      const adapter = groqAdapterFactory('gsk_test_key');
      await adapter.listModels();

      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
      const [url, options] = vi.mocked(fetch).mock.calls[0];
      const headers = (options as RequestInit)?.headers as Record<string, string>;

      expect(url).toBe('https://api.groq.com/openai/v1/models');
      expect(headers['Authorization']).toBe('Bearer gsk_test_key');
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

      const adapter = groqAdapterFactory('gsk_test_key');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('retorna { ok: false, latencyMs: 3000 } quando ocorre timeout', async () => {
      vi.mocked(fetch).mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      const adapter = groqAdapterFactory('gsk_test_key');
      const result = await adapter.ping();

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(3000);
    });

    it('retorna latência fixa simulada quando apiKey é undefined', async () => {
      const adapter = groqAdapterFactory(undefined);
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBe(65); // Valor fixo do seed
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna latência fixa simulada quando apiKey é string vazia', async () => {
      const adapter = groqAdapterFactory('');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBe(65);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('ping usa headers corretos incluindo apiKey', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], object: 'list' })
      } as unknown as Response);

      const adapter = groqAdapterFactory('gsk_test_key');
      await adapter.ping();

      const [, options] = vi.mocked(fetch).mock.calls[0];
      const headers = (options as RequestInit)?.headers as Record<string, string>;

      expect(headers['Authorization']).toBe('Bearer gsk_test_key');
    });
  });
});
