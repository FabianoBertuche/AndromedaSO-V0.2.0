import { TaskQueueWorker } from './infrastructure/TaskQueueWorker';
import { DlqQueueService } from './infrastructure/DlqQueueService';
import { QueueMetricsService } from './infrastructure/QueueMetricsService';
import { createDlqRoutes } from './interfaces/http/dlq.routes';

// Singleton instance of the worker to start listening
const taskQueueWorker = new TaskQueueWorker();

const dlqQueueService = new DlqQueueService();
const queueMetricsService = new QueueMetricsService();

const dlqRouter = createDlqRoutes(dlqQueueService, queueMetricsService);

export {
    taskQueueWorker,
    dlqQueueService,
    queueMetricsService,
    dlqRouter
};
