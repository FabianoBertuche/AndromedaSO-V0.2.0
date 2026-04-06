import {
    AgentProfile,
    AgentProfileHistoryEntry,
    AgentIdentity,
    AgentSoul,
    AgentRuleSet,
    AgentPlaybook,
    AgentProjectContext,
    AgentPersonaConfig,
    AgentSafeguards,
    AgentMarkdownSections,
    bumpSemanticVersion,
    normalizeAgentProfile,
} from "../domain/agent-profile";
import { AgentProfileRepository, SaveAgentProfileOptions } from "./FileSystemAgentProfileRepository";
import { getPrismaClient } from "../../../infrastructure/database/prisma";

export class PrismaAgentProfileRepository implements AgentProfileRepository {
    constructor(private readonly prisma: any = getPrismaClient()) {}

    async list(): Promise<AgentProfile[]> {
        const rows = await this.prisma.agent.findMany({
            where: { deletedAt: null },
            orderBy: [
                { isDefault: "desc" },
                { name: "asc" },
            ],
        });

        return rows.map((row: any) => this.mapRowToProfile(row));
    }

    async getById(id: string): Promise<AgentProfile | null> {
        const row = await this.prisma.agent.findFirst({
            where: { id, deletedAt: null },
        });

        if (!row) {
            return null;
        }

        return this.mapRowToProfile(row);
    }

