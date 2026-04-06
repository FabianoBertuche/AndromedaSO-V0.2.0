import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { AgentImportJobRecord, AgentImportStatus, ConflictPolicy } from "../domain/types";

export interface AgentImportJobRepository {
    create(data: {
        tenantId: string;
        bundleChecksum: string;
        status: AgentImportStatus;
        conflictPolicy: ConflictPolicy;
        createdBy: string;
    }): Promise<AgentImportJobRecord>;
    
    update(id: string, data: Partial<{
        status: AgentImportStatus;
        importedAgentId: string;
        report: { created: string[]; skipped: string[]; conflicts: string[] };
        errorMessage: string;
        completedAt: string;
    }>): Promise<AgentImportJobRecord>;
    
    findById(id: string, tenantId: string): Promise<AgentImportJobRecord | null>;
}

export class PrismaAgentImportJobRepository implements AgentImportJobRepository {
    constructor(private readonly prisma: any = getPrismaClient()) {}

    async create(data: {
        tenantId: string;
        bundleChecksum: string;
        status: AgentImportStatus;
        conflictPolicy: ConflictPolicy;
        createdBy: string;
    }): Promise<AgentImportJobRecord> {
        const job = await this.prisma.agentImportJob.create({
            data: {
                tenantId: data.tenantId,
                bundleChecksum: data.bundleChecksum,
                status: data.status,
                conflictPolicy: data.conflictPolicy,
                createdBy: data.createdBy,
            },
        });

        return this.mapToRecord(job);
    }

    async update(id: string, data: Partial<{
        status: AgentImportStatus;
        importedAgentId: string;
        report: { created: string[]; skipped: string[]; conflicts: string[] };
        errorMessage: string;
        completedAt: string;
    }>): Promise<AgentImportJobRecord> {
        const job = await this.prisma.agentImportJob.update({
            where: { id },
            data: {
                status: data.status,
                importedAgentId: data.importedAgentId,
                report: data.report,
                errorMessage: data.errorMessage,
                completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
            },
        });

        return this.mapToRecord(job);
    }

    async findById(id: string, tenantId: string): Promise<AgentImportJobRecord | null> {
        const job = await this.prisma.agentImportJob.findFirst({
            where: { id, tenantId },
        });

        return job ? this.mapToRecord(job) : null;
    }

    private mapToRecord(job: any): AgentImportJobRecord {
        return {
            id: job.id,
            tenantId: job.tenantId,
            bundleChecksum: job.bundleChecksum,
            status: job.status as AgentImportStatus,
            conflictPolicy: job.conflictPolicy as ConflictPolicy,
            importedAgentId: job.importedAgentId || undefined,
            report: job.report || undefined,
            errorMessage: job.errorMessage || undefined,
            startedAt: job.startedAt.toISOString(),
            completedAt: job.completedAt?.toISOString(),
            createdBy: job.createdBy,
        };
    }
}