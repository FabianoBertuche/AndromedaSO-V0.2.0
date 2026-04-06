import { Task, TaskRepository } from "@andromeda/core";
import {
    AgentConformanceReport,
    AgentHistoryItem,
    AgentListItem,
    AgentProfile,
    AgentProfileHistoryEntry,
    AgentProfilePatch,
    AgentSafeguards,
    AgentSessionHistoryItem,
    AgentPersonaConfig,
    CreateAgentInput,
    bumpSemanticVersion,
    createDefaultAgentProfile,
    createHistoryEntry,
    mergeAgentProfile,
    sanitizePersonaPatch,
} from "../domain/agent-profile";
import { AgentProfileRepository } from "../infrastructure/FileSystemAgentProfileRepository";
import { AgentVersioningService } from "./AgentVersioningService";

export class AgentProfileService {
    constructor(
        private readonly repository: AgentProfileRepository,
        private readonly taskRepository?: TaskRepository,
        private readonly versioningService?: AgentVersioningService,
    ) { }

    async listAgents(): Promise<AgentListItem[]> {
        const profiles = await this.repository.list();
        const tasks = await this.getTasks();
        return profiles.map((profile) => this.toListItem(profile, tasks));
    }

    async listProfilesRaw(): Promise<AgentProfile[]> {
        return this.repository.list();
    }

    async getProfile(id: string): Promise<AgentProfile> {
        const profile = await this.repository.getById(id);
        if (!profile) {
            throw new Error(`Agent ${id} not found`);
        }
        return profile;
    }

    async getOptionalProfile(id: string): Promise<AgentProfile | null> {
        return this.repository.getById(id);
    }

    async getAgentView(id: string) {
        const profile = await this.getProfile(id);
        const tasks = await this.getTasks();
        return {
            ...this.toListItem(profile, tasks),
            description: profile.description,
            safeguards: profile.safeguards,
            persona: profile.persona,
            specializations: profile.identity.specializations,
        };
    }

    async getActiveProfile(id?: string): Promise<AgentProfile> {
        if (id) {
            return this.getProfile(id);
        }

        const profiles = await this.repository.list();
        const active = profiles.find((profile) => profile.isDefault && profile.status === "active")
            || profiles.find((profile) => profile.status === "active");

        if (!active) {
            throw new Error("No active agent profile is available");
        }

        return active;
    }

    async createAgent(input: CreateAgentInput): Promise<AgentProfile> {
        const profile = createDefaultAgentProfile(input);
        const saved = await this.repository.save(profile, { summary: "created via API" });
        await this.versioningService?.recordCurrentVersion(saved, "created via API", { tenantId: "default" });
        return saved;
    }

    async updateAgent(id: string, patch: AgentProfilePatch): Promise<AgentProfile> {
        const current = await this.getProfile(id);
        const updated = mergeAgentProfile(current, patch);
        if (profilesMatch(current, updated)) {
            return current;
        }
        updated.version = bumpSemanticVersion(current.version);
        updated.updatedAt = new Date().toISOString();
        const saved = await this.repository.save(updated, { summary: "agent metadata updated" });
        await this.versioningService?.recordCurrentVersion(saved, "agent metadata updated", { tenantId: "default" });
        return saved;
    }

    async updateProfile(id: string, patch: AgentProfilePatch): Promise<AgentProfile> {
        return this.updateAgent(id, patch);
    }

    async deleteAgent(id: string): Promise<void> {
        const profile = await this.getProfile(id);
        if (profile.isDefault) {
            throw new Error("The default agent cannot be deleted");
        }
        await this.repository.delete(id);
    }

    async getBehavior(id: string): Promise<AgentPersonaConfig> {
        return (await this.getProfile(id)).persona;
    }

    async updateBehavior(id: string, patch: Partial<AgentPersonaConfig>): Promise<AgentPersonaConfig> {
        const current = await this.getProfile(id);
        const updated = mergeAgentProfile(current, {
            persona: sanitizePersonaPatch({
                ...current.persona,
                ...patch,
            }),
        });
        if (profilesMatch(current, updated)) {
            return current.persona;
        }
        updated.version = bumpSemanticVersion(current.version);
        updated.updatedAt = new Date().toISOString();

        const saved = await this.repository.save(updated, { summary: "behavior updated" });
        await this.versioningService?.recordCurrentVersion(saved, "behavior updated", { tenantId: "default" });
        return saved.persona;
    }

    async getSafeguards(id: string): Promise<AgentSafeguards> {
        return (await this.getProfile(id)).safeguards;
    }

    async updateSafeguards(id: string, patch: Partial<AgentSafeguards>): Promise<AgentSafeguards> {
        const current = await this.getProfile(id);
        const updated = mergeAgentProfile(current, {
            safeguards: {
                ...current.safeguards,
                ...patch,
            },
        });
        if (profilesMatch(current, updated)) {
            return current.safeguards;
        }
        updated.version = bumpSemanticVersion(current.version);
        updated.updatedAt = new Date().toISOString();

        const saved = await this.repository.save(updated, { summary: "safeguards updated" });
        await this.versioningService?.recordCurrentVersion(saved, "safeguards updated", { tenantId: "default" });
        return saved.safeguards;
    }

