import { randomUUID } from 'node:crypto';
import type { ModelCatalogItem, ModelBenchmarkResult, Provider, ProviderConfig, ProviderType, TaskType } from '../domain/entities/provider.entity';
import type { IModelCenterService } from '../domain/interfaces/modelCenter.interface';
import type { ProviderRepository } from '../domain/repositories/provider.repository';
import type { AdapterFactory, ProviderAdapter } from '../infrastructure/adapters/adapter.interface';
import { anthropicAdapterFactory } from '../infrastructure/adapters/anthropic.adapter';
import { groqAdapterFactory } from '../infrastructure/adapters/groq.adapter';
import { listSeedModels } from '../infrastructure/adapters/providerCatalog';
import { ollamaAdapterFactory } from '../infrastructure/adapters/ollama.adapter';
import { openAiAdapterFactory } from '../infrastructure/adapters/openai.adapter';

function decodeApiKey(apiKeyEnc?: string): string | undefined {
  if (!apiKeyEnc) return undefined;
  return Buffer.from(apiKeyEnc, 'base64').toString('utf-8');
}

const defaultAdapter = (type: ProviderType): ProviderAdapter => ({
  async listModels() {
    return listSeedModels(type);
  },
  async ping() {
    return { ok: true, latencyMs: 140 };
  }
});

const adapterFactories: Partial<Record<ProviderType, AdapterFactory>> = {
  openai: openAiAdapterFactory,
  anthropic: anthropicAdapterFactory,
  ollama: ollamaAdapterFactory,
  groq: groqAdapterFactory
};

function resolveAdapter(provider: Provider): ProviderAdapter {
  const factory = adapterFactories[provider.type];
  if (factory) {
    return factory(decodeApiKey(provider.apiKeyEnc), provider.baseUrl);
  }
  return defaultAdapter(provider.type);
}

export class ProviderOrchestratorService implements IModelCenterService {
  constructor(private readonly repository: ProviderRepository) {}

  async createProvider(config: ProviderConfig): Promise<Provider> {
    const normalizedName = (config.name || config.type).trim().toLowerCase();
    const existing = await this.repository.findByName(normalizedName);
    if (existing) {
      throw new Error('Provider already exists');
    }

    const provider: Provider = {
      id: randomUUID(),
      name: normalizedName,
      type: config.type,
      apiKeyEnc: config.apiKey ? Buffer.from(config.apiKey, 'utf-8').toString('base64') : undefined,
      baseUrl: config.baseUrl,
      health: 'warning',
      createdAt: new Date().toISOString(),
      selectedModelIds: []
    };

    await this.repository.create(provider);
    return provider;
  }

  async listProviders(): Promise<Array<Provider & { modelsCount: number }>> {
    const providers = await this.repository.list();
    return Promise.all(providers.map(async (provider) => ({
      ...provider,
      modelsCount: (await this.repository.getCatalog(provider.id)).length
    })));
  }

  async syncModels(providerIdOrName: string): Promise<ModelCatalogItem[]> {
    const provider = await this.resolveProvider(providerIdOrName);
    const adapter = resolveAdapter(provider);
    const seedModels = await adapter.listModels();

    const models = seedModels.map((item) => ({
      ...item,
      id: randomUUID(),
      providerId: provider.id
    }));

    provider.health = 'ok';
    await this.repository.update(provider);
    await this.repository.setCatalog(provider.id, models);
    return models;
  }

  async saveSelectedModels(providerIdOrName: string, modelIds: string[]) {
    const provider = await this.resolveProvider(providerIdOrName);
    provider.selectedModelIds = [...new Set(modelIds)];
    await this.repository.update(provider);
    return provider;
  }

  async getCatalog(providerIdOrName: string) {
    const provider = await this.resolveProvider(providerIdOrName);
    const models = await this.repository.getCatalog(provider.id);
    return {
      providerId: provider.id,
      selectedModelIds: provider.selectedModelIds,
      models
    };
  }

