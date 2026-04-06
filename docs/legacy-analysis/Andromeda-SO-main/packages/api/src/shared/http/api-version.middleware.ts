import { Request, Response, NextFunction } from 'express';

export function apiVersionMiddleware(version: number = 1) {
    return (req: Request, res: Response, next: NextFunction) => {
        res.setHeader('X-Api-Version', version.toString());
        next();
    };
}
