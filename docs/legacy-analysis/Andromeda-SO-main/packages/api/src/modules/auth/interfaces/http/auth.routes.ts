import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authMiddleware } from '../../../../shared/middleware/auth.middleware';
import { requireRole } from '../../../../shared/middleware/rbac.middleware';

export function createAuthRoutes(controller: AuthController): Router {
    const router = Router();

    router.post('/login', (req, res) => controller.login(req, res));
    router.post('/refresh', (req, res) => controller.refresh(req, res));
    router.post('/logout', authMiddleware, (req, res) => controller.logout(req, res));
    router.get('/me', authMiddleware, (req, res) => controller.me(req, res));

    router.post('/api-keys', authMiddleware, requireRole('admin'), (req, res) => controller.createApiKey(req, res));

    return router;
}
