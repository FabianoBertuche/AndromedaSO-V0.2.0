import { Response } from "express";
import { ImportAgentUseCase } from "../../application/ImportAgentUseCase";
import { AgentImportJobRepository } from "../../repositories/agent-import-job.repository";
import { ConflictPolicy } from "../../domain/types";

export class ImportController {
    constructor(
        private readonly importUseCase: ImportAgentUseCase,
        private readonly jobRepository: AgentImportJobRepository,
    ) {}

    async importAgent(req: any, res: Response): Promise<void> {
        try {
            const tenantId = (req as any).tenant?.id || "default";
            const userId = (req as any).user?.id;
            const file = req.file;

            if (!file) {
                res.status(400).json({ error: "No file uploaded" });
                return;
            }

            const conflictPolicy: ConflictPolicy = req.body?.conflictPolicy || "ABORT";

            const result = await this.importUseCase.execute({
                tenantId,
                userId,
                filePath: file.path,
                conflictPolicy,
            });

            if (result.status === "FAILED") {
                res.status(400).json(result);
                return;
            }

            if (result.status === "CONFLICT_DETECTED") {
                res.status(409).json(result);
                return;
            }

            res.status(201).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async getJobStatus(req: any, res: Response): Promise<void> {
        try {
            const jobId = req.params.jobId;
            const tenantId = (req as any).tenant?.id || "default";

            const job = await this.importUseCase.getJobStatus(jobId, tenantId);

            if (!job) {
                res.status(404).json({ error: "Job not found" });
                return;
            }

            res.json(job);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async resolveConflict(req: any, res: Response): Promise<void> {
        try {
            const jobId = req.params.jobId;
            const tenantId = (req as any).tenant?.id || "default";
            const policy: ConflictPolicy = req.body?.policy || "ABORT";

            const result = await this.importUseCase.resolveConflict(jobId, tenantId, policy);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}