import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
    namespace Express {
        interface Request {
            requestId?: string;
        }
    }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    const existingId = req.headers['x-request-id'] as string | undefined;
    const requestId = existingId || uuidv4();
    
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    res.locals.requestId = requestId;
    
    next();
}

export function getRequestId(req: Request): string {
    return req.requestId || 'unknown';
}