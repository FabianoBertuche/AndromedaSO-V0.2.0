import { Router } from "express";
import { PlaybookSuggestionsController } from "./PlaybookSuggestionsController";

export function createPlaybookSuggestionsRouter(controller: PlaybookSuggestionsController): Router {
    const router = Router();

    router.get("/:id/playbook-suggestions", (req, res) => controller.list(req as any, res));
    router.post("/:id/playbook-suggestions/:suggestionId/approve", (req, res) => controller.approve(req as any, res));
    router.post("/:id/playbook-suggestions/:suggestionId/reject", (req, res) => controller.reject(req as any, res));

    return router;
}
