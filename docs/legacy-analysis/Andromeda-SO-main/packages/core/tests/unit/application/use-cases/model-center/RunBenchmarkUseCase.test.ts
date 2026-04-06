import { describe, expect, it, vi } from "vitest";
import { RunBenchmarkUseCase } from "../../../../../src/application/use-cases/model-center/RunBenchmarkUseCase";
import { BenchmarkResult } from "../../../../../src/domain/benchmark/BenchmarkResult";
import { IBenchmarkRepository } from "../../../../../src/domain/benchmark/IBenchmarkRepository";
import { Capability } from "../../../../../src/domain/model/Capability";
import { IModelRepository } from "../../../../../src/domain/model/IModelRepository";
import { ModelCatalogItem } from "../../../../../src/domain/model/ModelCatalogItem";
import { IProviderAdapter } from "../../../../../src/domain/provider/IProviderAdapter";
import { IProviderRepository } from "../../../../../src/domain/provider/IProviderRepository";
import { Provider } from "../../../../../src/domain/provider/Provider";

class InMemoryBenchmarkRepository implements IBenchmarkRepository {
    private readonly results = new Map<string, BenchmarkResult>();

    async save(result: BenchmarkResult): Promise<void> {
        this.results.set(result.getId(), result);
    }

    async findById(id: string): Promise<BenchmarkResult | null> {
        return this.results.get(id) ?? null;
    }

    async findByModelId(modelId: string): Promise<BenchmarkResult[]> {
        return Array.from(this.results.values()).filter(result => result.getModelId() === modelId);
    }
}

class InMemoryModelRepository implements IModelRepository {
    private readonly models = new Map<string, ModelCatalogItem>();

    async save(model: ModelCatalogItem): Promise<void> {
        this.models.set(model.getId(), new ModelCatalogItem(model.toJSON()));
    }

    async findById(id: string): Promise<ModelCatalogItem | null> {
        const model = this.models.get(id);
        return model ? new ModelCatalogItem(model.toJSON()) : null;
    }

    async findByProvider(providerId: string): Promise<ModelCatalogItem[]> {
        return Array.from(this.models.values())
            .filter(model => model.getProviderId() === providerId)
            .map(model => new ModelCatalogItem(model.toJSON()));
    }

    async findByExternalId(externalId: string): Promise<ModelCatalogItem | null> {
        const model = Array.from(this.models.values()).find(item => item.getExternalModelId() === externalId);
        return model ? new ModelCatalogItem(model.toJSON()) : null;
    }

    async findAll(): Promise<ModelCatalogItem[]> {
        return Array.from(this.models.values()).map(model => new ModelCatalogItem(model.toJSON()));
    }

    async delete(id: string): Promise<void> {
        this.models.delete(id);
    }
}

class InMemoryProviderRepository implements IProviderRepository {
    private readonly providers = new Map<string, Provider>();

    async save(provider: Provider): Promise<void> {
        this.providers.set(provider.getId(), new Provider(provider.toJSON()));
    }

    async findById(id: string): Promise<Provider | null> {
        const provider = this.providers.get(id);
        return provider ? new Provider(provider.toJSON()) : null;
    }

    async findAll(): Promise<Provider[]> {
        return Array.from(this.providers.values()).map(provider => new Provider(provider.toJSON()));
    }

    async delete(id: string): Promise<void> {
        this.providers.delete(id);
    }
}

function createProviderAdapter(overrides: Partial<IProviderAdapter> = {}): IProviderAdapter {
    return {
        healthCheck: vi.fn(),
        listModels: vi.fn(),
        pullModel: vi.fn(),
        pushModel: vi.fn(),
        createModel: vi.fn(),
        deleteModel: vi.fn(),
        copyModel: vi.fn(),
        showModelInfo: vi.fn(),
        listRunningModels: vi.fn(),
        generate: vi.fn(),
        chat: vi.fn(),
        embed: vi.fn(),
        getVersion: vi.fn(),
        ...overrides,
    };
}

