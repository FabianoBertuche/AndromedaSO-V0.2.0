import { Job, Queue, Worker } from "bullmq";
import { redisConnection } from "../../../shared/redis";
import { ResetDailyBudgetUseCase } from "../application/use-cases/ResetDailyBudgetUseCase";

interface ResetBudgetJobPayload {
    scheduledAt: string;
}

export class ResetDailyBudgetJob {
    private readonly queueName = "budget-daily-reset";
    private readonly queue: Queue<ResetBudgetJobPayload>;
    private readonly worker: Worker<ResetBudgetJobPayload>;

    constructor(private readonly resetDailyBudgetUseCase: ResetDailyBudgetUseCase) {
        this.queue = new Queue(this.queueName, {
            connection: redisConnection as any,
        });
        this.worker = new Worker(
            this.queueName,
            async (job: Job<ResetBudgetJobPayload>) => this.process(job),
            { connection: redisConnection as any },
        );
    }

    async schedule(): Promise<void> {
        await this.queue.add(
            "reset-daily-budget",
            { scheduledAt: new Date().toISOString() },
            {
                repeat: { pattern: "0 0 * * *", tz: "UTC" },
                jobId: "reset-daily-budget-cron",
                removeOnComplete: 20,
                removeOnFail: 20,
            },
        );
    }

    async close(): Promise<void> {
        await this.worker.close();
        await this.queue.close();
    }

    private async process(job: Job<ResetBudgetJobPayload>): Promise<void> {
        const resetCount = await this.resetDailyBudgetUseCase.execute(new Date(job.data.scheduledAt));
        console.info("[budget.daily-reset.completed]", {
            jobId: job.id,
            resetCount,
        });
    }
}
