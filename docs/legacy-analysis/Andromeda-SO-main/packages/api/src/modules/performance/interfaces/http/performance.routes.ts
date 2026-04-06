import { Router } from "express";
import { PerformanceController } from "./PerformanceController";

export function createPerformanceRouter(controller: PerformanceController): Router {
    const router = Router();

    router.get("/:id/performance", (req, res) => controller.getAgentPerformance(req as any, res));
    router.get("/:id/performance/trend", (req, res) => controller.getAgentTrend(req as any, res));

    return router;
}
