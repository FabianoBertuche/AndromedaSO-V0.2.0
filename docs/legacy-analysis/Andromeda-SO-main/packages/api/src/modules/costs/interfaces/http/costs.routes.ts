import { Router } from "express";
import { CostsController } from "./CostsController";

export function createCostsRouter(controller: CostsController): Router {
    const router = Router();

    router.get("/summary", (req, res) => controller.getSummary(req as any, res));
    router.get("/by-agent", (req, res) => controller.getByAgent(req as any, res));
    router.post("/export", (req, res) => controller.exportCsv(req as any, res));

    return router;
}
