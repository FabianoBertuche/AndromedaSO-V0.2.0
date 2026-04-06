import { Request, Response } from "express";
import { ReceiveGatewayMessage } from "../../application/use-cases/ReceiveGatewayMessage";
import { GetSession } from "../../application/use-cases/GetSession";
import { ListSessionMessages } from "../../application/use-cases/ListSessionMessages";
import { GetGatewayTaskStatus } from "../../application/use-cases/GetGatewayTaskStatus";
import { GatewayValidationError } from "../../application/validators/gateway-message.validator";
import { sendError } from "../../../../shared/http/error-response";
import { getRequestId, RequestWithContext } from "../../../../shared/http/request-context";

export class CommunicationController {
    constructor(
        private readonly receiveGatewayMessage: ReceiveGatewayMessage,
        private readonly getSession: GetSession,
        private readonly listSessionMessages: ListSessionMessages,
        private readonly getGatewayTaskStatus: GetGatewayTaskStatus
    ) { }

    async handleMessage(req: RequestWithContext, res: Response) {
        try {
            const auth = (req as any).gatewayAuth;
            const response = await this.receiveGatewayMessage.execute({
                ...req.body,
                metadata: {
                    ...req.body?.metadata,
                    requestId: req.body?.metadata?.requestId || getRequestId(req, res),
                    context: {
                        ...req.body?.metadata?.context,
                        tenantId: req.tenantId || req.user?.tenantId || "default",
                        userId: req.user?.id,
                    },
                },
            }, auth);
            return res.status(200).json(response);
        } catch (error: any) {
            if (error instanceof GatewayValidationError) {
                return sendError(req, res, 400, "VALIDATION_ERROR", error.message, {
                    field: error.field,
                });
            }

            return sendError(req, res, 400, "BAD_REQUEST", error.message || "Invalid gateway message payload");
        }
    }

    async getSessionById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const session = await this.getSession.execute(id);
            return res.status(200).json(session);
        } catch (error: any) {
            return sendError(req, res, 404, "NOT_FOUND", error.message);
        }
    }

    async getMessagesBySessionId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const messages = await this.listSessionMessages.execute(id);
            return res.status(200).json(messages);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async getTaskStatus(req: Request, res: Response) {
        try {
            const { taskId } = req.params;
            const status = await this.getGatewayTaskStatus.execute(taskId);
            return res.status(200).json(status);
        } catch (error: any) {
            return sendError(req, res, 404, "NOT_FOUND", error.message);
        }
    }
}