    async save(profile: AgentProfile, options: SaveAgentProfileOptions = {}): Promise<AgentProfile> {
        const normalized = normalizeAgentProfile(profile);
        const existing = await this.getById(normalized.id);

        if (existing) {
            await this.prisma.agentVersion.create({
                data: {
                    tenantId: "default",
                    agentId: existing.id,
                    versionNumber: await this.getNextVersionNumber(existing.id),
                    sourceVersionLabel: existing.version,
                    changeSummary: options.summary || "profile updated",
                    snapshot: existing,
                },
            });
        }

        await this.prisma.agent.upsert({
            where: { id: normalized.id },
            update: this.mapProfileToData(normalized),
            create: {
                id: normalized.id,
                ...this.mapProfileToData(normalized),
            },
        });

        return normalized;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.agent.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async listHistory(id: string): Promise<AgentProfileHistoryEntry[]> {
        const rows = await this.prisma.agentVersion.findMany({
            where: { agentId: id, deletedAt: null },
            orderBy: { createdAt: "desc" },
        });

        return rows.map((row: any) => ({
            version: row.sourceVersionLabel || `v${row.versionNumber}`,
            updatedAt: row.createdAt.toISOString(),
            summary: row.changeSummary,
            restoredFromVersion: row.restoredFromVersionNumber ? `v${row.restoredFromVersionNumber}` : undefined,
            profile: row.snapshot as AgentProfile,
        }));
    }

    async restore(id: string, version: string): Promise<AgentProfile> {
        const history = await this.listHistory(id);
        const current = await this.getById(id);
        const source = history.find((entry) => entry.version === version)?.profile
            || (current?.version === version ? current : null);

        if (!source) {
            throw new Error(`Version ${version} not found for agent ${id}`);
        }

        const nextVersion = current ? bumpSemanticVersion(current.version) : bumpSemanticVersion(source.version);
        const restored: AgentProfile = normalizeAgentProfile({
            ...source,
            version: nextVersion,
            updatedAt: new Date().toISOString(),
        });

        if (current) {
            await this.prisma.agentVersion.create({
                data: {
                    tenantId: "default",
                    agentId: current.id,
                    versionNumber: await this.getNextVersionNumber(current.id),
                    sourceVersionLabel: current.version,
                    changeSummary: `restored from ${version}`,
                    restoredFromVersionNumber: this.extractVersionNumber(version),
                    snapshot: current,
                },
            });
        }

        await this.prisma.agent.update({
            where: { id },
            data: this.mapProfileToData(restored),
        });

        return restored;
    }

    private mapRowToProfile(row: any): AgentProfile {
        return normalizeAgentProfile({
            id: row.id,
            version: row.version,
            status: row.status,
            description: row.description,
            teamId: row.teamId,
            category: row.category,
            type: row.type,
            defaultModel: row.defaultModel,
            isDefault: row.isDefault,
            identity: row.identity as AgentIdentity,
            soul: row.soul as AgentSoul,
            rules: row.rules as AgentRuleSet,
            playbook: row.playbook as AgentPlaybook,
            context: row.context as AgentProjectContext,
            markdown: this.buildMarkdownSections(row),
            persona: row.personaConfig as AgentPersonaConfig,
            safeguards: row.safeguardConfig as AgentSafeguards,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
            lastUpdatedBy: row.createdBy || undefined,
        });
    }

    private mapProfileToData(profile: AgentProfile): any {
        return {
            slug: profile.id,
            name: profile.identity.name,
            role: profile.identity.role,
            description: profile.description,
            teamId: profile.teamId,
            category: profile.category,
            type: profile.type,
            defaultModel: profile.defaultModel,
            status: profile.status,
            isDefault: profile.isDefault,
            version: profile.version,
            preferredLocale: "pt-BR",
            fallbackLocale: "en-US",
            identity: profile.identity,
            soul: profile.soul,
            rules: profile.rules,
            playbook: profile.playbook,
            context: profile.context,
            safeguardConfig: profile.safeguards,
            personaConfig: profile.persona,
            updatedAt: new Date(),
        };
    }

    private buildMarkdownSections(row: any): AgentMarkdownSections {
        const identity = row.identity as AgentIdentity;
        const soul = row.soul as AgentSoul;
        const rules = row.rules as AgentRuleSet;
        const playbook = row.playbook as AgentPlaybook;
        const context = row.context as AgentProjectContext;

        return {
            identity: this.createIdentityMarkdown(identity),
            soul: this.createSoulMarkdown(soul),
            rules: this.createRuleMarkdown(rules),
            playbook: this.createPlaybookMarkdown(playbook),
            context: this.createContextMarkdown(context),
        };
    }

    private createIdentityMarkdown(identity: AgentIdentity): string {
        return [
            `# Identity`,
            ``,
            `- Name: ${identity.name}`,
            `- Role: ${identity.role}`,
            `- Mission: ${identity.mission}`,
            `- Scope: ${identity.scope}`,
            `- Communication style: ${identity.communicationStyle}`,
            `- Ecosystem role: ${identity.ecosystemRole}`,
            `- Agent type: ${identity.agentType}`,
            `- Specializations: ${identity.specializations.join(", ")}`,
        ].join("\n");
    }

    private createSoulMarkdown(soul: AgentSoul): string {
        return [
            `# Soul`,
            ``,
            `- Personality: ${soul.personality}`,
            `- Values: ${soul.values.join(", ")}`,
            `- Posture: ${soul.posture}`,
            `- Reasoning style: ${soul.reasoningStyle}`,
            `- User relation: ${soul.userRelation}`,
            `- Ambiguity response: ${soul.ambiguityResponse}`,
            `- Failure response: ${soul.failureResponse}`,
            `- Initiative level: ${soul.initiativeLevel}`,
            `- Subagent relation: ${soul.subagentRelation}`,
        ].join("\n");
    }

    private createRuleMarkdown(rules: AgentRuleSet): string {
        return [
            `# Rules`,
            ``,
            `## Must`,
            ...rules.must.map((item) => `- ${item}`),
            ``,
            `## Must not`,
            ...rules.mustNot.map((item) => `- ${item}`),
            ``,
            `## Delegate when`,
            ...rules.delegateWhen.map((item) => `- ${item}`),
        ].join("\n");
    }

    private createPlaybookMarkdown(playbook: AgentPlaybook): string {
        return [
            `# Playbook`,
            ``,
            `## Start`,
            ...playbook.start.map((item) => `- ${item}`),
            ``,
            `## Execute`,
            ...playbook.execute.map((item) => `- ${item}`),
            ``,
            `## Review`,
            ...playbook.review.map((item) => `- ${item}`),
            ``,
            `## Report`,
            ...playbook.report.map((item) => `- ${item}`),
        ].join("\n");
    }

    private createContextMarkdown(context: AgentProjectContext): string {
        return [
            `# Context`,
            ``,
            `## Stack`,
            ...context.stack.map((item) => `- ${item}`),
            ``,
            `## Architecture`,
            ...context.architecture.map((item) => `- ${item}`),
            ``,
            `## Constraints`,
            ...context.constraints.map((item) => `- ${item}`),
        ].join("\n");
    }

    private async getNextVersionNumber(agentId: string): Promise<number> {
        const latest = await this.prisma.agentVersion.findFirst({
            where: { agentId },
            orderBy: { versionNumber: "desc" },
        });
        return (latest?.versionNumber || 0) + 1;
    }

    private extractVersionNumber(version: string): number {
        const match = /^v?(\d+)/.exec(version);
        return match ? parseInt(match[1], 10) : 1;
    }
}