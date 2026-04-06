import { Prisma, PrismaClient } from "@prisma/client";
import {
    ApprovalRequest,
    AgentSandboxConfig,
    SandboxArtifact,
    SandboxExecution,
    SandboxProfile,
    createDefaultAgentSandboxConfig,
} from "../domain/types";
import {
    ApprovalRequestRepository,
    AgentSandboxConfigRepository,
    SandboxArtifactRepository,
    SandboxExecutionRepository,
    SandboxProfileRepository,
} from "../domain/ports";

type PrismaSandboxProfile = Prisma.SandboxProfileGetPayload<{}>;
type PrismaAgentSandboxConfig = Prisma.AgentSandboxConfigGetPayload<{}>;
type PrismaSandboxExecution = Prisma.SandboxExecutionGetPayload<{}>;
type PrismaSandboxArtifact = Prisma.SandboxArtifactGetPayload<{}>;
type PrismaApprovalRequest = Prisma.ApprovalRequestGetPayload<{}>;

export class PrismaSandboxProfileRepository implements SandboxProfileRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async list(): Promise<SandboxProfile[]> {
        const rows = await this.prisma.sandboxProfile.findMany({
            orderBy: [{ isSystem: "desc" }, { name: "asc" }],
        });
        return rows.map(mapProfile);
    }

    async getById(id: string): Promise<SandboxProfile | null> {
        const row = await this.prisma.sandboxProfile.findUnique({ where: { id } });
        return row ? mapProfile(row) : null;
    }

    async save(profile: SandboxProfile): Promise<SandboxProfile> {
        const payload = mapProfileToPersisted(profile);
        await this.prisma.sandboxProfile.upsert({
            where: { id: profile.id },
            create: payload,
            update: payload as Prisma.SandboxProfileUpdateInput,
        });
        return profile;
    }

    async delete(id: string): Promise<void> {
        const current = await this.getById(id);
        if (current?.isSystem) {
            throw new Error("System sandbox profiles cannot be deleted.");
        }

        await this.prisma.sandboxProfile.deleteMany({ where: { id } });
    }
}

export class PrismaAgentSandboxConfigRepository implements AgentSandboxConfigRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async getByAgentId(agentId: string): Promise<AgentSandboxConfig> {
        const existing = await this.prisma.agentSandboxConfig.findUnique({ where: { agentId } });
        if (existing) {
            return mapAgentConfig(existing);
        }

        const config = createDefaultAgentSandboxConfig(agentId);
        await this.save(config);
        return config;
    }

    async save(config: AgentSandboxConfig): Promise<AgentSandboxConfig> {
        const payload = mapAgentConfigToPersisted(config);
        await this.prisma.agentSandboxConfig.upsert({
            where: { agentId: config.agentId },
            create: payload,
            update: payload as Prisma.AgentSandboxConfigUpdateInput,
        });
        return config;
    }

    async list(): Promise<AgentSandboxConfig[]> {
        const rows = await this.prisma.agentSandboxConfig.findMany({ orderBy: { agentId: "asc" } });
        return rows.map(mapAgentConfig);
    }
}

export class PrismaSandboxExecutionRepository implements SandboxExecutionRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async list(): Promise<SandboxExecution[]> {
        const rows = await this.prisma.sandboxExecution.findMany({
            orderBy: [{ finishedAt: "desc" }, { startedAt: "desc" }],
        });
        return rows.map(mapExecution);
    }

    async getById(id: string): Promise<SandboxExecution | null> {
        const row = await this.prisma.sandboxExecution.findUnique({ where: { id } });
        return row ? mapExecution(row) : null;
    }

    async save(execution: SandboxExecution): Promise<SandboxExecution> {
        const payload = mapExecutionToPersisted(execution);
        await this.prisma.sandboxExecution.upsert({
            where: { id: execution.id },
            create: payload,
            update: payload as Prisma.SandboxExecutionUpdateInput,
        });
        return execution;
    }
}

