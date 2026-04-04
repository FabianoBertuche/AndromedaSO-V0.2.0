import type { ModelBenchmarkResult, ModelCatalogItem, TaskType } from '../entities/provider.entity';

export interface IModelCenterService {
  getCatalog(providerIdOrName: string): Promise<{
    providerId: string;
    selectedModelIds: string[];
    models: ModelCatalogItem[];
  }>;
  benchmarkModel(modelId: string, taskType: TaskType): Promise<ModelBenchmarkResult & { simulated: true }>;
  inferRoute(taskType: TaskType): Promise<{
    decision: { taskType: TaskType; selectedModel: string; score: number };
    ranked: Array<{
      modelId: string;
      displayName: string;
      contextWindow: string;
      capabilities: string[];
      priceLabel: string;
      score: number;
      latencyMs: number;
    }>;
  }>;
}
