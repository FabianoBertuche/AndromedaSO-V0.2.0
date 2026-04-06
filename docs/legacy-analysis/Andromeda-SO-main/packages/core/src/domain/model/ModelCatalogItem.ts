import { v4 as uuidv4 } from "uuid";
import { Capability } from "./Capability";
import { Pricing } from "./Pricing";

export interface ModelMetrics {
    avgLatencyMs?: number;
    successRate?: number;
    fallbackRate?: number;
    avgTokensIn?: number;
    avgTokensOut?: number;
    avgCostPerRun?: number;
    benchmarkRuns?: number;
}

export interface ModelScores {
    overall?: number;
    [key: string]: number | undefined; // Scores para cada capability
}

export interface ModelCatalogItemProps {
    id?: string;
    providerId: string;
    externalModelId: string;
    displayName: string;
    locality: "local" | "cloud";
    family?: string;
    parameterSize?: string;
    quantization?: string;
    contextWindow?: number;
    capabilities: Capability[];
    enabled: boolean;
    health: "ok" | "warning" | "error" | "unknown";
    pricing?: Pricing;
    metrics?: ModelMetrics;
    scores?: ModelScores;
    recommendation?: {
        primaryUse?: string[];
        notes?: string;
    };
}

export class ModelCatalogItem {
    private id: string;
    private props: ModelCatalogItemProps;

    constructor(props: ModelCatalogItemProps) {
        this.id = props.id || uuidv4();
        this.props = {
            ...props,
            capabilities: props.capabilities || [],
            enabled: props.enabled ?? true,
            health: props.health || "unknown",
            metrics: props.metrics || {},
            scores: props.scores || {},
        };
    }

    getId(): string { return this.id; }
    getProviderId(): string { return this.props.providerId; }
    getExternalModelId(): string { return this.props.externalModelId; }
    getDisplayName(): string { return this.props.displayName; }
    getLocality(): string { return this.props.locality; }
    getCapabilities(): Capability[] { return this.props.capabilities; }
    isEnabled(): boolean { return this.props.enabled; }
    getHealth(): string { return this.props.health; }
    getScores(): ModelScores { return this.props.scores!; }
    getPricing(): Pricing | undefined { return this.props.pricing; }
    getMetrics(): ModelMetrics { return this.props.metrics!; }

    addCapability(cap: Capability) {
        if (!this.props.capabilities.includes(cap)) {
            this.props.capabilities.push(cap);
        }
    }

    updateScore(cap: Capability | string, score: number) {
        if (!this.props.scores) this.props.scores = {};
        this.props.scores[this.normalizeScoreKey(cap as string)] = this.roundScore(score);
        this.recalculateOverallScore();
    }

    updateMetrics(metrics: Partial<ModelMetrics>) {
        this.props.metrics = {
            ...this.props.metrics,
            ...metrics,
        };
    }

    updatePricing(pricing?: Pricing) {
        if (!pricing) return;
        this.props.pricing = pricing;
    }

    mergeCatalogData(data: Partial<ModelCatalogItemProps>) {
        if (data.displayName) this.props.displayName = data.displayName;
        if (data.locality) this.props.locality = data.locality;
        if (data.family !== undefined) this.props.family = data.family;
        if (data.parameterSize !== undefined) this.props.parameterSize = data.parameterSize;
        if (data.quantization !== undefined) this.props.quantization = data.quantization;
        if (data.contextWindow !== undefined) this.props.contextWindow = data.contextWindow;
        if (data.capabilities) this.props.capabilities = [...data.capabilities];
        if (data.health) this.props.health = data.health;
        if (data.metrics) this.updateMetrics(data.metrics);
        if (data.pricing) this.updatePricing(data.pricing);
        if (data.recommendation) this.props.recommendation = data.recommendation;
        if (data.scores) {
            Object.entries(data.scores).forEach(([key, value]) => {
                if (typeof value === "number") {
                    this.updateScore(key, value);
                }
            });
        }
    }

    toJSON() {
        return {
            id: this.id,
            ...this.props,
        };
    }

    private recalculateOverallScore() {
        const scores = this.props.scores;
        if (!scores) return;

        const entries = Object.entries(scores)
            .filter(([key, value]) => key !== "overall" && typeof value === "number")
            .map(([, value]) => value as number);

        if (entries.length === 0) return;

        const overall = entries.reduce((sum, current) => sum + current, 0) / entries.length;
        scores.overall = this.roundScore(overall);
    }

    private normalizeScoreKey(key: string): string {
        return key.trim().toLowerCase().replace(/-/g, "_");
    }

    private roundScore(score: number): number {
        return Math.round(score * 10) / 10;
    }
}
