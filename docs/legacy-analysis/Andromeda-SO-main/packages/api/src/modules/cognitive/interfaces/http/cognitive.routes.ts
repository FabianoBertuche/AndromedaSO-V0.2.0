import { Router } from "express";
import { CognitiveController } from "./CognitiveController";
import { cognitiveServiceConfig, pythonCognitiveServiceAdapter } from "../../dependencies";

const router = Router();
const controller = new CognitiveController(cognitiveServiceConfig, pythonCognitiveServiceAdapter);

router.get("/health", (req, res) => void controller.getHealth(req, res));
router.get("/readiness", (req, res) => void controller.getReadiness(req, res));
router.post("/ping", (req, res) => void controller.ping(req, res));

export default router;
