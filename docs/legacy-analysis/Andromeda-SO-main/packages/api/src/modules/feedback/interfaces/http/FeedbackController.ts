import { Response } from "express";
import { GetFeedbackByTaskUseCase } from "../../application/use-cases/GetFeedbackByTaskUseCase";
import { SubmitTaskFeedbackUseCase } from "../../application/use-cases/SubmitTaskFeedbackUseCase";
import { sendError } from "../../../../shared/http/error-response";
import { RequestWithContext } from "../../../../shared/http/request-context";

export class FeedbackController {
    constructor(
        private readonly submitTaskFeedbackUseCase: SubmitTaskFeedbackUseCase,
        private readonly getFeedbackByTaskUseCase: GetFeedbackByTaskUseCase,
    ) { }

    async submit(req: RequestWithContext, res: Response) {
        try {
            const tenantId = requireTenantId(req);
            const userId = requireUserId(req);
            const feedback = await this.submitTaskFeedbackUseCase.execute({
                tenantId,
                taskId: req.params.id,
                userId,
                rating: Number(req.body?.rating),
                comment: typeof req.body?.comment === "string" ? req.body.comment : undefined,
                metadata: req.body?.metadata,
            });

            return res.status(201).json(feedback);
        } catch (error: any) {
            const message = error.message || "Failed to submit feedback";
            if (/already submitted/i.test(message)) {
                return sendError(req, res, 409, "TASK_FEEDBACK_DUPLICATE", message);
            }
            if (/not found/i.test(message)) {
                return sendError(req, res, 404, "TASK_NOT_FOUND", message);
            }
            if (/rating/i.test(message)) {
                return sendError(req, res, 400, "INVALID_FEEDBACK_RATING", message);
            }
            return sendError(req, res, 400, "BAD_REQUEST", message);
        }
    }

    async getByTask(req: RequestWithContext, res: Response) {
        try {
            const tenantId = requireTenantId(req);
            const feedback = await this.getFeedbackByTaskUseCase.execute(req.params.id, tenantId);
            return res.status(200).json(feedback);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message || "Failed to load task feedback");
        }
    }
}

function requireTenantId(req: RequestWithContext): string {
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) {
        throw new Error("Tenant context required");
    }
    return tenantId;
}

function requireUserId(req: RequestWithContext): string {
    const userId = req.user?.id;
    if (!userId) {
        throw new Error("Authenticated user required");
    }
    return userId;
}
