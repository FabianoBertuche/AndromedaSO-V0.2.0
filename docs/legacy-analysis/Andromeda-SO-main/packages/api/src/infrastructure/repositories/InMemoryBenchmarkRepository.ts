import { BenchmarkResult, IBenchmarkRepository } from "@andromeda/core";

export class InMemoryBenchmarkRepository implements IBenchmarkRepository {
    private results: Map<string, any> = new Map();

    async save(result: BenchmarkResult): Promise<void> {
        this.results.set(result.getId(), result.toJSON());
    }

    async findById(id: string): Promise<BenchmarkResult | null> {
        const data = this.results.get(id);
        if (!data) return null;
        return new BenchmarkResult(data);
    }

    async findByModelId(modelId: string): Promise<BenchmarkResult[]> {
        return Array.from(this.results.values())
            .filter(data => data.modelId === modelId)
            .map(data => new BenchmarkResult(data));
    }
}
