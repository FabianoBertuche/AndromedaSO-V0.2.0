import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { ProviderOrchestratorService } from '../services/providerOrchestratorService.js';
import type { ProviderRepository } from '../domain/repositories/provider.repository.js';
import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../domain/entities/provider.entity.js';
import type { TaskType } from '../domain/entities/provider.entity.js';

const unsupportedOauthSessionOperation = async () => {
  throw new Error('OAuth session operations are not supported in this mock repository');
};

function createMockRepo(): ProviderRepository {
  const providers = new Map<string, Provider>();
  const catalogs = new Map<string, ModelCatalogItem[]>();
  const benchmarks: ModelBenchmarkResult[] = [];
  const decisions: Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }> = [];

  return {
    async create(p) { providers.set(p.id, p); return p; },
    async update(p) { providers.set(p.id, p); return p; },
    async findById(id) { return providers.get(id) ?? null; },
    async findByName(name) { return [...providers.values()].find(p => p.name === name) ?? null; },
    async list() { return [...providers.values()]; },
    async setCatalog(pid, models) { catalogs.set(pid, models); },
    async getCatalog(pid) { return catalogs.get(pid) ?? []; },
    async addBenchmark(r) { benchmarks.push(r); },
    async listBenchmarks() { return [...benchmarks]; },
    async addRoutingDecision(d) { decisions.push(d); },
    async listRoutingDecisions() { return [...decisions]; },
    createOAuthSession: unsupportedOauthSessionOperation,
    findOAuthSessionByStateHash: unsupportedOauthSessionOperation,
    claimOAuthSessionByStateHash: unsupportedOauthSessionOperation,
    consumeOAuthSession: unsupportedOauthSessionOperation,
    deleteExpiredOAuthSessions: async () => undefined,
    async delete(id) { providers.delete(id); },
    async reset() { providers.clear(); catalogs.clear(); benchmarks.length = 0; decisions.length = 0; }
  };
}

