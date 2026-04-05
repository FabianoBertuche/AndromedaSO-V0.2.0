/**
 * Unit tests for Ollama adapter.
 *
 * Feature: real-provider-adapters, Task 6.2
 *
 * Tests:
 * - listModels() com falha HTTP (Ollama não em execução) → retorna seed
 * - listModels() com sucesso → mapeia name para modelId e displayName
 * - ping() com sucesso → { ok: true, latencyMs: N }
 * - ping() com timeout → { ok: false, latencyMs: 3000 }
 * - URL dinâmica: requisições usam baseUrl configurado, não URL hardcoded
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ollamaAdapterFactory } from '../ollama.adapter.js';
import { listSeedModels } from '../providerCatalog.js';

describe('Ollama Adapter', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    // Limpa env var para tests determinísticos
    delete process.env.OLLAMA_BASE_URL;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OLLAMA_BASE_URL;
  });

  // ─── listModels ───────────────────────────────────────────────────────────

  describe('listModels()', () => {
    it('retorna seed data quando fetch falha com erro de rede (ECONNREFUSED)', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('ollama');

      expect(models).toEqual(seedModels);
    });

    it('retorna seed data quando fetch lança qualquer erro', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const models = await adapter.listModels();
      const seedModels = listSeedModels('ollama');

      expect(models).toEqual(seedModels);
    });

    it('mapeia name para modelId e displayName corretamente', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          models: [
            { name: 'llama3.2', modified_at: '2024-01-01T00:00:00Z', size: 12345678 },
            { name: 'qwen2.5:14b', modified_at: '2024-01-02T00:00:00Z', size: 23456789 },
            { name: 'deepseek-r1:8b', modified_at: '2024-01-03T00:00:00Z', size: 34567890 }
          ]
        })
      } as unknown as Response);

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const models = await adapter.listModels();

      // Deve incluir modelos locais + cloud seed models
      const localModels = models.filter((m) => !m.modelId.startsWith('ollama-cloud/'));

      expect(localModels.length).toBeGreaterThanOrEqual(3);

      const llama = localModels.find((m) => m.modelId === 'ollama/llama3.2');
      expect(llama).toMatchObject({
        displayName: 'llama3.2',
        contextWindow: 'unknown',
        capabilities: ['chat'],
        priceLabel: 'N/A',
        score: 0,
        latencyMs: 0
      });
    });

    it('modelos sem prefixo ollama/ recebem prefixo automaticamente', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          models: [{ name: 'codellama', modified_at: '2024-01-01T00:00:00Z', size: 12345678 }]
        })
      } as unknown as Response);

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const models = await adapter.listModels();

      const localModels = models.filter((m) => !m.modelId.startsWith('ollama-cloud/'));
      const codellama = localModels.find((m) => m.modelId === 'ollama/codellama');

      expect(codellama).toBeDefined();
      expect(codellama?.displayName).toBe('codellama');
    });

    it('merge de modelos locais com cloud seed models', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({
          models: [{ name: 'local-model', modified_at: '2024-01-01T00:00:00Z', size: 12345678 }]
        })
      } as unknown as Response);

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const models = await adapter.listModels();

      // Deve ter tanto modelos locais quanto cloud seeds
      const cloudModels = models.filter((m) => m.modelId.startsWith('ollama-cloud/'));
      const localModels = models.filter((m) => !m.modelId.startsWith('ollama-cloud/'));

      expect(localModels.length).toBeGreaterThan(0);
      expect(cloudModels.length).toBeGreaterThan(0);
    });

    it('URL configurada é usada na requisição (não hardcoded)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({ models: [] })
      } as unknown as Response);

      const customUrl = 'http://192.168.1.100:11434';
      const adapter = ollamaAdapterFactory(undefined, customUrl);
      await adapter.listModels();

      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(`${customUrl}/api/tags`);
    });

    it('usa DEFAULT_BASE_URL quando nenhum baseUrl fornecido (sem env var)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: async () => ({ models: [] })
      } as unknown as Response);

      const adapter = ollamaAdapterFactory();
      await adapter.listModels();

      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toMatch(/^http:\/\/127\.0\.0\.1:11434\/api\/tags$/);
    });
  });

  // ─── ping ────────────────────────────────────────────────────────────────

  describe('ping()', () => {
    it('retorna { ok: true, latencyMs: N } quando fetch completa com sucesso', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ models: [] })
      } as unknown as Response);

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('retorna { ok: false, latencyMs: 3000 } quando ocorre timeout', async () => {
      vi.mocked(fetch).mockRejectedValue(
        new DOMException('The user aborted a request.', 'AbortError')
      );

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const result = await adapter.ping();

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(3000);
    });

    it('retorna { ok: false, latencyMs: 3000 } quando fetch falha', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const result = await adapter.ping();

      expect(result.ok).toBe(false);
      expect(result.latencyMs).toBe(3000);
    });

    it('URL configurada é usada no ping (não hardcoded)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ models: [] })
      } as unknown as Response);

      const customUrl = 'http://ollama.local:11434';
      const adapter = ollamaAdapterFactory(undefined, customUrl);
      await adapter.ping();

      const [url] = vi.mocked(fetch).mock.calls[0];
      expect(url).toBe(`${customUrl}/api/tags`);
    });

    it('ping funciona mesmo sem apiKey (ollama não requer autenticação)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ models: [] })
      } as unknown as Response);

      // Sem apiKey - deve funcionar do mesmo jeito
      const adapter = ollamaAdapterFactory(undefined, 'http://localhost:11434');
      const result = await adapter.ping();

      expect(result.ok).toBe(true);
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(1);
    });
  });
});
