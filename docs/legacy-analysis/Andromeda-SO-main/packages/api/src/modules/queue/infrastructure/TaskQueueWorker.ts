import { Worker, Job, Queue } from 'bullmq';
import { redisConnection } from '../../../shared/redis';

export interface QueuedTask {
    id: string;
    type: string;
    payload: any;
    tenantId: string;
}

export class TaskQueueWorker {
    private worker: Worker;
    private readonly mainQueueName = 'andromeda-tasks';

    constructor() {
        this.worker = new Worker(
            this.mainQueueName,
            async (job: Job<QueuedTask>) => {
                await this.processJob(job);
            },
            {
                connection: redisConnection as any,
                settings: {
                    backoffStrategy: (attemptsMade: number) => {
                        // Exponential backoff: 2s, 4s, 8s... limit to 30s
                        const delay = Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
                        return delay;
                    },
                },
            }
        );

        this.setupListeners();
    }

    private async processJob(job: Job<QueuedTask>) {
        console.log(`[QueueWorker] Processing job ${job.id} (${job.data.type}) for tenant ${job.data.tenantId}`);

        // Simulating work for now. 
        // In a real scenario, this would dispatch to a TaskService.
        if (job.data.type === 'fail_test') {
            throw new Error('Planned failure for testing DLQ');
        }

        // Success simulation
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log(`[QueueWorker] Job ${job.id} completed`);
    }

    private setupListeners() {
        this.worker.on('completed', (job) => {
            console.log(`[QueueWorker] Job ${job.id} finished successfully`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[QueueWorker] Job ${job?.id} failed with error: ${err.message}`);

            // If attemptsMade >= 3 (configured at queue level or default), 
            // BullMQ moves it to 'failed' state which is our "DLQ" source.
        });
    }

    async close() {
        await this.worker.close();
    }
}
