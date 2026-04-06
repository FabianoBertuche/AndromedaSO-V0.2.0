import { Router } from "express";
import { BudgetController } from "./BudgetController";

export function createBudgetRouter(controller: BudgetController): Router {
    const router = Router();

    router.get("/agents/:id/budget", (req, res) => controller.getAgentBudget(req as any, res));
    router.put("/agents/:id/budget", (req, res) => controller.upsertAgentBudget(req as any, res));
    router.get("/budget/report", (req, res) => controller.getBudgetReport(req as any, res));

    return router;
}
