import { Router, Request, Response } from 'express';
import { TriggerBackupUseCase } from '../../application/use-cases/TriggerBackupUseCase';
import { ListBackupsUseCase } from '../../application/use-cases/ListBackupsUseCase';
import { authMiddleware } from '../../../../shared/middleware/auth.middleware';
import { requireRole } from '../../../../shared/middleware/rbac.middleware';

export function createBackupRoutes(
    triggerBackupUseCase: TriggerBackupUseCase,
    listBackupsUseCase: ListBackupsUseCase
): Router {
    const router = Router();

    // POST /v1/backup/trigger - Only Owner can trigger
    router.post('/trigger', authMiddleware, requireRole('owner'), async (req: Request, res: Response) => {
        try {
            const result = await triggerBackupUseCase.execute();

            if (result.success) {
                return res.status(200).json({
                    message: 'Backup triggered successfully',
                    filename: result.filename
                });
            } else {
                return res.status(500).json({
                    error: 'Backup execution failed',
                    details: result.error
                });
            }
        } catch (error: any) {
            return res.status(500).json({
                error: 'Unexpected error during backup',
                message: error.message
            });
        }
    });

    // GET /v1/backup/list - Logged in users can see the list
    router.get('/list', authMiddleware, async (req: Request, res: Response) => {
        try {
            const backups = await listBackupsUseCase.execute();
            return res.status(200).json({
                backups
            });
        } catch (error: any) {
            return res.status(500).json({
                error: 'Failed to list backups',
                message: error.message
            });
        }
    });

    return router;
}