describe("RunBenchmarkUseCase", () => {
    it("executes a real structured-output benchmark, validates JSON and persists the score", async () => {
        const benchmarkRepository = new InMemoryBenchmarkRepository();
        const modelRepository = new InMemoryModelRepository();
        const providerRepository = new InMemoryProviderRepository();

        const provider = new Provider({
            id: "provider-1",
            name: "Remote Ollama",
            type: "ollama",
            baseUrl: "https://ollama.example.com",
            enabled: true,
        });
        await providerRepository.save(provider);

        const model = new ModelCatalogItem({
            id: "model-1",
            providerId: provider.getId(),
            externalModelId: "qwen2.5:latest",
            displayName: "Qwen 2.5",
            locality: "cloud",
            capabilities: [Capability.CHAT, Capability.STRUCTURED_OUTPUT],
            enabled: true,
            health: "ok",
            scores: { overall: 5 },
            metrics: { avgLatencyMs: 400, avgTokensIn: 100, avgTokensOut: 40 },
            pricing: { inputPer1M: 0.6, outputPer1M: 1.8, currency: "USD", source: "official" },
        });
        await modelRepository.save(model);

        const adapter = createProviderAdapter({
            generate: vi.fn().mockResolvedValue({
                response: '{"language":"pt-BR","summary":"Ada Lovelace"}',
                prompt_eval_count: 128,
                eval_count: 24,
            }),
        });

        const useCase = new RunBenchmarkUseCase(
            benchmarkRepository,
            modelRepository,
            providerRepository,
            adapter
        );

        const result = await useCase.execute({
            modelId: model.getId(),
            suite: "Structured JSON",
            taskType: "structured-output",
        });

        expect(adapter.generate).toHaveBeenCalledWith(
            expect.objectContaining({ id: provider.getId() }),
            expect.objectContaining({
                model: model.getExternalModelId(),
                format: "json",
            })
        );

        expect(result.toJSON()).toMatchObject({
            modelId: model.getId(),
            taskType: "structured_output",
            success: true,
            tokensIn: 128,
            tokensOut: 24,
        });
        expect(result.getScore()).toBeGreaterThanOrEqual(8);

        const updatedModel = await modelRepository.findById(model.getId());
        expect(updatedModel?.getScores().structured_output).toBe(result.getScore());
        expect(updatedModel?.getScores().overall).toBeDefined();
        expect(updatedModel?.toJSON().metrics?.avgLatencyMs).toBeGreaterThanOrEqual(0);
        expect(updatedModel?.toJSON().metrics?.avgTokensIn).toBe(128);
        expect(updatedModel?.toJSON().metrics?.avgTokensOut).toBe(24);
    });

    it("fails the structured-output benchmark when the provider does not return valid JSON", async () => {
        const benchmarkRepository = new InMemoryBenchmarkRepository();
        const modelRepository = new InMemoryModelRepository();
        const providerRepository = new InMemoryProviderRepository();

        const provider = new Provider({
            id: "provider-2",
            name: "Remote Ollama",
            type: "ollama",
            baseUrl: "https://ollama.example.com",
            enabled: true,
        });
        await providerRepository.save(provider);

        const model = new ModelCatalogItem({
            id: "model-2",
            providerId: provider.getId(),
            externalModelId: "llama3.1:latest",
            displayName: "Llama 3.1",
            locality: "cloud",
            capabilities: [Capability.CHAT, Capability.STRUCTURED_OUTPUT],
            enabled: true,
            health: "ok",
            scores: {},
        });
        await modelRepository.save(model);

        const adapter = createProviderAdapter({
            generate: vi.fn().mockResolvedValue({
                response: "this is not json",
            }),
        });

        const useCase = new RunBenchmarkUseCase(
            benchmarkRepository,
            modelRepository,
            providerRepository,
            adapter
        );

        const result = await useCase.execute({
            modelId: model.getId(),
            suite: "Structured JSON",
            taskType: "structured-output",
        });

        expect(result.toJSON()).toMatchObject({
            taskType: "structured_output",
            success: false,
        });
        expect(result.getScore()).toBe(0);
        expect(String(result.toJSON().notes)).toContain("JSON");

        const updatedModel = await modelRepository.findById(model.getId());
        expect(updatedModel?.getScores().structured_output).toBe(0);
    });
});
