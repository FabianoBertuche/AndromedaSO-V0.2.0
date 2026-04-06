import { Job, Queue, Worker } from "bullmq";
import { redisConnection } from "../../../shared/redis";
import { PerformanceConsolidationService } from "../application/services/PerformanceConsolidationService";

interface ConsolidatePerformancePayload {
    scheduledAt: string;
}

export class ConsolidatePerformanceJob {
    private readonly queueName = "performance-daily-consolidation";
    private readonly queue: Queue<ConsolidatePerformancePayload>;
    private readonly worker: Worker<ConsolidatePerformancePayload>;

    constructor(
        private readonly service: PerformanceConsolidationService,
        private readonly onCompleted?: (agentIds: string[]) => Promise<void>,
    ) {
        this.queue = new Queue(this.queueName, { connection: redisConnection as any });
        this.worker = new Worker(
            this.queueName,
            async (job: Job<ConsolidatePerformancePayload>) => this.process(job),
            { connection: redisConnection as any },
        );
    }

    async schedule(): Promise<void> {
        await this.queue.add(
            "consolidate-performance",
            { scheduledAt: new Date().toISOString() },
            {
                repeat: { pattern: "0 1 * * *", tz: "UTC" },
                jobId: "consolidate-performance-cron",
                removeOnComplete: 20,
                removeOnFail: 20,
            },
        );
    }

    private async process(job: Job<ConsolidatePerformancePayload>): Promise<void> {
        const records = await this.service.consolidateDaily(new Date(job.data.scheduledAt));
        await this.onCompleted?.(records.map((record) => record.agentId));
        console.info("[performance.consolidation.completed]", { jobId: job.id, records: records.length });
    }
}
