import { promises as fs } from "fs";
import path from "path";
import { IRoutingProfileRepository, RoutingDecisionProfile } from "@andromeda/core";

interface RoutingProfileDocument extends RoutingDecisionProfile {
    updatedAt?: string;
}

const DEFAULT_PROFILE: RoutingDecisionProfile = {
    purpose: "default",
    weights: {
        quality: 0.5,
        latency: 0.2,
        cost: 0.2,
        stability: 0,
        capabilityFit: 0.1,
    }
};

export class FileRoutingProfileRepository implements IRoutingProfileRepository {
    constructor(
        private readonly filePath = path.resolve(process.cwd(), "packages/api/config/router-config.json")
    ) { }

    async getDefaultProfile(purpose?: string): Promise<RoutingDecisionProfile> {
        const document = await this.readDocument();
        return purpose ? { ...document, purpose } : document;
    }

    async saveDefaultProfile(profile: RoutingDecisionProfile): Promise<void> {
        const normalized = this.normalizeProfile(profile);
        await this.ensureDirectory();
        await fs.writeFile(this.filePath, JSON.stringify({
            ...normalized,
            updatedAt: new Date().toISOString(),
        }, null, 2));
    }

    private async readDocument(): Promise<RoutingDecisionProfile> {
        try {
            const raw = await fs.readFile(this.filePath, "utf8");
            const parsed = JSON.parse(raw) as RoutingProfileDocument;
            return this.normalizeProfile(parsed);
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                await this.saveDefaultProfile(DEFAULT_PROFILE);
                return DEFAULT_PROFILE;
            }
            throw error;
        }
    }

    private normalizeProfile(profile: Partial<RoutingProfileDocument>): RoutingDecisionProfile {
        const weights = profile.weights ?? DEFAULT_PROFILE.weights;
        return {
            purpose: profile.purpose || DEFAULT_PROFILE.purpose,
            weights: {
                quality: this.normalizeWeight(weights.quality, DEFAULT_PROFILE.weights.quality),
                latency: this.normalizeWeight(weights.latency, DEFAULT_PROFILE.weights.latency),
                cost: this.normalizeWeight(weights.cost, DEFAULT_PROFILE.weights.cost),
                stability: this.normalizeWeight(weights.stability, DEFAULT_PROFILE.weights.stability),
                capabilityFit: this.normalizeWeight(weights.capabilityFit, DEFAULT_PROFILE.weights.capabilityFit),
            }
        };
    }

    private normalizeWeight(value: number | undefined, fallback: number): number {
        if (typeof value !== "number" || Number.isNaN(value)) {
            return fallback;
        }
        return Math.max(0, value);
    }

    private async ensureDirectory(): Promise<void> {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    }
}
