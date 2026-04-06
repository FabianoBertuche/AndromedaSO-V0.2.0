import { Request, Response, NextFunction } from 'express';

export function deprecationMiddleware(sunsetDate?: string, newRoute?: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        res.setHeader('Deprecation', 'true');

        if (sunsetDate) {
            res.setHeader('Sunset', new Date(sunsetDate).toUTCString());
        }

        if (newRoute) {
            res.setHeader('Link', `<${newRoute}>; rel="alternate"`);
        }

        // Em um cenário de degradação mais avançado, poderia logar isso no AuditLog ou disparar alerta.
        next();
    };
}
