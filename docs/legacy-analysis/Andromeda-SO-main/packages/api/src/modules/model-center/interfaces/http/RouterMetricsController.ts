import { Request, Response } from "express";
import { globalRoutingDecisionRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { sendError } from "../../../../shared/http/error-response";
import { routeTaskUseCase } from "../../dependencies";

export class RouterMetricsController {
    async getDecisions(req: Request, res: Response) {
        try {
            const limit = parseInt(req.query.limit as string, 10) || 50;
            const decisions = await globalRoutingDecisionRepository.getRecentDecisions(limit);
            return res.json(decisions);
        } catch (error: any) {
            return sendError(req, res, 500, "INTERNAL_SERVER_ERROR", error.message);
        }
    }

    async simulateRoute(req: Request, res: Response) {
        try {
            const decision = await routeTaskUseCase.execute(req.body);
            return res.json(decision.toJSON());
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }
}
