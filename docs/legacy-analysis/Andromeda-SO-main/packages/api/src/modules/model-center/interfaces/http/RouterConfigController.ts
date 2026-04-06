import { Request, Response } from "express";
import { sendError } from "../../../../shared/http/error-response";
import { routingProfileRepository } from "../../dependencies";

export class RouterConfigController {
    async get(req: Request, res: Response) {
        try {
            const purpose = typeof req.query.purpose === "string" ? req.query.purpose : undefined;
            const profile = await routingProfileRepository.getDefaultProfile(purpose);
            return res.json(profile);
        } catch (error: any) {
            return sendError(req, res, 500, "INTERNAL_SERVER_ERROR", error.message);
        }
    }

    async update(req: Request, res: Response) {
        try {
            const current = await routingProfileRepository.getDefaultProfile();
            const nextProfile = {
                purpose: typeof req.body?.purpose === "string" ? req.body.purpose : current.purpose,
                weights: {
                    quality: this.toNumber(req.body?.weights?.quality, current.weights.quality),
                    latency: this.toNumber(req.body?.weights?.latency, current.weights.latency),
                    cost: this.toNumber(req.body?.weights?.cost, current.weights.cost),
                    stability: this.toNumber(req.body?.weights?.stability, current.weights.stability),
                    capabilityFit: this.toNumber(req.body?.weights?.capabilityFit, current.weights.capabilityFit),
                },
            };

            await routingProfileRepository.saveDefaultProfile(nextProfile);
            return res.json(nextProfile);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    private toNumber(value: unknown, fallback: number): number {
        return typeof value === "number" && Number.isFinite(value) ? value : fallback;
    }
}
