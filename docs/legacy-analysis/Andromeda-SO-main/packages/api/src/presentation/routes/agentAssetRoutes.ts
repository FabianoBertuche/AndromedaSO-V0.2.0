import { Router } from "express";
import { AgentAssetController } from "../controllers/AgentAssetController";

const router = Router();
const controller = new AgentAssetController();

router.get("/diagnostics", (req, res) => controller.diagnostics(req, res));

export default router;
