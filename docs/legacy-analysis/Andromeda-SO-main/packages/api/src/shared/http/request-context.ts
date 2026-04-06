import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

export const REQUEST_ID_HEADER = "X-Request-ID";

export interface RequestWithContext extends Request {
    requestId?: string;
    user?: {
        id: string;
        role: string;
        tenantId: string;
    };
    tenantId?: string;
}

export function requestContextMiddleware(req: RequestWithContext, res: Response, next: NextFunction) {
    const requestId = readRequestId(req.headers[REQUEST_ID_HEADER.toLowerCase()]);

    req.requestId = requestId;
    res.locals.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);

    next();
}

export function getRequestId(req: Request, res: Response): string {
    return (res.locals.requestId as string | undefined)
        || (req as RequestWithContext).requestId
        || randomUUID();
}

function readRequestId(headerValue: string | string[] | undefined): string {
    if (Array.isArray(headerValue)) {
        const firstValue = headerValue.find(value => typeof value === "string" && value.trim().length > 0);
        if (firstValue) {
            return firstValue.trim();
        }
    }

    if (typeof headerValue === "string" && headerValue.trim().length > 0) {
        return headerValue.trim();
    }

    return randomUUID();
}
