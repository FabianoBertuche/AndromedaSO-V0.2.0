import { CognitiveHealthPort } from "@andromeda/core";
import { Request, Response } from "express";
import { sendError } from "../../../../shared/http/error-response";
import { getRequestId } from "../../../../shared/http/request-context";
import { CognitiveServiceConfig } from "../../infrastructure/cognitive-service.config";
import { CognitiveIntegrationError } from "../../infrastructure/python/PythonCognitiveServiceAdapter";

export class CognitiveController {
    constructor(
        private readonly config: CognitiveServiceConfig,
        private readonly healthPort: CognitiveHealthPort,
    ) { }

    async getHealth(req: Request, res: Response) {
        try {
            const health = await this.healthPort.health();
            return res.status(200).json(health);
        } catch (error) {
            return this.handleIntegrationError(req, res, error);
        }
    }

    async getReadiness(req: Request, res: Response) {
        try {
            const readiness = await this.healthPort.readiness();
            const status = readiness.status === "ready" || readiness.status === "disabled" ? 200 : 503;
            return res.status(status).json(readiness);
        } catch (error) {
            return this.handleIntegrationError(req, res, error);
        }
    }

    async ping(req: Request, res: Response) {
        if (!this.config.enabled) {
            return sendError(req, res, 503, "COGNITIVE_DISABLED", "Cognitive service is disabled");
        }

        try {
            const requestId = getRequestId(req, res);
            const correlationId = readOptionalString(req.body?.correlationId) || requestId;
            const timeoutMs = readPositiveNumber(req.body?.timeoutMs) || this.config.timeoutMs;

            const response = await this.healthPort.ping({
                requestId,
                correlationId,
                taskId: readOptionalString(req.body?.taskId),
                sessionId: readOptionalString(req.body?.sessionId),
                timeoutMs,
                input: {
                    message: readOptionalString(req.body?.message) || "ping",
                },
                context: {
                    channel: "internal",
                },
                traceMetadata: {
                    route: "/internal/cognitive/ping",
                },
            });

            return res.status(response.success ? 200 : 502).json(response);
        } catch (error) {
            return this.handleIntegrationError(req, res, error);
        }
    }

    private handleIntegrationError(req: Request, res: Response, error: unknown) {
        if (error instanceof CognitiveIntegrationError) {
            return sendError(
                req,
                res,
                error.statusCode || 503,
                error.code,
                error.message,
                error.details !== undefined ? { details: error.details } : undefined,
            );
        }

        return sendError(req, res, 503, "COGNITIVE_INTEGRATION_ERROR", error instanceof Error ? error.message : "Unexpected cognitive integration error");
    }
}

function readOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : undefined;
}

function readPositiveNumber(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) && value > 0
        ? Math.trunc(value)
        : undefined;
}
