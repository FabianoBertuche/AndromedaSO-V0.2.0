import { Capability } from "../../../domain/model/Capability";
import { ModelMetrics } from "../../../domain/model/ModelCatalogItem";
import { Pricing } from "../../../domain/model/Pricing";
import { IModelRepository } from "../../../domain/model/IModelRepository";
import { IRoutingDecisionRepository } from "../../../domain/router/IRoutingDecisionRepository";
import { IRoutingProfileRepository } from "../../../domain/router/IRoutingProfileRepository";
import { RoutingDecision } from "../../../domain/router/RoutingDecision";
import { RoutingDecisionProfile } from "../../../domain/router/RoutingDecisionProfile";

export interface RouteTaskInputDTO {
    taskId: string;
    activityType: Capability | string;
    requiredCapabilities: Capability[];
    maxCost?: number;
}

interface ScoredCandidate {
    model: {
        getId(): string;
        getDisplayName(): string;
        getLocality(): string;
    };
    displayName: string;
    locality: "local" | "cloud";
    qualityScore: number;
    latencyScore: number;
    costScore: number;
    capabilityFitScore: number;
    stabilityScore: number;
    weightedScore: number;
    estimatedCost: number;
    withinBudget: boolean;
    latencyMs: number;
}

export class RouteTaskUseCase {
    constructor(
        private modelRepository: IModelRepository,
        private routingDecisionRepo: IRoutingDecisionRepository,
        private routingProfileRepository: IRoutingProfileRepository
    ) { }

    async execute(input: RouteTaskInputDTO): Promise<RoutingDecision> {
        const startTime = Date.now();
        const maxCost = input.maxCost;
        const normalizedActivityType = this.normalizeCapability(input.activityType);
        const normalizedRequiredCapabilities = input.requiredCapabilities.map(cap => this.normalizeCapability(cap));

        const allModels = await this.modelRepository.findAll();
        const enabledModels = allModels.filter(model => model.isEnabled() && model.getHealth() !== "error");
        const eligibleModels = enabledModels.filter(model => {
            const modelCapabilities = model.getCapabilities().map(cap => this.normalizeCapability(cap));
            return normalizedRequiredCapabilities.every(cap => modelCapabilities.includes(cap));
        });

        if (eligibleModels.length === 0) {
            throw new Error("Não foram encontrados modelos elegíveis para as capacidades requeridas");
        }

        const profile = await this.getRoutingProfile(normalizedActivityType);
        const rawCandidates = eligibleModels.map(model => {
            const metrics = model.getMetrics();
            const scores = model.getScores();
            const baseActivityType = normalizedActivityType.split(".")[0];

            return {
                model,
                qualityScore: this.clampScore(scores[normalizedActivityType] ?? scores[baseActivityType] ?? scores.overall ?? 5),
                latencyMs: metrics.avgLatencyMs ?? 600,
                estimatedCost: this.estimateRunCost(model.getPricing(), metrics, normalizedActivityType),
                capabilityFitScore: this.calculateCapabilityFitScore(model.getCapabilities(), normalizedActivityType, normalizedRequiredCapabilities),
                stabilityScore: this.calculateStabilityScore(metrics.successRate),
            };
        });

        const anyWithinBudget = maxCost !== undefined
            ? rawCandidates.some(candidate => candidate.estimatedCost <= maxCost)
            : false;

        const latencyValues = rawCandidates.map(candidate => candidate.latencyMs);
        const costValues = rawCandidates.map(candidate => candidate.estimatedCost);

        const scoredCandidates = rawCandidates.map(candidate => {
            const withinBudget = maxCost === undefined || candidate.estimatedCost <= maxCost;
            const latencyScore = this.normalizeLowerIsBetter(candidate.latencyMs, latencyValues);
            const relativeCostScore = this.normalizeLowerIsBetter(candidate.estimatedCost, costValues);
            const costScore = maxCost !== undefined
                ? this.applyBudgetToCostScore(relativeCostScore, candidate.estimatedCost, maxCost, anyWithinBudget)
                : relativeCostScore;

            const weightedScore = this.roundScore(
                candidate.qualityScore * profile.weights.quality +
                latencyScore * profile.weights.latency +
                costScore * profile.weights.cost +
                candidate.capabilityFitScore * profile.weights.capabilityFit +
                candidate.stabilityScore * (profile.weights.stability ?? 0)
            );

            return {
                model: candidate.model,
                displayName: candidate.model.getDisplayName(),
                locality: candidate.model.getLocality() as "local" | "cloud",
                qualityScore: candidate.qualityScore,
                latencyScore,
                costScore,
                capabilityFitScore: candidate.capabilityFitScore,
                stabilityScore: candidate.stabilityScore,
                weightedScore,
                estimatedCost: this.roundCurrency(candidate.estimatedCost),
                withinBudget,
                latencyMs: candidate.latencyMs,
            } satisfies ScoredCandidate;
        }).sort((left, right) => right.weightedScore - left.weightedScore);

        const selectionPool = anyWithinBudget
            ? scoredCandidates.filter(candidate => candidate.withinBudget)
            : scoredCandidates;

        const chosen = selectionPool[0];
        const fallback = selectionPool.length > 1 ? selectionPool[1] : scoredCandidates[1];
        const latencyMs = Date.now() - startTime;

        const decision = new RoutingDecision({
            taskId: input.taskId,
            activityType: normalizedActivityType,
            requiredCapabilities: normalizedRequiredCapabilities as Capability[],
            candidatesEvaluated: scoredCandidates.map(candidate => candidate.model.getId()),
            chosenModelId: chosen.model.getId(),
            fallbackModelId: fallback?.model.getId(),
            score: chosen.weightedScore,
            estimatedCost: chosen.estimatedCost,
            latencyMs,
            weights: profile.weights,
            candidateScores: scoredCandidates.map(candidate => ({
                modelId: candidate.model.getId(),
                displayName: candidate.displayName,
                locality: candidate.locality,
                qualityScore: candidate.qualityScore,
                latencyScore: candidate.latencyScore,
                costScore: candidate.costScore,
                capabilityFitScore: candidate.capabilityFitScore,
                stabilityScore: candidate.stabilityScore,
                weightedScore: candidate.weightedScore,
                estimatedCost: candidate.estimatedCost,
                withinBudget: candidate.withinBudget,
                latencyMs: candidate.latencyMs,
            })),
            justification: this.buildJustification(chosen, fallback, profile, maxCost),
        });

        await this.routingDecisionRepo.save(decision);

        return decision;
    }

