import { Response } from "express";
import { sendError } from "../../../../../shared/http/error-response";
import { RequestWithContext } from "../../../../../shared/http/request-context";
import { PlaybookSuggestionService } from "../../application/PlaybookSuggestionService";

export class PlaybookSuggestionsController {
    constructor(private readonly service: PlaybookSuggestionService) { }

    async list(req: RequestWithContext, res: Response) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const items = await this.service.listByAgent(req.params.id, tenantId);
            return res.status(200).json({ agentId: req.params.id, items });
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to load playbook suggestions");
        }
    }

    async approve(req: RequestWithContext, res: Response) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const reviewedBy = req.user?.id || "system";
            const item = await this.service.approve(req.params.id, req.params.suggestionId, reviewedBy, tenantId);
            return res.status(200).json(item);
        } catch (error: any) {
            return sendError(req, res, /already reviewed/i.test(error.message) ? 409 : /not found/i.test(error.message) ? 404 : 400, /already reviewed/i.test(error.message) ? "PLAYBOOK_SUGGESTION_ALREADY_REVIEWED" : /not found/i.test(error.message) ? "PLAYBOOK_SUGGESTION_NOT_FOUND" : "BAD_REQUEST", error.message || "Failed to approve playbook suggestion");
        }
    }

    async reject(req: RequestWithContext, res: Response) {
        try {
            const tenantId = req.tenantId || req.user?.tenantId || "default";
            const reviewedBy = req.user?.id || "system";
            const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : undefined;
            const item = await this.service.reject(req.params.id, req.params.suggestionId, reviewedBy, reason, tenantId);
            return res.status(200).json(item);
        } catch (error: any) {
            return sendError(req, res, /already reviewed/i.test(error.message) ? 409 : /not found/i.test(error.message) ? 404 : 400, /already reviewed/i.test(error.message) ? "PLAYBOOK_SUGGESTION_ALREADY_REVIEWED" : /not found/i.test(error.message) ? "PLAYBOOK_SUGGESTION_NOT_FOUND" : "BAD_REQUEST", error.message || "Failed to reject playbook suggestion");
        }
    }
}
