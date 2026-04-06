import { Request, Response } from "express";
import { GetAgentPerformanceUseCase } from "../../application/use-cases/GetAgentPerformanceUseCase";
import { GetAgentPerformanceTrendUseCase } from "../../application/use-cases/GetAgentPerformanceTrendUseCase";
import { sendError } from "../../../../shared/http/error-response";
import { RequestWithContext } from "../../../../shared/http/request-context";

export class PerformanceController {
    constructor(
        private readonly getAgentPerformanceUseCase: GetAgentPerformanceUseCase,
        private readonly getAgentPerformanceTrendUseCase: GetAgentPerformanceTrendUseCase,
    ) { }

    async getAgentPerformance(req: RequestWithContext, res: Response) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const result = await this.getAgentPerformanceUseCase.execute({
                agentId: req.params.id,
                tenantId,
                period: typeof req.query.period === "string" ? req.query.period : undefined,
            });
            return res.status(200).json(result);
        } catch (error: any) {
            return sendError(req as Request, res, 400, "BAD_REQUEST", error.message || "Failed to load performance history");
        }
    }

    async getAgentTrend(req: RequestWithContext, res: Response) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const result = await this.getAgentPerformanceTrendUseCase.execute({
                agentId: req.params.id,
                tenantId,
            });
            return res.status(200).json(result);
        } catch (error: any) {
            return sendError(req as Request, res, 400, "BAD_REQUEST", error.message || "Failed to load performance trend");
        }
    }
}
