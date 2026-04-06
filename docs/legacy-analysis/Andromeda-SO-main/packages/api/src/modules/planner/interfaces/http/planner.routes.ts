import { Router } from "express";
import { PlannerController } from "./PlannerController";

export function createPlannerRouter(controller: PlannerController): Router {
    const router = Router();
    router.get("/plans", (req, res) => controller.listPlans(req as any, res));
    router.get("/plans/:id", (req, res) => controller.getPlan(req as any, res));
    router.post("/plans", (req, res) => controller.createPlan(req as any, res));
    router.post("/plans/:id/execute", (req, res) => controller.executePlan(req as any, res));
    router.post("/plans/:id/steps/:stepId/approve", (req, res) => controller.approveStep(req as any, res));
    router.post("/plans/:id/rollback", (req, res) => controller.rollbackPlan(req as any, res));
    return router;
}
