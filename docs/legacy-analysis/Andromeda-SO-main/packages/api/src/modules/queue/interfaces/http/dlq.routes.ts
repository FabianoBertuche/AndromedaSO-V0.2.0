import { Router, Request, Response } from 'express';
import { DlqQueueService } from '../../infrastructure/DlqQueueService';
import { QueueMetricsService } from '../../infrastructure/QueueMetricsService';

export function createDlqRoutes(
    dlqQueueService: DlqQueueService,
    queueMetricsService: QueueMetricsService
): Router {
    const router = Router();

    // GET /v1/dlq/jobs - List failed jobs
    router.get('/jobs', async (req: Request, res: Response) => {
        try {
            const failedJobs = await dlqQueueService.listFailedJobs();
            return res.status(200).json({
                total: failedJobs.length,
                jobs: failedJobs
            });
        } catch (error: any) {
            return res.status(500).json({
                error: 'Failed to list DLQ jobs',
                message: error.message
            });
        }
    });

    // POST /v1/dlq/jobs/:id/reprocess - Retry a failed job
    router.post('/jobs/:id/reprocess', async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const result = await dlqQueueService.reprocessJob(id);

            if (result.success) {
                return res.status(200).json(result);
            } else {
                return res.status(400).json(result);
            }
        } catch (error: any) {
            return res.status(500).json({
                error: 'Failed to reprocess job',
                message: error.message
            });
        }
    });

    // GET /v1/dlq/metrics - Queue health metrics
    router.get('/metrics', async (req: Request, res: Response) => {
        try {
            const metrics = await queueMetricsService.getMetrics();
            return res.status(200).json(metrics);
        } catch (error: any) {
            return res.status(500).json({
                error: 'Failed to fetch queue metrics',
                message: error.message
            });
        }
    });

    return router;
}
