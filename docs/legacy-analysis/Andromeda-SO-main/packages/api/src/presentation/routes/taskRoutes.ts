import { Router } from "express";
import { TaskController } from "../controllers/TaskController";
import { InMemoryTaskRepository } from "../../infrastructure/repositories/InMemoryTaskRepository";

import { globalTaskRepository } from "../../infrastructure/repositories/GlobalRepositories";

const router = Router();
const controller = new TaskController(globalTaskRepository);

router.post("/", (req, res) => controller.create(req, res));
router.get("/", (req, res) => controller.list(req, res));
router.get("/:id", (req, res) => controller.getById(req, res));
router.get("/:id/assets", (req, res) => controller.getAssets(req, res));
router.post("/:id/execute", (req, res) => controller.execute(req, res));

export default router;
