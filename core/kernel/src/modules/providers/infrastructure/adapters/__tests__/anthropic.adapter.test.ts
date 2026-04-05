/**
 * Unit tests for Anthropic adapter.
 *
 * Feature: real-provider-adapters, Task 4.2
 *
 * Tests:
 * - listModels() sem apiKey → retorna seed
 * - listModels() com falha HTTP → retorna seed
 * - listModels() com sucesso → mapeia display_name para displayName
 * - ping() com sucesso → { ok: true, latencyMs: N }
 * - ping() com timeout → { ok: false, latencyMs: 3000 }
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { anthropicAdapterFactory } from '../anthropic.adapter.js';
import { listSeedModels } from '../providerCatalog.js';

describe('Anthropic Adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ─── listModels ───────────────────────────────────────────────────────────

  describe('listModels()', () => {
    it('retorna seed data quando apiKey é undefined', async () => {
      const adapter = anthropicAdapterFactory(undefined);
      const models = await adapter.listModels();
      const seedModels = listSeedModels('anthropic');

      expect(models).toEqual(seedModels);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna seed data quando apiKey é string vazia', async () => {
      const adapter = anthropicAdapterFactory('');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('anthropic');

      expect(models).toEqual(seedModels);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna seed data quando fetch falha com erro de rede', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const adapter = anthropicAdapterFactory('sk-ant-api-key');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('anthropic');

      expect(models).toEqual(seedModels);
    });

    it('retorna seed data quando fetch retorna erro HTTP', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { type: 'authentication_error', message: 'Invalid API key' } })
      } as unknown as Response);

      const adapter = anthropicAdapterFactory('sk-invalid-key');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('anthropic');

      expect(models).toEqual(seedModels);
    });

    it('mapeia display_name para displayName corretamente', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          data: [
            { id: 'claude-3-5-sonnet-20241022', display_name: 'Claude 3.5 Sonnet', type: 'model' },
            { id: 'claude-3-opus-20240229', display_name: 'Claude 3 Opus', type: 'model' },
            { id: 'claude-3-sonnet-20240229', display_name: 'Claude 3 Sonnet', type: 'model' }
          ]
        })
      } as unknown as Response);

      const adapter = anthropicAdapterFactory('sk-ant-api-key');
      const models = await adapter.listModels();

      expect(models.length).toBe(3);

      const sonnet = models.find((m) => m.modelId === 'claude-3-5-sonnet-20241022');
      expect(sonnet).toMatchObject({
        modelId: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
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
          data: [{ id: 'claude-test', display_name: 'Claude Test', type: 'model' }]
        })
      } as unknown as Response);

      const adapter = anthropicAdapterFactory('sk-ant-api-key');
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

      const adapter = anthropicAdapterFactory('sk-ant-api-key');
      await adapter.listModels();

      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
      const [url, options] = vi.mocked(fetch).mock.calls[0];
      const headers = (options as RequestInit)?.headers as Record<string, string>;

      expect(url).toBe('https://api.anthropic.com/v1/models');
      expect(headers['x-api-key']).toBe('sk-ant-api-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });
  });

  // ─── ping ────────────────────────────────────────────────────────────────

  describe('ping()', () => {
    it('retorna { ok: true, latencyMs: N } quando fetch completa com sucesso', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      } as unknown as Response);

      const adapter = anthropicAdapterFactory('sk-ant-api-key');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('retorna { ok: false, latencyMs: 3000 } quando ocorre timeout', async () => {
      vi.mocked(fetch).mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      const adapter = anthropicAdapterFactory('sk-ant-api-key');
      const result = await adapter.ping();

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(3000);
    });

    it('retorna latência fixa simulada quando apiKey é undefined', async () => {
      const adapter = anthropicAdapterFactory(undefined);
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBe(135); // Valor fixo do seed
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('retorna latência fixa simulada quando apiKey é string vazia', async () => {
      const adapter = anthropicAdapterFactory('');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBe(135);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it('ping usa headers corretos incluindo apiKey', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] })
      } as unknown as Response);

      const adapter = anthropicAdapterFactory('sk-ant-api-key');
      await adapter.ping();

      const [, options] = vi.mocked(fetch).mock.calls[0];
      const headers = (options as RequestInit)?.headers as Record<string, string>;

      expect(headers['x-api-key']).toBe('sk-ant-api-key');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });
  });
});
