import { BenchmarkResult } from "./BenchmarkResult";

export interface IBenchmarkRepository {
    save(result: BenchmarkResult): Promise<void>;
    findById(id: string): Promise<BenchmarkResult | null>;
    findByModelId(modelId: string): Promise<BenchmarkResult[]>;
}
