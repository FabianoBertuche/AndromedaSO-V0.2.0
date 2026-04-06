import { AgentProfile } from "../domain/agent-profile";
import { AgentVersionRecord, AgentVersionRepository } from "../application/AgentVersioningService";

export class PrismaAgentVersionRepository implements AgentVersionRepository {
    constructor(private readonly prisma: any) { }

    async list(agentId: string, tenantId = "default"): Promise<AgentVersionRecord[]> {
        const rows = await this.prisma.agentVersion.findMany({
            where: {
                agentId,
                tenantId,
            },
            orderBy: [
                { versionNumber: "desc" },
                { createdAt: "desc" },
            ],
        });

        return rows.map(mapVersionRow);
    }

    async get(agentId: string, versionNumber: number, tenantId = "default"): Promise<AgentVersionRecord | null> {
        const row = await this.prisma.agentVersion.findUnique({
            where: {
                tenantId_agentId_versionNumber: {
                    tenantId,
                    agentId,
                    versionNumber,
                },
            },
        });

        return row ? mapVersionRow(row) : null;
    }

    async create(input: {
        agentId: string;
        tenantId: string;
        sourceVersionLabel?: string;
        changeSummary: string;
        restoredFromVersionNumber?: number;
        createdBy?: string;
        snapshot: AgentProfile;
    }): Promise<AgentVersionRecord> {
        const latest = await this.prisma.agentVersion.findFirst({
            where: {
                tenantId: input.tenantId,
                agentId: input.agentId,
            },
            orderBy: {
                versionNumber: "desc",
            },
        });

        const row = await this.prisma.agentVersion.create({
            data: {
                tenantId: input.tenantId,
                agentId: input.agentId,
                versionNumber: (latest?.versionNumber || 0) + 1,
                sourceVersionLabel: input.sourceVersionLabel,
                snapshot: input.snapshot,
                changeSummary: input.changeSummary,
                restoredFromVersionNumber: input.restoredFromVersionNumber,
                createdBy: input.createdBy,
            },
        });

        return mapVersionRow(row);
    }
}

function mapVersionRow(row: any): AgentVersionRecord {
    return {
        versionNumber: row.versionNumber,
        sourceVersionLabel: row.sourceVersionLabel || undefined,
        changeSummary: row.changeSummary,
        restoredFromVersionNumber: row.restoredFromVersionNumber || undefined,
        createdBy: row.createdBy || undefined,
        createdAt: row.createdAt.toISOString(),
        snapshot: row.snapshot as AgentProfile,
    };
}
