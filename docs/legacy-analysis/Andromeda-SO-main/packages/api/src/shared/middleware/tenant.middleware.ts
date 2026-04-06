import { Response, NextFunction } from 'express';
import { RequestWithContext } from '../http/request-context';
import { logger } from '../logger';

/**
 * Middleware para garantir que o tenantId esteja presente no contexto da requisição.
 * Deve ser executado APÓS o authMiddleware.
 */
export function tenantMiddleware(req: RequestWithContext, res: Response, next: NextFunction) {
    const tenantId = req.user?.tenantId || req.tenantId;

    if (!tenantId) {
        logger.warn({ url: req.url }, 'Tenant Context missing for protected route');
        return res.status(403).json({ error: 'Tenant context required' });
    }

    // Garante que o tenantId esteja no topo do request context
    req.tenantId = tenantId;

    next();
}
