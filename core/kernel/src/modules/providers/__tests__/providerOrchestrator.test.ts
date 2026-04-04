import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ProviderOrchestratorService } from '../services/providerOrchestratorService.js';
import type { ProviderRepository } from '../domain/repositories/provider.repository.js';
import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../domain/entities/provider.entity.js';

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
});
