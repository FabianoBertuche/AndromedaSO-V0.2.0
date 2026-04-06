import { Job, Queue, Worker } from "bullmq";
import { redisConnection } from "../../../../shared/redis";
import { PlaybookSuggestionService } from "../application/PlaybookSuggestionService";

interface LearnFromEpisodesPayload {
    scheduledAt: string;
}

export class LearnFromEpisodesJob {
    private readonly queueName = "learn-from-episodes";
    private readonly queue: Queue<LearnFromEpisodesPayload>;
    private readonly worker: Worker<LearnFromEpisodesPayload>;

    constructor(private readonly service: PlaybookSuggestionService) {
        this.queue = new Queue(this.queueName, { connection: redisConnection as any });
        this.worker = new Worker(
            this.queueName,
            async (job: Job<LearnFromEpisodesPayload>) => this.process(job),
            { connection: redisConnection as any },
        );
    }

    async schedule(): Promise<void> {
        await this.queue.add(
            "learn-from-episodes",
            { scheduledAt: new Date().toISOString() },
            {
                repeat: { pattern: "0 2 * * 0", tz: "UTC" },
                jobId: "learn-from-episodes-cron",
                removeOnComplete: 20,
                removeOnFail: 20,
            },
        );
    }

    private async process(job: Job<LearnFromEpisodesPayload>) {
        const created = await this.service.generateForAllAgents("default", new Date(job.data.scheduledAt));
        console.info("[playbook.learn-from-episodes.completed]", { jobId: job.id, created: created.length });
    }
}
