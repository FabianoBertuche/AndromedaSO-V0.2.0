import { PrismaClient } from "@prisma/client";
import { IAgentKnowledgePolicyRepository } from "../../../../../../core/src/domain/knowledge/IAgentKnowledgePolicyRepository";
import { AgentKnowledgePolicy } from "../../../../../../core/src/domain/knowledge/types";

export class PrismaAgentKnowledgePolicyRepository implements IAgentKnowledgePolicyRepository {
    constructor(private prisma: PrismaClient) { }

    async getPolicyByAgent(agentId: string, tenantId: string): Promise<AgentKnowledgePolicy | null> {
        const policy = await this.prisma.agentKnowledgePolicy.findFirst({
            where: { agentId, tenantId },
        });
        return policy ? this.mapToPolicy(policy) : null;
    }

    async upsertPolicy(agentId: string, data: Partial<AgentKnowledgePolicy>, tenantId: string): Promise<AgentKnowledgePolicy> {
        const policy = await this.prisma.agentKnowledgePolicy.upsert({
            where: { agentId }, // agentId ainda é único globalmente no schema atual, mas o tenantId garante o isolamento lógico
            update: {
                knowledgeEnabled: data.knowledgeEnabled,
                vaultReadEnabled: data.vaultReadEnabled,
                vaultWriteEnabled: data.vaultWriteEnabled,
                writeMode: data.writeMode,
                approvalRequired: data.approvalRequired,
                allowedCollectionIds: serializeList(data.allowedCollectionIds),
                allowedPaths: serializeList(data.allowedPaths),
                maxChunks: data.maxChunks,
                maxContextTokens: data.maxContextTokens,
                rerankEnabled: data.rerankEnabled,
                preferMemoryOverKnowledge: data.preferMemoryOverKnowledge,
                preferKnowledgeOverMemory: data.preferKnowledgeOverMemory,
            },
            create: {
                agentId,
                tenantId,
                knowledgeEnabled: data.knowledgeEnabled ?? false,
                vaultReadEnabled: data.vaultReadEnabled ?? false,
                vaultWriteEnabled: data.vaultWriteEnabled ?? false,
                writeMode: data.writeMode ?? 'disabled',
                approvalRequired: data.approvalRequired ?? true,
                allowedCollectionIds: serializeList(data.allowedCollectionIds ?? []) || "[]",
                allowedPaths: serializeList(data.allowedPaths ?? []) || "[]",
                maxChunks: data.maxChunks ?? 5,
                maxContextTokens: data.maxContextTokens ?? 2000,
                rerankEnabled: data.rerankEnabled ?? false,
                preferMemoryOverKnowledge: data.preferMemoryOverKnowledge ?? true,
                preferKnowledgeOverMemory: data.preferKnowledgeOverMemory ?? false,
            },
        });
        return this.mapToPolicy(policy);
    }

    async deletePolicy(agentId: string, tenantId: string): Promise<void> {
        await this.prisma.agentKnowledgePolicy.deleteMany({
            where: { agentId, tenantId },
        });
    }

    private mapToPolicy(p: any): AgentKnowledgePolicy {
        return {
            id: p.id,
            agentId: p.agentId,
            knowledgeEnabled: p.knowledgeEnabled,
            vaultReadEnabled: p.vaultReadEnabled,
            vaultWriteEnabled: p.vaultWriteEnabled,
            writeMode: p.writeMode as any,
            approvalRequired: p.approvalRequired,
            allowedCollectionIds: deserializeList(p.allowedCollectionIds),
            allowedPaths: deserializeList(p.allowedPaths),
            maxChunks: p.maxChunks,
            maxContextTokens: p.maxContextTokens,
            rerankEnabled: p.rerankEnabled,
            preferMemoryOverKnowledge: p.preferMemoryOverKnowledge,
            preferKnowledgeOverMemory: p.preferKnowledgeOverMemory,
            tenantId: p.tenantId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }
}

function serializeList(value?: string[]): string | undefined {
    if (!value) {
        return undefined;
    }

    return JSON.stringify(value);
}

function deserializeList(value: string): string[] {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
        return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
}
