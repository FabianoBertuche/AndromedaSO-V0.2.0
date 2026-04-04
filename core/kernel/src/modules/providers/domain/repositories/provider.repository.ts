import type { ModelBenchmarkResult, ModelCatalogItem, Provider } from '../entities/provider.entity';

export interface ProviderRepository {
  create(provider: Provider): Promise<Provider>;
  update(provider: Provider): Promise<Provider>;
  findById(id: string): Promise<Provider | null>;
  findByName(name: string): Promise<Provider | null>;
  list(): Promise<Provider[]>;
  setCatalog(providerId: string, models: ModelCatalogItem[]): Promise<void>;
  getCatalog(providerId: string): Promise<ModelCatalogItem[]>;
  addBenchmark(result: ModelBenchmarkResult): Promise<void>;
  listBenchmarks(): Promise<ModelBenchmarkResult[]>;
  addRoutingDecision(decision: { taskType: string; selectedModel: string; score: number; createdAt: string }): Promise<void>;
  listRoutingDecisions(): Promise<Array<{ taskType: string; selectedModel: string; score: number; createdAt: string }>>;
  reset(): Promise<void>;
  delete(id: string): Promise<void>;
}
