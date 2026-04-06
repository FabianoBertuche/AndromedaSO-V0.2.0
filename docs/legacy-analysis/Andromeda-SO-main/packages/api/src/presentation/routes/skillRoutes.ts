import { Router } from "express";
import { SkillController } from "../controllers/SkillController";
import { InMemorySkillRegistry } from "../../infrastructure/skills/InMemorySkillRegistry";
import { globalSkillExecutor } from "../../infrastructure/skills/defaultSkillExecutor";
import { discoverLocalSkills } from "../../infrastructure/skills/LocalSkillDiscovery";

const router = Router();
// Para o MVP, usamos uma única instância do registry (em memória), com bootstrap das skills locais.
export const globalSkillRegistry = new InMemorySkillRegistry(discoverLocalSkills);
const controller = new SkillController(globalSkillRegistry, globalSkillExecutor);

router.post("/", (req, res) => controller.register(req, res));
router.get("/", (req, res) => controller.list(req, res));
router.get("/diagnostics", (req, res) => controller.diagnostics(req, res));
router.post("/:id/execute", (req, res) => controller.execute(req, res));

export default router;