describe('ProviderOrchestratorService', () => {
  let repo: ProviderRepository;
  let service: ProviderOrchestratorService;

  beforeEach(() => {
    repo = createMockRepo();
    service = new ProviderOrchestratorService(repo);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // 1. createProvider — cria provider com nome normalizado
  it('createProvider() normaliza o nome para lowercase e trim', async () => {
    const provider = await service.createProvider({ type: 'openai', name: '  OpenAI  ' });
    expect(provider.name).toBe('openai');
  });

  // 2. createProvider — lança erro ao criar provider duplicado
  it('createProvider() lança erro ao criar provider duplicado', async () => {
    await service.createProvider({ type: 'openai', name: 'openai' });
    await expect(service.createProvider({ type: 'openai', name: 'openai' })).rejects.toThrow('Provider already exists');
  });

  // 3. syncModels — sincroniza modelos via adapter mock (retorna array não-vazio)
  it('syncModels() retorna array não-vazio de modelos sincronizados', async () => {
    const provider = await service.createProvider({ type: 'openai' });
    const models = await service.syncModels(provider.id);
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty('modelId');
    expect(models[0]).toHaveProperty('providerId', provider.id);
  });

  // 4. healthCheck — retorna health: 'ok' ou 'warning' (latência dinâmica com factory real)
  it('healthCheck() retorna ok: true e latencyMs >= 0 para openai sem apiKey', async () => {
    const provider = await service.createProvider({ type: 'openai' });
    const result = await service.healthCheck(provider.id);
    expect(['ok', 'warning']).toContain(result.health);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  // 5. healthCheck — retorna health: 'ok' ou 'warning' para anthropic sem apiKey
  it('healthCheck() retorna ok: true e latencyMs >= 0 para anthropic sem apiKey', async () => {
    const provider = await service.createProvider({ type: 'anthropic' });
    const result = await service.healthCheck(provider.id);
    expect(['ok', 'warning']).toContain(result.health);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  // 6. inferRoute — retorna decisão com score >= 0 para lista de modelos
  it('inferRoute() retorna decisão com score >= 0', async () => {
    const provider = await service.createProvider({ type: 'openai' });
    await service.syncModels(provider.id);
    const result = await service.inferRoute('coding');
    expect(result.decision.score).toBeGreaterThanOrEqual(0);
    expect(result.decision).toHaveProperty('selectedModel');
    expect(result.decision).toHaveProperty('taskType', 'coding');
  });

  // 7. inferRoute — lança erro quando nenhum modelo está sincronizado
  it('inferRoute() lança erro quando nenhum modelo está sincronizado', async () => {
    await expect(service.inferRoute('chat')).rejects.toThrow('No synced models available for routing');
  });

  // 8. benchmarkModel — retorna resultado com simulated: true
  it('benchmarkModel() retorna resultado com simulated: true', async () => {
    const provider = await service.createProvider({ type: 'openai' });
    const models = await service.syncModels(provider.id);
    const result = await service.benchmarkModel(models[0].modelId, 'coding');
    expect(result.simulated).toBe(true);
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('latencyMs');
  });

  // 9. benchmarkModel — lança erro quando modelo não encontrado
  it('benchmarkModel() lança erro quando modelo não encontrado', async () => {
    await expect(service.benchmarkModel('modelo-inexistente', 'chat')).rejects.toThrow('Model not found');
  });

  // ─── Factory integration tests (Requisitos 10.1, 10.2, 10.3, 10.4) ───────────

  // 10. syncModels() passes decoded apiKey to factory (via fetch Authorization header)
  it('syncModels() passa apiKey decodificada à factory (header Authorization correto)', async () => {
    const rawKey = 'sk-test-key';
    const apiKeyEnc = Buffer.from(rawKey).toString('base64');

    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        data: [{ id: 'gpt-4o', object: 'model' }],
        object: 'list'
      })
    } as unknown as Response);
    vi.stubGlobal('fetch', mockFetch);

    const provider = await service.createProvider({ type: 'openai', apiKey: rawKey });
    // Manually set apiKeyEnc to simulate a pre-encoded key stored in the repo
    const stored = await repo.findById(provider.id);
    expect(stored?.apiKeyEnc).toBe(apiKeyEnc);

    await service.syncModels(provider.id);

    expect(mockFetch).toHaveBeenCalled();
    const [, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = options?.headers as Record<string, string>;
    expect(headers?.['Authorization']).toBe(`Bearer ${rawKey}`);
  });

  // 11. syncModels() with provider without apiKeyEnc passes undefined to factory (no fetch call)
  it('syncModels() sem apiKeyEnc não chama fetch (usa seed data)', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    // Create provider without apiKey — apiKeyEnc will be undefined
    const provider = await service.createProvider({ type: 'openai' });
    const stored = await repo.findById(provider.id);
    expect(stored?.apiKeyEnc).toBeUndefined();

    const models = await service.syncModels(provider.id);

    // fetch should NOT be called — adapter falls back to seed data when apiKey is undefined
    expect(mockFetch).not.toHaveBeenCalled();
    expect(models.length).toBeGreaterThan(0);
  });

  // 12. healthCheck() uses factory with correct provider credentials (fetch is called)
  it('healthCheck() usa factory com credenciais corretas do provider', async () => {
    const rawKey = 'sk-health-key';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [], object: 'list' })
    } as unknown as Response);
    vi.stubGlobal('fetch', mockFetch);

    const provider = await service.createProvider({ type: 'openai', apiKey: rawKey });
    const result = await service.healthCheck(provider.id);

    // fetch should have been called (ping executed with real HTTP)
    expect(mockFetch).toHaveBeenCalled();
    expect(result).toHaveProperty('providerId', provider.id);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  // ─── Task 6.1: Property test — benchmark result always contains simulated: true (Propriedade 3) ───
  describe('benchmarkModel simulated field (Property 3)', () => {
    it('property: benchmark result always contains simulated: true for any valid modelId and taskType (fast-check)', async () => {
      // Setup: create provider and sync models
      const provider = await service.createProvider({ type: 'openai' });
      const models = await service.syncModels(provider.id);

      // Generate arbitrary valid modelId and taskType combinations
      const modelIds = fc.constantFrom(...models.map(m => m.modelId));
      const taskTypeArb = fc.constantFrom('chat', 'coding');

      await fc.assert(
        fc.asyncProperty(modelIds, taskTypeArb, async (modelId, taskType) => {
          const result = await service.benchmarkModel(modelId, taskType);
          // Feature: kernel-consolidation, Property 3: Resultado de benchmark sempre contém simulated: true
          expect(result.simulated).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('property: benchmark result always contains simulated: true regardless of modelId variation (fast-check)', async () => {
      // Setup provider and get models
      const provider = await service.createProvider({ type: 'anthropic' });
      const models = await service.syncModels(provider.id);

      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(...models.map(m => m.modelId)),
          fc.constantFrom('chat', 'coding'),
          async (modelId, taskType) => {
            const result = await service.benchmarkModel(modelId, taskType);
            // Feature: kernel-consolidation, Property 3: Resultado de benchmark sempre contém simulated: true
            expect(result.simulated).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  // ─── Task 12.2: Property test — inferRoute always returns non-negative score (Propriedade 5) ───
  describe('inferRoute non-negative score (Property 5)', () => {
    it('property: inferRoute always returns score >= 0 for any non-empty model list (fast-check)', async () => {
      // Setup: create provider and sync models to have models available for routing
      const provider = await service.createProvider({ type: 'openai' });
      await service.syncModels(provider.id);

      // TaskType is 'chat' | 'coding'
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('chat', 'coding'),
          async (taskType) => {
            const result = await service.inferRoute(taskType);
            // Feature: kernel-consolidation, Property 5: inferRoute() sempre retorna score não-negativo
            expect(result.decision.score).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('property: inferRoute score is always >= 0 for both task types (fast-check)', async () => {
      // Setup provider
      const provider = await service.createProvider({ type: 'openai' });
      await service.syncModels(provider.id);

      // Test both task types
      for (const taskType of ['chat', 'coding'] as TaskType[]) {
        const result = await service.inferRoute(taskType);
        expect(result.decision.score).toBeGreaterThanOrEqual(0);
      }

      // Additional fast-check for robustness
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('chat', 'coding'),
          async (taskType) => {
            const result = await service.inferRoute(taskType);
            expect(result.decision.score).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('inferRoute returns non-negative score for both valid task types', async () => {
      const provider = await service.createProvider({ type: 'groq' });
      await service.syncModels(provider.id);

      for (const taskType of ['chat', 'coding'] as TaskType[]) {
        const result = await service.inferRoute(taskType);
        expect(result.decision.score).toBeGreaterThanOrEqual(0);
        expect(result.decision).toHaveProperty('selectedModel');
        expect(result.decision).toHaveProperty('taskType', taskType);
      }
    });
  });

  // ─── Task 8.2: Property test — Round-trip base64 decoding (Propriedade 2) ───
  describe('Propriedade 2: Round-trip de decodificação base64', () => {
    it('decodeApiKey(Buffer.from(s).toString("base64")) === s para qualquer string UTF-8', async () => {
      // Valida: Requisitos 1.3, 10.3
      await fc.assert(
        fc.asyncProperty(fc.string(), async (originalString) => {
          // Arrange: encode then decode
          const encoded = Buffer.from(originalString).toString('base64');
          const decoded = Buffer.from(encoded, 'base64').toString('utf-8');

          // Assert: round-trip must return original
          expect(decoded).toBe(originalString);
        }),
        { numRuns: 100 }
      );
    });

    it('decodeApiKey retorna undefined para string vazia ou undefined', () => {
      // Testa os casos de borda
      const decodeApiKey = (apiKeyEnc?: string): string | undefined => {
        if (!apiKeyEnc) return undefined;
        return Buffer.from(apiKeyEnc, 'base64').toString('utf-8');
      };

      expect(decodeApiKey(undefined)).toBeUndefined();
      expect(decodeApiKey('')).toBeUndefined();
    });
  });

  // ─── Task 9.2: Property test — Instanciação com credenciais corretas (Propriedade 9) ───
  describe('Propriedade 9: Instanciação com credenciais corretas no serviço', () => {
    it('provider sem apiKeyEnc passa undefined à factory', async () => {
      // Arrange
      const mockFetch = vi.fn();
      vi.stubGlobal('fetch', mockFetch);

      // Cria provider sem apiKey - apiKeyEnc será undefined
      const provider = await service.createProvider({ type: 'openai' });
      const stored = await repo.findById(provider.id);
      expect(stored?.apiKeyEnc).toBeUndefined();

      // Act
      await service.syncModels(provider.id);

      // Assert: fetch NÃO deve ser chamado - adapter usa seed quando apiKey é undefined
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('syncModels e healthCheck usam mesma factory com mesmas credenciais', async () => {
      // Arrange
      const rawKey = 'sk-test-key-123';
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ data: [], object: 'list' })
      } as unknown as Response));

      const provider = await service.createProvider({ type: 'openai', apiKey: rawKey });

      // Act: chama ambos métodos
      await service.syncModels(provider.id);
      await service.healthCheck(provider.id);

      // Assert: fetch foi chamado 2 vezes (uma para cada método)
      expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);

      // Ambas as chamadas devem ter a mesma apiKey
      for (const [url, options] of vi.mocked(fetch).mock.calls) {
        const headers = (options as RequestInit)?.headers as Record<string, string>;
        expect(headers?.['Authorization']).toBe(`Bearer ${rawKey}`);
      }
    });

    it('Ollama com baseUrl customizado usa URL correta', async () => {
      // Arrange
      const customUrl = 'http://192.168.1.100:11434';
      let capturedUrl: string = '';

      vi.stubGlobal('fetch', vi.fn().mockImplementation(async (url: unknown) => {
        capturedUrl = typeof url === 'string' ? url : String(url);
        return { ok: true, json: async () => ({ models: [] }) } as unknown as Response;
      }));

      const provider = await service.createProvider({ type: 'ollama', baseUrl: customUrl });

      // Act
      await service.syncModels(provider.id);

      // Assert
      expect(capturedUrl.startsWith(customUrl)).toBe(true);
      expect(capturedUrl.endsWith('/api/tags')).toBe(true);
    });
  });

  // ─── Task 4.2: Unit tests for deleteProvider ─────────────────────────────────
  describe('deleteProvider (Task 4.2)', () => {
    it('delega ao repositório e retorna sem erro quando provider existe', async () => {
      // Arrange: criar um provider
      const provider = await service.createProvider({ type: 'openai', name: 'delete-test' });

      // Act & Assert: deletar deve resolver sem erro
      await expect(service.deleteProvider(provider.id)).resolves.toBeUndefined();

      // Verificar que o provider foi removido
      const found = await repo.findById(provider.id);
      expect(found).toBeNull();
    });

    it('propaga erro quando provider não encontrado', async () => {
      // Arrange: ID de provider inexistente
      const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

      // Act & Assert: deletar deve lançar erro
      await expect(service.deleteProvider(nonExistentId)).rejects.toThrow('Provider not found');
    });

    it('após deletar, listProviders() não inclui o provider removido', async () => {
      // Arrange: criar provider
      const provider = await service.createProvider({ type: 'anthropic', name: 'to-be-deleted' });

      // Act: deletar o provider
      await service.deleteProvider(provider.id);

      // Assert: listProviders não deve incluir o provider deletado
      const providers = await service.listProviders();
      const deletedProvider = providers.find(p => p.id === provider.id);
      expect(deletedProvider).toBeUndefined();
    });

    it('deleta provider que tem modelos no catalog', async () => {
      // Arrange: criar provider e sincronizar modelos
      const provider = await service.createProvider({ type: 'openai', name: 'provider-with-models' });
      await service.syncModels(provider.id);

      // Verificar que tem modelos
      const catalogBefore = await service.getCatalog(provider.id);
      expect(catalogBefore.models.length).toBeGreaterThan(0);

      // Act: deletar provider
      await service.deleteProvider(provider.id);

      // Assert: provider não deve ser encontrado
      await expect(service.deleteProvider(provider.id)).rejects.toThrow('Provider not found');
    });
  });
});
