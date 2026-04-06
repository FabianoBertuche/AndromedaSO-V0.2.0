import { Request, Response } from "express";
import { getRequestId } from "./request-context";

export interface ErrorResponseOptions {
    field?: string;
    details?: unknown;
}

export function sendError(
    req: Request,
    res: Response,
    status: number,
    code: string,
    message: string,
    options: ErrorResponseOptions = {}
) {
    return res.status(status).json({
        error: {
            code,
            message,
            ...(options.field ? { field: options.field } : {}),
            ...(options.details !== undefined ? { details: options.details } : {}),
            request_id: getRequestId(req, res),
        },
    });
}
