export interface Provider {
  id: string;
  name: string;
  displayName: string;
  health: string;
  modelsCount: number;
}

export interface ModelBenchmark {
  modelId: string;
  taskType: string;
  score: number;
  latencyMs: number;
}
