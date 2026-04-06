import { AgentProfileRepository } from "../../agent-management/infrastructure/FileSystemAgentProfileRepository";
import { BundleValidator, ValidationResult } from "./BundleValidator";
import { BundleImporter } from "./BundleImporter";
import { AgentImportJobRepository, PrismaAgentImportJobRepository } from "../repositories/agent-import-job.repository";
import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { AgentImportStatus, ConflictPolicy } from "../domain/types";

export interface ImportAgentInput {
    tenantId: string;
    userId: string;
    filePath: string;
    conflictPolicy: ConflictPolicy;
}

export interface ImportAgentOutput {
    jobId: string;
    status: AgentImportStatus;
    importedAgentId?: string;
    conflictAgentId?: string;
    errors?: string[];
}

export class ImportAgentUseCase {
    constructor(
        private readonly agentProfileRepository: AgentProfileRepository,
        private readonly bundleValidator: BundleValidator,
        private readonly bundleImporter: BundleImporter,
        private readonly jobRepository: AgentImportJobRepository,
    ) {}

    async execute(input: ImportAgentInput): Promise<ImportAgentOutput> {
        const checksum = await this.bundleValidator.computeChecksum(input.filePath);

        const job = await this.jobRepository.create({
            tenantId: input.tenantId,
            bundleChecksum: checksum,
            status: "VALIDATING",
            conflictPolicy: input.conflictPolicy,
            createdBy: input.userId,
        });

        try {
            await this.jobRepository.update(job.id, { status: "VALIDATING" });

            const validation = await this.bundleValidator.validate(input.filePath, checksum);

            if (!validation.valid) {
                await this.jobRepository.update(job.id, {
                    status: "FAILED",
                    errorMessage: validation.errors.join("; "),
                });

                return {
                    jobId: job.id,
                    status: "FAILED",
                    errors: validation.errors,
                };
            }

            if (!validation.manifest || !validation.tempDir) {
                await this.jobRepository.update(job.id, {
                    status: "FAILED",
                    errorMessage: "Invalid bundle: missing manifest",
                });

                return {
                    jobId: job.id,
                    status: "FAILED",
                    errors: ["Invalid bundle: missing manifest"],
                };
            }

            const existingAgent = await this.agentProfileRepository.getById(validation.manifest.agent.slug);

            if (existingAgent) {
                if (input.conflictPolicy === "ABORT") {
                    await this.jobRepository.update(job.id, {
                        status: "CONFLICT_DETECTED",
                        report: {
                            created: [],
                            skipped: [],
                            conflicts: [validation.manifest.agent.slug],
                        },
                    });

                    return {
                        jobId: job.id,
                        status: "CONFLICT_DETECTED",
                        conflictAgentId: existingAgent.id,
                    };
                }

                if (input.conflictPolicy === "RENAME") {
                    validation.manifest.agent.slug = `${validation.manifest.agent.slug}-imported-${Date.now()}`;
                }
            }

            await this.jobRepository.update(job.id, { status: "IMPORTING" });

            const result = await this.bundleImporter.importFromBundle(validation.tempDir, validation.manifest, {
                tenantId: input.tenantId,
                overwrite: input.conflictPolicy === "OVERWRITE" && existingAgent ? existingAgent.id : undefined,
                renameSuffix: input.conflictPolicy === "RENAME" ? `${Date.now()}` : undefined,
            });

            await this.bundleValidator.cleanup(validation.tempDir);

            await this.jobRepository.update(job.id, {
                status: "COMPLETED",
                importedAgentId: result.agentId,
                completedAt: new Date().toISOString(),
            });

            return {
                jobId: job.id,
                status: "COMPLETED",
                importedAgentId: result.agentId,
            };
        } catch (error: any) {
            await this.jobRepository.update(job.id, {
                status: "FAILED",
                errorMessage: error.message,
            });

            throw error;
        }
    }

    async getJobStatus(jobId: string, tenantId: string): Promise<ImportAgentOutput | null> {
        const job = await this.jobRepository.findById(jobId, tenantId);

        if (!job) {
            return null;
        }

        return {
            jobId: job.id,
            status: job.status,
            importedAgentId: job.importedAgentId,
            errors: job.errorMessage ? [job.errorMessage] : undefined,
        };
    }

    async resolveConflict(_jobId: string, _tenantId: string, _policy: ConflictPolicy): Promise<ImportAgentOutput> {
        throw new Error("Conflict resolution not implemented - use import with conflict policy");
    }
}