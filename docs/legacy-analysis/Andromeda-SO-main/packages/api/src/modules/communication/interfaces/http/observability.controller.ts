import { Request, Response } from "express";
import { BuildSessionTimeline } from "../../application/use-cases/BuildSessionTimeline";
import { BuildTaskTimeline } from "../../application/use-cases/BuildTaskTimeline";
import { sendError } from "../../../../shared/http/error-response";

export class ObservabilityController {
    constructor(
        private readonly buildSessionTimeline: BuildSessionTimeline,
        private readonly buildTaskTimeline: BuildTaskTimeline
    ) { }

    async getSessionTimeline(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const timeline = await this.buildSessionTimeline.execute(id);
            return res.status(200).json(timeline);
        } catch (error: any) {
            return sendError(req, res, 404, "NOT_FOUND", error.message);
        }
    }

    async getTaskTimeline(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const timeline = await this.buildTaskTimeline.execute(taskId);
            return res.status(200).json(timeline);
        } catch (error: any) {
            return sendError(req, res, 404, "NOT_FOUND", error.message);
        }
    }
}
