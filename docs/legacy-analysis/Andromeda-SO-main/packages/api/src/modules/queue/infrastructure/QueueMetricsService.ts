import { Queue } from 'bullmq';
import { redisConnection } from '../../../shared/redis';

export interface QueueMetrics {
    active: number;
    waiting: number;
    completed: number;
    failed: number;
    delayed: number;
}

export class QueueMetricsService {
    private queue: Queue;
    private readonly queueName = 'andromeda-tasks';

    constructor() {
        this.queue = new Queue(this.queueName, { connection: redisConnection as any });
    }

    async getMetrics(): Promise<QueueMetrics> {
        const counts = await this.queue.getJobCounts();
        return {
            active: counts.active,
            waiting: counts.waiting,
            completed: counts.completed,
            failed: counts.failed,
            delayed: counts.delayed,
        };
    }
}