    async listStoredVersions(id: string): Promise<Array<{
        versionNumber: number;
        sourceVersionLabel?: string;
        changeSummary: string;
        restoredFromVersionNumber?: number;
        createdBy?: string;
        createdAt: string;
    }>> {
        const profile = await this.getProfile(id);
        const versions = await this.versioningService?.listVersions(id, "default") || [];
        if (versions.length === 0) {
            await this.versioningService?.recordCurrentVersion(profile, "current profile", { tenantId: "default" });
        }
        const refreshed = await this.versioningService?.listVersions(id, "default") || [];

        return refreshed.map((entry) => ({
            versionNumber: entry.versionNumber,
            sourceVersionLabel: entry.sourceVersionLabel,
            changeSummary: entry.changeSummary,
            restoredFromVersionNumber: entry.restoredFromVersionNumber,
            createdBy: entry.createdBy,
            createdAt: entry.createdAt,
        }));
    }

    async restoreStoredVersion(id: string, versionNumber: number): Promise<{ profile: AgentProfile; restoredVersionNumber: number; currentVersionNumber: number; }> {
        const current = await this.getProfile(id);
        const version = await this.versioningService?.getVersion(id, versionNumber, "default");
        if (!version) {
            throw new Error(`Version ${versionNumber} not found for agent ${id}`);
        }

        const restored: AgentProfile = {
            ...version.snapshot,
            version: bumpSemanticVersion(current.version),
            updatedAt: new Date().toISOString(),
        };
        const saved = await this.repository.save(restored, { summary: `restored from stored version ${versionNumber}` });
        const created = await this.versioningService?.recordCurrentVersion(saved, `restored from stored version ${versionNumber}`, {
            tenantId: "default",
            restoredFromVersionNumber: versionNumber,
        });

        return {
            profile: saved,
            restoredVersionNumber: versionNumber,
            currentVersionNumber: created?.versionNumber || versionNumber,
        };
    }

    async listHistory(id: string): Promise<AgentProfileHistoryEntry[]> {
        const current = await this.getProfile(id);
        const history = await this.repository.listHistory(id);
        const currentEntry = createHistoryEntry(current, "current profile");

        if (history.some((entry) => entry.version === current.version)) {
            return history;
        }

        return [currentEntry, ...history].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
    }

    async restoreProfile(id: string, version: string): Promise<AgentProfile> {
        return this.repository.restore(id, version);
    }

    async getConformance(id: string) {
        const history = await this.getHistory(id);
        const reports = history
            .map((entry) => entry.audit)
            .filter((audit): audit is AgentConformanceReport => Boolean(audit));

        const averageOverallConformanceScore = reports.length > 0
            ? Math.round(reports.reduce((sum, report) => sum + report.overallConformanceScore, 0) / reports.length)
            : undefined;

        return {
            agentId: id,
            averageOverallConformanceScore,
            lastExecutionAt: history[0]?.updatedAt,
            recentExecutions: reports,
            recentViolations: reports.flatMap((report) => report.violations).slice(0, 10),
        };
    }

    async getHistory(id: string): Promise<AgentHistoryItem[]> {
        const tasks = await this.getTasks();
        return tasks
            .filter((task) => resolveTaskAgentId(task) === id)
            .sort((left, right) => right.getUpdatedAt().getTime() - left.getUpdatedAt().getTime())
            .map((task) => ({
                taskId: task.getId(),
                sessionId: String(task.getMetadata().sessionId || task.getSessionId() || ""),
                prompt: task.getRawRequest(),
                status: task.getStatus(),
                createdAt: task.getCreatedAt().toISOString(),
                updatedAt: task.getUpdatedAt().toISOString(),
                model: task.getResult()?.model,
                audit: resolveTaskAudit(task),
            }));
    }

    async getTestSessions(id: string): Promise<AgentSessionHistoryItem[]> {
        const history = await this.getHistory(id);
        const sessionMap = new Map<string, AgentSessionHistoryItem>();

        for (const item of history) {
            if (!item.sessionId) {
                continue;
            }

            const current = sessionMap.get(item.sessionId);
            if (!current) {
                sessionMap.set(item.sessionId, {
                    sessionId: item.sessionId,
                    lastActivityAt: item.updatedAt,
                    taskCount: 1,
                });
                continue;
            }

            current.taskCount += 1;
            if (item.updatedAt > current.lastActivityAt) {
                current.lastActivityAt = item.updatedAt;
            }
        }

        return [...sessionMap.values()].sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt));
    }

    private async getTasks(): Promise<Task[]> {
        return this.taskRepository ? this.taskRepository.findAll() : [];
    }

    private toListItem(profile: AgentProfile, tasks: Task[]): AgentListItem {
        const relatedTasks = tasks
            .filter((task) => resolveTaskAgentId(task) === profile.id)
            .sort((left, right) => right.getUpdatedAt().getTime() - left.getUpdatedAt().getTime());

        return {
            id: profile.id,
            name: profile.identity.name,
            role: profile.identity.role,
            category: profile.category,
            teamId: profile.teamId,
            status: profile.status,
            type: profile.type,
            defaultModel: profile.defaultModel,
            profileVersion: profile.version,
            identityActive: profile.status === "active",
            recentConformanceScore: resolveTaskAudit(relatedTasks[0])?.overallConformanceScore,
            lastExecutionAt: relatedTasks[0]?.getUpdatedAt().toISOString(),
        };
    }
}

function profilesMatch(left: AgentProfile, right: AgentProfile): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

function resolveTaskAgentId(task: Task): string | undefined {
    const metadata = task.getMetadata();
    return typeof metadata.targetAgentId === "string"
        ? metadata.targetAgentId
        : task.getResult()?.agent?.id;
}

function resolveTaskAudit(task: Task | undefined): AgentConformanceReport | undefined {
    if (!task) {
        return undefined;
    }
    return task.getAuditParecer() || task.getResult()?.audit;
}
