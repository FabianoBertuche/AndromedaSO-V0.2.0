import { IPlannerQueue } from "../domain/ports";
import { ExecutePlanStepJob, ExecutePlanStepJobPayload } from "./ExecutePlanStepJob";

export class PlannerQueueAdapter implements IPlannerQueue {
    private readonly jobIdToStepId = new Map<string, string>();
    private readonly stepIdToJobId = new Map<string, string>();

    constructor(private readonly job: ExecutePlanStepJob) { }

    async add(jobName: string, payload: Record<string, unknown>): Promise<void> {
        const typedPayload = payload as unknown as ExecutePlanStepJobPayload;
        const jobId = await this.job.addStep(typedPayload.planId, typedPayload.stepId, typedPayload.tenantId);
        this.stepIdToJobId.set(typedPayload.stepId, jobId);
        this.jobIdToStepId.set(jobId, typedPayload.stepId);
    }

    async removeJobs(stepId: string): Promise<void> {
        const jobId = this.stepIdToJobId.get(stepId);
        if (jobId) {
            await this.job.removeJob(jobId);
            this.stepIdToJobId.delete(stepId);
            this.jobIdToStepId.delete(jobId);
        }
    }
}
