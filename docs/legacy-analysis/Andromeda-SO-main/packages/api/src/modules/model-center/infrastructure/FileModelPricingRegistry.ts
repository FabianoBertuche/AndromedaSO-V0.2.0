import { promises as fs } from "fs";
import path from "path";
import { Pricing } from "@andromeda/core";

interface PricingDocument {
    models: Record<string, Pricing>;
    updatedAt?: string;
}

export interface PricingEntry extends Pricing {
    modelId: string;
}

const DEFAULT_DOCUMENT: PricingDocument = {
    models: {},
};

export class FileModelPricingRegistry {
    constructor(
        private readonly filePath = path.resolve(process.cwd(), "packages/api/config/model-pricing.json")
    ) { }

    async list(): Promise<PricingEntry[]> {
        const document = await this.readDocument();
        return Object.entries(document.models).map(([modelId, pricing]) => ({
            modelId,
            ...pricing,
        }));
    }

    async findByModelId(modelId: string): Promise<Pricing | undefined> {
        const document = await this.readDocument();
        for (const candidate of this.getCandidateKeys(modelId)) {
            const pricing = document.models[candidate];
            if (pricing) {
                return pricing;
            }
        }
        return undefined;
    }

    async upsert(modelId: string, pricing: Pricing): Promise<PricingEntry> {
        const normalizedModelId = this.normalizeModelId(modelId);
        const document = await this.readDocument();
        document.models[normalizedModelId] = {
            ...document.models[normalizedModelId],
            ...pricing,
        };

        await this.writeDocument(document);

        return {
            modelId: normalizedModelId,
            ...document.models[normalizedModelId],
        };
    }

    private async readDocument(): Promise<PricingDocument> {
        try {
            const raw = await fs.readFile(this.filePath, "utf8");
            const parsed = JSON.parse(raw) as PricingDocument;
            return {
                models: parsed.models ?? {},
                updatedAt: parsed.updatedAt,
            };
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                await this.writeDocument(DEFAULT_DOCUMENT);
                return DEFAULT_DOCUMENT;
            }
            throw error;
        }
    }

    private async writeDocument(document: PricingDocument): Promise<void> {
        await fs.mkdir(path.dirname(this.filePath), { recursive: true });
        await fs.writeFile(this.filePath, JSON.stringify({
            ...document,
            updatedAt: new Date().toISOString(),
        }, null, 2));
    }

    private getCandidateKeys(modelId: string): string[] {
        const normalized = this.normalizeModelId(modelId);
        const base = normalized.split(":")[0];
        return [...new Set([normalized, base])];
    }

    private normalizeModelId(modelId: string): string {
        return modelId.trim().toLowerCase();
    }
}
