import { Queue, Job } from 'bullmq';
import { redisConnection } from '../../../shared/redis';

export class DlqQueueService {
    private mainQueue: Queue;
    private readonly mainQueueName = 'andromeda-tasks';

    constructor() {
        this.mainQueue = new Queue(this.mainQueueName, {
            connection: redisConnection as any,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
                removeOnComplete: true,
            },
        });
    }

    async listFailedJobs() {
        const failedJobs = await this.mainQueue.getFailed();
        return failedJobs.map((job) => ({
            id: job.id,
            name: job.name,
            data: job.data,
            failedReason: job.failedReason,
            timestamp: job.timestamp,
            finishedOn: job.finishedOn,
            attemptsMade: job.attemptsMade,
        }));
    }

    async reprocessJob(jobId: string) {
        const job = await this.mainQueue.getJob(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }

        if (await job.isFailed()) {
            await job.retry();
            return { success: true, message: `Job ${jobId} retried` };
        }

        return { success: false, message: `Job ${jobId} is not in failed state` };
    }

    async clearFailed() {
        await this.mainQueue.clean(0, 0, 'failed');
    }
}