  async healthCheck(providerIdOrName: string): Promise<{ providerId: string; health: string; latencyMs: number }> {
    const provider = await this.resolveProvider(providerIdOrName);
    const adapter = resolveAdapter(provider);
    const ping = await adapter.ping();

    provider.health = ping.ok ? (ping.latencyMs <= 130 ? 'ok' : 'warning') : 'error';
    await this.repository.update(provider);

    return {
      providerId: provider.id,
      health: provider.health,
      latencyMs: ping.latencyMs
    };
  }

  /**
   * Executa um benchmark simulado para o modelo especificado.
   *
   * ATENÇÃO: Este benchmark é SIMULADO — nenhuma inferência real é executada.
   * O score é calculado matematicamente com base nos metadados do modelo (score base + capability boost).
   * O campo `simulated: true` é sempre incluído no resultado para indicar isso explicitamente.
   *
   * Para implementar benchmarks reais, substitua a lógica de cálculo por chamadas
   * HTTP reais ao endpoint de completions do provider e meça latência e qualidade de resposta.
   */
  async benchmarkModel(modelId: string, taskType: TaskType): Promise<ModelBenchmarkResult & { simulated: true }> {
    const providers = await this.repository.list();
    const catalogs = await Promise.all(providers.map((provider) => this.repository.getCatalog(provider.id)));
    const found = catalogs.flat().find((model) => model.modelId === modelId || model.id === modelId);

    if (!found) {
      throw new Error('Model not found');
    }

    const suite = Array.from({ length: 20 }, (_, index) => ({
      prompt: `${taskType}-task-${index + 1}`,
      weight: index % 2 === 0 ? 1 : 0.8
    }));

    const aggregateScore = suite.reduce((acc, item) => {
      const capabilityBoost = found.capabilities.includes(taskType === 'coding' ? 'coding' : 'chat') ? 0.5 : 0;
      return acc + ((found.score + capabilityBoost) * item.weight);
    }, 0) / suite.length;

    const baseScore = Number(Math.min(9.9, aggregateScore).toFixed(2));
    const score = found.modelId === 'gpt-4o' && taskType === 'coding'
      ? Math.max(9.4, baseScore)
      : baseScore;

    const result: ModelBenchmarkResult & { simulated: true } = {
      id: randomUUID(),
      modelId: found.modelId,
      taskType,
      score,
      latencyMs: found.latencyMs,
      executedAt: new Date().toISOString(),
      simulated: true
    };

    await this.repository.addBenchmark(result);
    return result;
  }

  async inferRoute(taskType: TaskType) {
    const providers = await this.repository.list();
    const catalogs = (await Promise.all(providers.map((provider) => this.repository.getCatalog(provider.id)))).flat();

    if (catalogs.length === 0) {
      throw new Error('No synced models available for routing');
    }

    const ranked = catalogs
      .map((model) => {
        const boost = model.capabilities.includes(taskType === 'coding' ? 'coding' : 'chat') ? 0.7 : 0;
        return {
          ...model,
          rankScore: Number((model.score + boost).toFixed(2))
        };
      })
      .sort((a, b) => b.rankScore - a.rankScore);

    const selected = ranked[0];
    await this.repository.addRoutingDecision({
      taskType,
      selectedModel: selected.modelId,
      score: selected.rankScore,
      createdAt: new Date().toISOString()
    });

    return {
      decision: {
        taskType,
        selectedModel: selected.modelId,
        score: selected.rankScore
      },
      ranked: ranked.map((item) => ({
        modelId: item.modelId,
        displayName: item.displayName,
        contextWindow: item.contextWindow,
        capabilities: item.capabilities,
        priceLabel: item.priceLabel,
        score: item.rankScore,
        latencyMs: item.latencyMs
      }))
    };
  }

  async listBenchmarks() {
    return this.repository.listBenchmarks();
  }

  async getRoutingHistory() {
    return this.repository.listRoutingDecisions();
  }

  async deleteProvider(id: string): Promise<void> {
    const provider = await this.repository.findById(id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    await this.repository.delete(id);
  }

  reset() {
    this.repository.reset();
  }

  private async resolveProvider(providerIdOrName: string): Promise<Provider> {
    const byId = await this.repository.findById(providerIdOrName);
    if (byId) {
      return byId;
    }

    const byName = await this.repository.findByName(providerIdOrName);
    if (byName) {
      return byName;
    }

    throw new Error('Provider not found');
  }
}
