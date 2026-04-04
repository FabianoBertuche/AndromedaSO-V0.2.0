import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../../domain/entities/provider.entity';
import type { ProviderRepository } from '../../domain/repositories/provider.repository';

export class ProviderRepositoryMemory implements ProviderRepository {
  private readonly providers = new Map<string, Provider>();
  private readonly providersByName = new Map<string, string>();
  private readonly catalogs = new Map<string, ModelCatalogItem[]>();
  private readonly benchmarks: ModelBenchmarkResult[] = [];
  private readonly routingDecisions: Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }> = [];

  async create(provider: Provider): Promise<Provider> {
    this.providers.set(provider.id, provider);
    this.providersByName.set(provider.name, provider.id);
    return provider;
  }

  async update(provider: Provider): Promise<Provider> {
    this.providers.set(provider.id, provider);
    this.providersByName.set(provider.name, provider.id);
    return provider;
  }

  async findById(id: string): Promise<Provider | null> {
    return this.providers.get(id) ?? null;
  }

  async findByName(name: string): Promise<Provider | null> {
    const id = this.providersByName.get(name.toLowerCase());
    return id ? this.providers.get(id) ?? null : null;
  }

  async list(): Promise<Provider[]> {
    return [...this.providers.values()];
  }

  async setCatalog(providerId: string, models: ModelCatalogItem[]): Promise<void> {
    this.catalogs.set(providerId, models);
  }

  async getCatalog(providerId: string): Promise<ModelCatalogItem[]> {
    return this.catalogs.get(providerId) ?? [];
  }

  async addBenchmark(result: ModelBenchmarkResult): Promise<void> {
    this.benchmarks.unshift(result);
  }

  async listBenchmarks(): Promise<ModelBenchmarkResult[]> {
    return [...this.benchmarks];
  }

  async addRoutingDecision(decision: { taskType: string; selectedModel: string; score: number; createdAt: string }): Promise<void> {
    this.routingDecisions.unshift(decision);
  }

  async listRoutingDecisions(): Promise<Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }>> {
    return [...this.routingDecisions];
  }

  async delete(id: string): Promise<void> {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error('Provider not found');
    }
    this.providers.delete(id);
    this.providersByName.delete(provider.name);
    this.catalogs.delete(id);
  }

  async reset(): Promise<void> {
    this.providers.clear();
    this.providersByName.clear();
    this.catalogs.clear();
    this.benchmarks.length = 0;
    this.routingDecisions.length = 0;
  }
}

export const providerRepository = new ProviderRepositoryMemory();