export class PrismaSandboxArtifactRepository implements SandboxArtifactRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async listByExecutionId(executionId: string): Promise<SandboxArtifact[]> {
        const rows = await this.prisma.sandboxArtifact.findMany({
            where: { executionId },
            orderBy: { name: "asc" },
        });
        return rows.map(mapArtifact);
    }

    async saveByExecutionId(executionId: string, artifacts: SandboxArtifact[]): Promise<void> {
        await this.prisma.sandboxArtifact.deleteMany({ where: { executionId } });
        if (artifacts.length === 0) {
            return;
        }

        await this.prisma.sandboxArtifact.createMany({
            data: artifacts.map((artifact) => mapArtifactToPersisted(artifact, executionId)),
        });
    }
}

export class PrismaApprovalRequestRepository implements ApprovalRequestRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async list(): Promise<ApprovalRequest[]> {
        const rows = await this.prisma.approvalRequest.findMany({
            orderBy: [{ approvedAt: "desc" }, { rejectedAt: "desc" }],
        });
        return rows.map(mapApprovalRequest);
    }

    async getById(id: string): Promise<ApprovalRequest | null> {
        const row = await this.prisma.approvalRequest.findUnique({ where: { id } });
        return row ? mapApprovalRequest(row) : null;
    }

    async save(request: ApprovalRequest): Promise<ApprovalRequest> {
        const payload = mapApprovalRequestToPersisted(request);
        await this.prisma.approvalRequest.upsert({
            where: { id: request.id },
            create: payload,
            update: payload as Prisma.ApprovalRequestUpdateInput,
        });
        return request;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.approvalRequest.deleteMany({ where: { id } });
    }
}

export async function ensureSystemSandboxProfiles(repository: SandboxProfileRepository, profiles: SandboxProfile[]): Promise<void> {
    for (const profile of profiles) {
        await repository.save(profile);
    }
}