    private async getRoutingProfile(activityType: string): Promise<RoutingDecisionProfile> {
        try {
            return await this.routingProfileRepository.getDefaultProfile(activityType);
        } catch {
            return {
                purpose: activityType,
                weights: {
                    quality: 0.5,
                    latency: 0.2,
                    cost: 0.2,
                    stability: 0,
                    capabilityFit: 0.1,
                }
            };
        }
    }

    private normalizeCapability(capability: Capability | string): string {
        return String(capability).trim().toLowerCase().replace(/-/g, "_");
    }

    private clampScore(value: number): number {
        return Math.max(0, Math.min(10, value));
    }

    private normalizeLowerIsBetter(value: number, values: number[]): number {
        const min = Math.min(...values);
        const max = Math.max(...values);

        if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) {
            return 5;
        }

        if (max === min) {
            return value === 0 ? 10 : 7;
        }

        const score = ((max - value) / (max - min)) * 10;
        return this.roundScore(Math.max(0, Math.min(10, score)));
    }

    private applyBudgetToCostScore(score: number, estimatedCost: number, maxCost: number, anyWithinBudget: boolean): number {
        if (maxCost <= 0) {
            return estimatedCost === 0 ? 10 : 0;
        }

        if (estimatedCost <= maxCost) {
            return this.roundScore(Math.min(10, score + 1));
        }

        if (anyWithinBudget) {
            return 0;
        }

        const overspendRatio = estimatedCost / maxCost;
        return this.roundScore(Math.max(0, score - Math.min(10, overspendRatio * 2)));
    }

    private estimateRunCost(pricing: Pricing | undefined, metrics: ModelMetrics, activityType: string): number {
        if (!pricing) return 0;

        const defaults = this.getDefaultTokens(activityType);
        const tokensIn = metrics.avgTokensIn ?? defaults.input;
        const tokensOut = metrics.avgTokensOut ?? defaults.output;
        const inputCost = ((pricing.inputPer1M ?? 0) * tokensIn) / 1_000_000;
        const outputCost = ((pricing.outputPer1M ?? 0) * tokensOut) / 1_000_000;

        return inputCost + outputCost;
    }

    private getDefaultTokens(activityType: string): { input: number; output: number } {
        switch (activityType) {
            case "coding":
                return { input: 4000, output: 1200 };
            case "structured_output":
                return { input: 1200, output: 400 };
            case "reasoning":
                return { input: 2500, output: 900 };
            case "chat":
            default:
                return { input: 800, output: 300 };
        }
    }

    private calculateCapabilityFitScore(modelCapabilities: Capability[], activityType: string, requiredCapabilities: string[]): number {
        const normalizedCapabilities = modelCapabilities.map(cap => this.normalizeCapability(cap));
        const hasPrimaryActivity = normalizedCapabilities.includes(activityType);
        const requiredCoverage = requiredCapabilities.filter(cap => normalizedCapabilities.includes(cap)).length;
        const coverageScore = requiredCapabilities.length === 0
            ? 8
            : (requiredCoverage / requiredCapabilities.length) * 10;

        return this.roundScore(Math.min(10, coverageScore + (hasPrimaryActivity ? 1 : 0)));
    }

    private calculateStabilityScore(successRate?: number): number {
        if (successRate === undefined) return 7;
        const normalized = successRate > 1 ? successRate / 10 : successRate * 10;
        return this.roundScore(Math.max(0, Math.min(10, normalized)));
    }

    private buildJustification(
        chosen: ScoredCandidate,
        fallback: ScoredCandidate | undefined,
        profile: RoutingDecisionProfile,
        maxCost?: number
    ): string {
        const comparison = fallback
            ? `superando ${fallback.displayName} (${fallback.weightedScore.toFixed(2)}) com vantagem em Q ${chosen.qualityScore.toFixed(1)}/${fallback.qualityScore.toFixed(1)}, L ${chosen.latencyScore.toFixed(1)}/${fallback.latencyScore.toFixed(1)} e C ${chosen.costScore.toFixed(1)}/${fallback.costScore.toFixed(1)}`
            : "sem concorrente elegível";
        const budget = maxCost !== undefined
            ? ` dentro de maxCost ${maxCost.toFixed(2)} com custo estimado ${chosen.estimatedCost.toFixed(5)}`
            : ` com custo estimado ${chosen.estimatedCost.toFixed(5)}`;

        return `${chosen.displayName} escolhido com score ponderado ${chosen.weightedScore.toFixed(2)}, ${comparison}${budget}. Pesos ativos: quality ${profile.weights.quality}, latency ${profile.weights.latency}, cost ${profile.weights.cost}.`;
    }

    private roundScore(value: number): number {
        return Math.round(value * 100) / 100;
    }

    private roundCurrency(value: number): number {
        return Math.round(value * 100000) / 100000;
    }
}
