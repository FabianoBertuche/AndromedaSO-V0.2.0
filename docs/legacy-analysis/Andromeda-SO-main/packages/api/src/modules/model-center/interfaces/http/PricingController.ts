import { Pricing } from "@andromeda/core";
import { Request, Response } from "express";
import { globalModelRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { sendError } from "../../../../shared/http/error-response";
import { pricingRegistry } from "../../dependencies";

export class PricingController {
    async list(req: Request, res: Response) {
        try {
            const entries = await pricingRegistry.list();
            return res.json(entries);
        } catch (error: any) {
            return sendError(req, res, 500, "INTERNAL_SERVER_ERROR", error.message);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const modelId = req.params.modelId;
            const pricing = this.extractPricing(req.body);
            const saved = await pricingRegistry.upsert(modelId, pricing);
            await this.refreshCatalogPricing(modelId, pricing);
            return res.json(saved);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    private extractPricing(payload: any): Pricing {
        return {
            inputPer1M: this.requireNumber(payload?.inputPer1M, "inputPer1M"),
            outputPer1M: this.requireNumber(payload?.outputPer1M, "outputPer1M"),
            currency: typeof payload?.currency === "string" ? payload.currency : "USD",
            source: typeof payload?.source === "string" ? payload.source : "manual",
        };
    }

    private requireNumber(value: unknown, field: string): number {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new Error(`Campo ${field} invalido`);
        }

        return value;
    }

    private async refreshCatalogPricing(modelId: string, pricing: Pricing): Promise<void> {
        const models = await globalModelRepository.findAll();
        const normalized = this.normalizeModelId(modelId);

        for (const model of models) {
            const candidates = this.getCandidateKeys(model.getExternalModelId());
            if (!candidates.includes(normalized)) {
                continue;
            }

            model.updatePricing(pricing);
            await globalModelRepository.save(model);
        }
    }

    private getCandidateKeys(modelId: string): string[] {
        const normalized = this.normalizeModelId(modelId);
        return [...new Set([normalized, normalized.split(":")[0]])];
    }

    private normalizeModelId(modelId: string): string {
        return modelId.trim().toLowerCase();
    }
}
