import { Router } from "express";
import { FeedbackController } from "./FeedbackController";

export function createFeedbackRouter(controller: FeedbackController): Router {
    const router = Router();

    router.post("/tasks/:id/feedback", (req, res) => controller.submit(req as any, res));
    router.get("/tasks/:id/feedback", (req, res) => controller.getByTask(req as any, res));

    return router;
}