function mapProfile(record: PrismaSandboxProfile): SandboxProfile {
    return {
        id: record.id,
        name: record.name,
        description: record.description,
        version: record.version,
        isSystem: record.isSystem,
        mode: record.mode as SandboxProfile["mode"],
        riskLevel: record.riskLevel as SandboxProfile["riskLevel"],
        config: record.config as unknown as SandboxProfile["config"],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

function mapProfileToPersisted(profile: SandboxProfile): Prisma.SandboxProfileCreateInput {
    return {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        version: profile.version,
        isSystem: profile.isSystem,
        mode: profile.mode,
        riskLevel: profile.riskLevel,
        config: profile.config as unknown as Prisma.InputJsonValue,
        createdAt: new Date(profile.createdAt),
        updatedAt: new Date(profile.updatedAt),
    } as Prisma.SandboxProfileUncheckedCreateInput;
}

function mapAgentConfig(record: PrismaAgentSandboxConfig): AgentSandboxConfig {
    return {
        agentId: record.agentId,
        enabled: record.enabled,
        profileId: record.profileId,
        overrides: record.overrides as unknown as AgentSandboxConfig["overrides"],
        enforcement: record.enforcement as unknown as AgentSandboxConfig["enforcement"],
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

function mapAgentConfigToPersisted(config: AgentSandboxConfig): Prisma.AgentSandboxConfigUncheckedCreateInput {
    return {
        agentId: config.agentId,
        enabled: config.enabled,
        profileId: config.profileId,
        overrides: config.overrides as unknown as Prisma.InputJsonValue,
        enforcement: config.enforcement as unknown as Prisma.InputJsonValue,
        createdAt: new Date(config.createdAt),
        updatedAt: new Date(config.updatedAt),
    };
}

function mapExecution(record: PrismaSandboxExecution): SandboxExecution {
    return {
        id: record.id,
        agentId: record.agentId,
        taskId: record.taskId,
        skillId: record.skillId,
        capability: record.capability,
        status: record.status as SandboxExecution["status"],
        mode: record.mode as SandboxExecution["mode"],
        command: record.command as unknown as string[],
        policySnapshot: record.policySnapshot as unknown as SandboxExecution["policySnapshot"],
        startedAt: record.startedAt?.toISOString() ?? null,
        finishedAt: record.finishedAt?.toISOString() ?? null,
        durationMs: record.durationMs,
        exitCode: record.exitCode,
        resourceUsage: record.resourceUsage as unknown as SandboxExecution["resourceUsage"],
        errorMessage: record.errorMessage,
        stdout: record.stdout || undefined,
        stderr: record.stderr || undefined,
    };
}

function mapExecutionToPersisted(execution: SandboxExecution): Prisma.SandboxExecutionUncheckedCreateInput {
    return {
        id: execution.id,
        agentId: execution.agentId,
        taskId: execution.taskId ?? null,
        skillId: execution.skillId ?? null,
        capability: execution.capability,
        status: execution.status,
        mode: execution.mode,
        command: execution.command as unknown as Prisma.InputJsonValue,
        policySnapshot: execution.policySnapshot as unknown as Prisma.InputJsonValue,
        startedAt: execution.startedAt ? new Date(execution.startedAt) : null,
        finishedAt: execution.finishedAt ? new Date(execution.finishedAt) : null,
        durationMs: execution.durationMs ?? null,
        exitCode: execution.exitCode ?? null,
        resourceUsage: execution.resourceUsage ? (execution.resourceUsage as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
        errorMessage: execution.errorMessage ?? null,
        stdout: execution.stdout ?? null,
        stderr: execution.stderr ?? null,
    };
}

function mapArtifact(record: PrismaSandboxArtifact): SandboxArtifact {
    return {
        id: record.id,
        executionId: record.executionId,
        name: record.name,
        path: record.path,
        sizeBytes: record.sizeBytes,
        sha256: record.sha256,
        mimeType: record.mimeType,
        retainedUntil: record.retainedUntil?.toISOString() ?? null,
        metadata: (record.metadata as unknown as Record<string, unknown> | null) || undefined,
    };
}

function mapArtifactToPersisted(artifact: SandboxArtifact, executionId: string): Prisma.SandboxArtifactCreateManyInput {
    return {
        id: artifact.id,
        executionId,
        name: artifact.name,
        path: artifact.path,
        sizeBytes: artifact.sizeBytes,
        sha256: artifact.sha256,
        mimeType: artifact.mimeType ?? null,
        retainedUntil: artifact.retainedUntil ? new Date(artifact.retainedUntil) : null,
        metadata: artifact.metadata ? (artifact.metadata as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
    };
}

function mapApprovalRequest(record: PrismaApprovalRequest): ApprovalRequest {
    return {
        id: record.id,
        agentId: record.agentId,
        taskId: record.taskId,
        executionId: record.executionId,
        reason: record.reason,
        requestedAction: record.requestedAction as unknown as Record<string, unknown>,
        status: record.status as ApprovalRequest["status"],
        approvedBy: record.approvedBy,
        approvedAt: record.approvedAt?.toISOString() ?? null,
        rejectedAt: record.rejectedAt?.toISOString() ?? null,
    };
}

function mapApprovalRequestToPersisted(request: ApprovalRequest): Prisma.ApprovalRequestCreateInput {
    return {
        id: request.id,
        agentId: request.agentId,
        taskId: request.taskId ?? null,
        executionId: request.executionId ?? null,
        reason: request.reason,
        requestedAction: request.requestedAction as unknown as Prisma.InputJsonValue,
        status: request.status,
        approvedBy: request.approvedBy ?? null,
        approvedAt: request.approvedAt ? new Date(request.approvedAt) : null,
        rejectedAt: request.rejectedAt ? new Date(request.rejectedAt) : null,
    } as Prisma.ApprovalRequestUncheckedCreateInput;
}
