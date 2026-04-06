import { AgentHandoff } from "../../domain/handoff-payload";
import { IAgentHandoffRepository } from "../../domain/ports";

export class PrismaAgentHandoffRepository implements IAgentHandoffRepository {
    constructor(private readonly prisma: any) { }

    async create(input: AgentHandoff): Promise<AgentHandoff> {
        const record = await this.prisma.agentHandoff.create({
            data: {
                id: input.id,
                tenantId: input.tenantId,
                planId: input.planId,
                stepId: input.stepId,
                fromAgentId: input.fromAgentId,
                toAgentId: input.toAgentId,
                status: input.status,
                payload: input.payload,
                result: input.result,
                rejectedReason: input.rejectedReason,
                deletedAt: input.deletedAt,
                createdAt: input.createdAt,
                completedAt: input.completedAt,
            },
        });
        return mapAgentHandoff(record);
    }

    async findByPlanId(planId: string, tenantId?: string): Promise<AgentHandoff[]> {
        const records = await this.prisma.agentHandoff.findMany({
            where: {
                planId,
                ...(tenantId ? { tenantId } : {}),
            },
            orderBy: { createdAt: "asc" },
        });
        return records.map(mapAgentHandoff);
    }

    async findByAgentId(agentId: string, tenantId: string): Promise<AgentHandoff[]> {
        const records = await this.prisma.agentHandoff.findMany({
            where: {
                tenantId,
                OR: [
                    { fromAgentId: agentId },
                    { toAgentId: agentId },
                ],
            },
            orderBy: { createdAt: "asc" },
        });
        return records.map(mapAgentHandoff);
    }

    async updateStatus(handoffId: string, status: AgentHandoff["status"], result?: Record<string, unknown>): Promise<void> {
        await this.prisma.agentHandoff.update({
            where: { id: handoffId },
            data: {
                status,
                ...(result !== undefined ? { result } : {}),
            },
        });
    }
}

function mapAgentHandoff(record: any): AgentHandoff {
    return {
        id: record.id,
        tenantId: record.tenantId,
        planId: record.planId,
        stepId: record.stepId,
        fromAgentId: record.fromAgentId,
        toAgentId: record.toAgentId,
        status: record.status,
        payload: record.payload,
        result: record.result || null,
        rejectedReason: record.rejectedReason || null,
        deletedAt: record.deletedAt || null,
        createdAt: record.createdAt,
        completedAt: record.completedAt || null,
    };
}
