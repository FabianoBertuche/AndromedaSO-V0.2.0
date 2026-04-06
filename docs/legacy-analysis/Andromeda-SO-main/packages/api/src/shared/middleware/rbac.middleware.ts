import { Response, NextFunction } from 'express';
import { RequestWithContext } from '../http/request-context';

export const ROLE_HIERARCHY: Record<string, number> = {
    owner: 4,
    admin: 3,
    operator: 2,
    viewer: 1,
};

export function requireRole(minRole: string) {
    return (req: RequestWithContext, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
        const minLevel = ROLE_HIERARCHY[minRole] || 0;

        if (userLevel < minLevel) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        next();
    };
}
