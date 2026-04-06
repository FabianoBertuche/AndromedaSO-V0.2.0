import { Router, Request, Response } from 'express';
import { HealthCheckService } from '../../application/HealthCheckService';
import { sendError } from '../../../../shared/http/error-response';

export function createHealthRoutes(healthCheckService: HealthCheckService): Router {
  const router = Router();

  router.get('/health', async (req: Request, res: Response) => {
    try {
      const result = await healthCheckService.check();
      const statusCode = result.status === 'down' ? 503 : 200;
      res.status(statusCode).json(result);
    } catch (error) {
      sendError(req, res, 500, 'HEALTH_CHECK_FAILED', 'Health check failed');
    }
  });

  router.get('/status', async (req: Request, res: Response) => {
    try {
      const result = await healthCheckService.check();
      res.json({
        status: result.status,
        version: result.version,
        timestamp: result.timestamp,
      });
    } catch (error) {
      sendError(req, res, 500, 'STATUS_CHECK_FAILED', 'Status check failed');
    }
  });

  return router;
}
