import { randomUUID } from 'node:crypto';

export type CreateProviderDto = {
  name: string;
  displayName?: string;
  apiBase?: string;
  apiKey?: string;
};

export type ProviderRecord = {
  id: string;
  name: string;
  displayName: string;
  apiBase?: string;
  apiKeyEnc?: string;
  health: 'ok' | 'warning' | 'error';
  createdAt: string;
};

export type ModelCatalogItem = {
  id: string;
  providerId: string;
  modelId: string;
  displayName: string;
  capability: 'coding' | 'chat' | 'analysis';
  score: number;
  latencyMs: number;
  costUSD?: number;
};

export type RoutingDecision = {
  id: string;
  taskType: 'coding' | 'chat' | 'analysis';
  selectedModel: string;
  score: number;
  createdAt: string;
};

export type BenchmarkResult = {
  id: string;
  modelId: string;
  taskType: 'coding' | 'chat' | 'analysis';
  score: number;
  latencyMs: number;
  tokensIn: number;
  tokensOut: number;
  costUSD?: number;
  success: boolean;
  executedAt: string;
};

const MODEL_TEMPLATE: Array<Omit<ModelCatalogItem, 'id' | 'providerId'>> = [
  {
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    capability: 'coding',
    score: 9.4,
    latencyMs: 120,
    costUSD: 0.02
  },
  {
    modelId: 'claude-3.7-sonnet',
    displayName: 'Claude 3.7 Sonnet',
    capability: 'analysis',
    score: 8.8,
    latencyMs: 140,
    costUSD: 0.025
  },
  {
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    capability: 'chat',
    score: 8.1,
    latencyMs: 85,
    costUSD: 0.005
  }
];

class ModelProviderService {
  private readonly providers = new Map<string, ProviderRecord>();
  private readonly providersByName = new Map<string, string>();
  private readonly modelCatalog = new Map<string, ModelCatalogItem[]>();
  private readonly benchmarkResults: BenchmarkResult[] = [];
  private readonly routingHistory: RoutingDecision[] = [];

  reset() {
    this.providers.clear();
    this.providersByName.clear();
    this.modelCatalog.clear();
    this.benchmarkResults.length = 0;
    this.routingHistory.length = 0;
  }

  async createProvider(data: CreateProviderDto): Promise<ProviderRecord> {
    const name = data.name.trim().toLowerCase();
    if (this.providersByName.has(name)) {
      throw new Error('Provider already exists');
    }

    const provider: ProviderRecord = {
      id: randomUUID(),
      name,
      displayName: data.displayName?.trim() || data.name.trim(),
      apiBase: data.apiBase,
      apiKeyEnc: data.apiKey ? this.encrypt(data.apiKey) : undefined,
      health: 'warning',
      createdAt: new Date().toISOString()
    };

    this.providers.set(provider.id, provider);
    this.providersByName.set(provider.name, provider.id);
    return provider;
  }

  async syncModels(providerIdOrName: string): Promise<ModelCatalogItem[]> {
    const provider = this.resolveProvider(providerIdOrName);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const items = MODEL_TEMPLATE.map((template) => ({
      id: randomUUID(),
      providerId: provider.id,
      ...template
    }));

    this.modelCatalog.set(provider.id, items);
    provider.health = 'ok';
    return items;
  }

  async healthCheck(providerIdOrName: string): Promise<{ providerId: string; health: string; latencyMs: number }> {
    const provider = this.resolveProvider(providerIdOrName);
    if (!provider) {
      throw new Error('Provider not found');
    }

    const models = this.modelCatalog.get(provider.id) ?? [];
    const latencyMs = models.length > 0
      ? Math.round(models.reduce((sum, model) => sum + model.latencyMs, 0) / models.length)
      : 300;

    provider.health = latencyMs <= 150 ? 'ok' : latencyMs <= 280 ? 'warning' : 'error';

    return {
      providerId: provider.id,
      health: provider.health,
      latencyMs
    };
  }

  async benchmarkModel(modelId: string, taskType: 'coding' | 'chat' | 'analysis'): Promise<BenchmarkResult> {
    const model = this.findModel(modelId);
    if (!model) {
      throw new Error('Model not found');
    }

    const scoreBoost = taskType === model.capability ? 0.6 : 0.1;
    const score = Number(Math.min(10, model.score + scoreBoost).toFixed(2));
    const latencyMs = model.latencyMs + (taskType === 'analysis' ? 20 : 0);

    const result: BenchmarkResult = {
      id: randomUUID(),
      modelId,
      taskType,
      score,
      latencyMs,
      tokensIn: 800,
      tokensOut: 1200,
      costUSD: model.costUSD,
      success: true,
      executedAt: new Date().toISOString()
    };

    this.benchmarkResults.push(result);
    return result;
  }

  inferRoute(taskType: 'coding' | 'chat' | 'analysis') {
    const models = [...this.modelCatalog.values()].flat();
    const ranked = models
      .map((model) => ({
        model,
        rankScore: model.score + (model.capability === taskType ? 0.7 : 0)
      }))
      .sort((a, b) => b.rankScore - a.rankScore);

    if (ranked.length === 0) {
      throw new Error('No synced models available for routing');
    }

    const selected = ranked[0];
    const decision: RoutingDecision = {
      id: randomUUID(),
      taskType,
      selectedModel: selected.model.modelId,
      score: Number(selected.rankScore.toFixed(2)),
      createdAt: new Date().toISOString()
    };

    this.routingHistory.push(decision);

    return {
      decision,
      ranked: ranked.map((item) => ({
        modelId: item.model.modelId,
        displayName: item.model.displayName,
        score: Number(item.rankScore.toFixed(2)),
        latencyMs: item.model.latencyMs,
        costUSD: item.model.costUSD
      }))
    };
  }

  getRoutingHistory() {
    return [...this.routingHistory].reverse();
  }

  listProviders() {
    return [...this.providers.values()].map((provider) => ({
      ...provider,
      modelsCount: (this.modelCatalog.get(provider.id) ?? []).length
    }));
  }

  getBenchmarks() {
    return [...this.benchmarkResults].reverse();
  }

  private resolveProvider(providerIdOrName: string): ProviderRecord | null {
    const byId = this.providers.get(providerIdOrName);
    if (byId) {
      return byId;
    }

    const providerId = this.providersByName.get(providerIdOrName.toLowerCase());
    if (!providerId) {
      return null;
    }

    return this.providers.get(providerId) ?? null;
  }

  private findModel(modelId: string): ModelCatalogItem | null {
    for (const models of this.modelCatalog.values()) {
      const found = models.find((item) => item.modelId === modelId || item.id === modelId);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private encrypt(value: string): string {
    return Buffer.from(value, 'utf-8').toString('base64');
  }
}

export const modelProviderService = new ModelProviderService();
