import { describe, expect, it } from "vitest";
import { Capability } from "../../../../../src/domain/model/Capability";
import { IModelRepository } from "../../../../../src/domain/model/IModelRepository";
import { ModelCatalogItem } from "../../../../../src/domain/model/ModelCatalogItem";
import { IRoutingDecisionRepository } from "../../../../../src/domain/router/IRoutingDecisionRepository";
import { RoutingDecision } from "../../../../../src/domain/router/RoutingDecision";
import { RouteTaskUseCase } from "../../../../../src/application/use-cases/model-center/RouteTaskUseCase";

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

class InMemoryRoutingDecisionRepository implements IRoutingDecisionRepository {
    private readonly decisions = new Map<string, RoutingDecision>();

    async save(decision: RoutingDecision): Promise<void> {
        this.decisions.set(decision.getId(), new RoutingDecision(decision.toJSON()));
    }

    async findById(id: string): Promise<RoutingDecision | null> {
        return this.decisions.get(id) ?? null;
    }

    async findByTaskId(taskId: string): Promise<RoutingDecision[]> {
        return Array.from(this.decisions.values()).filter(decision => decision.getTaskId() === taskId);
    }

    async getRecentDecisions(limit: number): Promise<RoutingDecision[]> {
        return Array.from(this.decisions.values()).slice(0, limit);
    }
}

describe("RouteTaskUseCase", () => {
    it("uses the configured profile to prefer quality when no budget is enforced", async () => {
        const modelRepository = new InMemoryModelRepository();
        const decisionRepository = new InMemoryRoutingDecisionRepository();

        const premium = new ModelCatalogItem({
            id: "premium-model",
            providerId: "provider-a",
            externalModelId: "deepseek-coder-v3",
            displayName: "DeepSeek Coder",
            locality: "cloud",
            capabilities: [Capability.CODING],
            enabled: true,
            health: "ok",
            scores: { coding: 9.5, overall: 9.2 },
            metrics: { avgLatencyMs: 420, avgTokensIn: 4000, avgTokensOut: 1200 },
            pricing: { inputPer1M: 35, outputPer1M: 55, currency: "USD", source: "official" },
        });

        const budget = new ModelCatalogItem({
            id: "budget-model",
            providerId: "provider-b",
            externalModelId: "qwen-coder-2.5",
            displayName: "Qwen Coder",
            locality: "cloud",
            capabilities: [Capability.CODING],
            enabled: true,
            health: "ok",
            scores: { coding: 7.2, overall: 7 },
            metrics: { avgLatencyMs: 350, avgTokensIn: 4000, avgTokensOut: 1200 },
            pricing: { inputPer1M: 3, outputPer1M: 8, currency: "USD", source: "official" },
        });

        await modelRepository.save(premium);
        await modelRepository.save(budget);

        const useCase = new RouteTaskUseCase(
            modelRepository,
            decisionRepository,
            {
                getDefaultProfile: async () => ({
                    purpose: "default-chat",
                    weights: {
                        quality: 0.9,
                        latency: 0.05,
                        cost: 0.05,
                        stability: 0,
                        capabilityFit: 0,
                    },
                }),
                saveDefaultProfile: async () => undefined,
            }
        );

        const decision = await useCase.execute({
            taskId: "task-quality-first",
            activityType: "coding.generate",
            requiredCapabilities: [Capability.CODING],
        });

        expect(decision.getChosenModelId()).toBe(premium.getId());
        expect(decision.toJSON().weights).toMatchObject({ quality: 0.9, cost: 0.05 });
        expect(decision.toJSON().candidateScores).toHaveLength(2);
    });

    it("penalizes over-budget models when maxCost is provided and exposes comparative scoring", async () => {
        const modelRepository = new InMemoryModelRepository();
        const decisionRepository = new InMemoryRoutingDecisionRepository();

        const premium = new ModelCatalogItem({
            id: "premium-model",
            providerId: "provider-a",
            externalModelId: "deepseek-coder-v3",
            displayName: "DeepSeek Coder",
            locality: "cloud",
            capabilities: [Capability.CODING],
            enabled: true,
            health: "ok",
            scores: { coding: 9.5, overall: 9.2 },
            metrics: { avgLatencyMs: 420, avgTokensIn: 4000, avgTokensOut: 1200 },
            pricing: { inputPer1M: 35, outputPer1M: 55, currency: "USD", source: "official" },
        });

        const budget = new ModelCatalogItem({
            id: "budget-model",
            providerId: "provider-b",
            externalModelId: "qwen-coder-2.5",
            displayName: "Qwen Coder",
            locality: "cloud",
            capabilities: [Capability.CODING],
            enabled: true,
            health: "ok",
            scores: { coding: 7.2, overall: 7 },
            metrics: { avgLatencyMs: 350, avgTokensIn: 4000, avgTokensOut: 1200 },
            pricing: { inputPer1M: 3, outputPer1M: 8, currency: "USD", source: "official" },
        });

        await modelRepository.save(premium);
        await modelRepository.save(budget);

        const useCase = new RouteTaskUseCase(
            modelRepository,
            decisionRepository,
            {
                getDefaultProfile: async () => ({
                    purpose: "coding",
                    weights: {
                        quality: 0.45,
                        latency: 0.1,
                        cost: 0.35,
                        stability: 0,
                        capabilityFit: 0.1,
                    },
                }),
                saveDefaultProfile: async () => undefined,
            }
        );

        const decision = await useCase.execute({
            taskId: "task-budget-first",
            activityType: "coding.debug",
            requiredCapabilities: [Capability.CODING],
            maxCost: 0.03,
        });

        const serialized = decision.toJSON();
        expect(decision.getChosenModelId()).toBe(budget.getId());
        expect(serialized.estimatedCost).toBeLessThanOrEqual(0.03);
        expect(serialized.justification).toContain("Qwen Coder");
        expect(serialized.justification).toContain("maxCost");
        expect(serialized.candidateScores).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    modelId: budget.getId(),
                    displayName: "Qwen Coder",
                    withinBudget: true,
                }),
                expect.objectContaining({
                    modelId: premium.getId(),
                    displayName: "DeepSeek Coder",
                    withinBudget: false,
                }),
            ])
        );
    });
});
