import { v4 as uuidv4 } from "uuid";
import { Task, globalEventBus } from "@andromeda/core";
import { createDefaultMemoryPolicies } from "../domain/defaults";
import { MemoryAttachedToExecution, MemoryDeleted, MemoryInvalidated, MemoryPinned, MemoryPromoted, MemoryRetrieved, MemoryStored } from "../domain/events";
import {
    MemoryEntry,
    MemoryListFilters,
    MemoryPolicy,
    MemoryRegistrationInput,
    MemoryRetrievalCriteria,
    MemoryRetrievalResult,
    MemoryUsageInput,
} from "../domain/memory";
import { MemoryRepositoryBundle } from "../infrastructure/MemoryRepository";

const DEFAULT_TENANT_ID = "default";

export class MemoryService {
    constructor(private readonly repositories: MemoryRepositoryBundle) { }

    async ensureDefaultPolicies(): Promise<void> {
        const existing = await this.repositories.listPolicies(DEFAULT_TENANT_ID);
        if (existing.length > 0) {
            return;
        }

        for (const policy of createDefaultMemoryPolicies()) {
            await this.repositories.upsertPolicy(policy);
        }
    }

    async listMemory(filters: MemoryListFilters = {}): Promise<MemoryEntry[]> {
        return this.repositories.listEntries({
            ...filters,
            tenantId: filters.tenantId || DEFAULT_TENANT_ID,
        });
    }

    async getMemory(id: string): Promise<MemoryEntry | null> {
        return this.repositories.getEntry(id, DEFAULT_TENANT_ID);
    }

    async getMemoryLinks(id: string) {
        return this.repositories.listLinks(id, DEFAULT_TENANT_ID);
    }

    async getMemoryUsage(id: string) {
        return this.repositories.listUsage(id, DEFAULT_TENANT_ID);
    }

    async listPolicies(): Promise<MemoryPolicy[]> {
        await this.ensureDefaultPolicies();
        return this.repositories.listPolicies(DEFAULT_TENANT_ID);
    }

    async getPolicy(id: string): Promise<MemoryPolicy | null> {
        await this.ensureDefaultPolicies();
        return this.repositories.getPolicy(id, DEFAULT_TENANT_ID);
    }

    async upsertPolicy(policy: MemoryPolicy): Promise<MemoryPolicy> {
        return this.repositories.upsertPolicy(policy);
    }

    async registerSessionMemory(input: MemoryRegistrationInput): Promise<MemoryEntry> {
        const entry = await this.repositories.createEntry(this.normalizeEntry(input, "session"));
        globalEventBus.publish(new MemoryStored(entry.id, entry.type, entry.scopeType));
        return entry;
    }

    async registerEpisodicMemory(input: MemoryRegistrationInput): Promise<MemoryEntry> {
        const entry = await this.repositories.createEntry(this.normalizeEntry(input, "episodic"));
        globalEventBus.publish(new MemoryStored(entry.id, entry.type, entry.scopeType));
        return entry;
    }

    async registerSemanticMemory(input: MemoryRegistrationInput): Promise<MemoryEntry> {
        const entry = await this.repositories.createEntry(this.normalizeEntry(input, "semantic"));
        globalEventBus.publish(new MemoryStored(entry.id, entry.type, entry.scopeType));
        return entry;
    }

    async pinMemory(id: string): Promise<MemoryEntry> {
        const entry = await this.requireEntry(id);
        const updated = await this.repositories.updateEntry(id, {
            ...entry,
            isPinned: true,
            updatedAt: new Date(),
        });
        globalEventBus.publish(new MemoryPinned(updated.id));
        return updated;
    }

    async invalidateMemory(id: string): Promise<MemoryEntry> {
        const entry = await this.requireEntry(id);
        const updated = await this.repositories.updateEntry(id, {
            ...entry,
            status: "invalidated",
            updatedAt: new Date(),
        });
        globalEventBus.publish(new MemoryInvalidated(updated.id));
        return updated;
    }

    async promoteMemory(id: string, targetType: "episodic" | "semantic" = "semantic"): Promise<MemoryEntry> {
        const entry = await this.requireEntry(id);
        const promoted = await this.repositories.createEntry({
            ...entry,
            id: uuidv4(),
            type: targetType,
            status: "active",
            source: `${entry.source}:promoted`,
            sourceEventId: entry.sourceEventId,
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: true,
            importanceScore: Math.min(100, entry.importanceScore + 10),
            metadata: {
                ...entry.metadata,
                promotedFromMemoryId: entry.id,
            },
        });

        globalEventBus.publish(new MemoryPromoted(promoted.id, entry.id, targetType));

        return promoted;
    }

    async deleteMemoryEntry(id: string): Promise<void> {
        await this.repositories.deleteEntry(id, DEFAULT_TENANT_ID);
        globalEventBus.publish(new MemoryDeleted(id));
    }

    async retrieveMemoryForTask(criteria: MemoryRetrievalCriteria): Promise<MemoryRetrievalResult> {
        await this.ensureDefaultPolicies();
        const candidates = await this.repositories.listEntries({
            status: "active",
            pinnedOnly: false,
            limit: 200,
            tenantId: DEFAULT_TENANT_ID,
        });

        const scored = candidates
            .filter((entry) => this.isApplicable(entry, criteria))
            .map((entry) => ({
                entry,
                score: this.scoreEntry(entry, criteria),
                reason: this.buildRetrievalReason(entry, criteria),
            }))
            .sort((left, right) => {
                if (right.score !== left.score) {
                    return right.score - left.score;
                }
                if (right.entry.isPinned !== left.entry.isPinned) {
                    return Number(right.entry.isPinned) - Number(left.entry.isPinned);
                }
                return right.entry.updatedAt.getTime() - left.entry.updatedAt.getTime();
            })
            .slice(0, criteria.limit || 8);

        return {
            entries: scored.map((item) => item.entry),
            blocks: scored.map((item) => this.renderBlock(item.entry, item.score, item.reason)),
        };
    }

    async attachMemoryToExecutionContext(criteria: MemoryRetrievalCriteria): Promise<MemoryRetrievalResult> {
        const result = await this.retrieveMemoryForTask(criteria);
        const usedAt = new Date();

        for (const entry of result.entries) {
            await this.repositories.createUsage({
                id: uuidv4(),
                taskId: criteria.taskId,
                agentId: criteria.agentId,
                sessionId: criteria.sessionId,
                memoryEntryId: entry.id,
                retrievalReason: this.buildRetrievalReason(entry, criteria),
                retrievalScore: this.scoreEntry(entry, criteria),
                usedInPromptAssembly: true,
                usedAt,
                tenantId: entry.tenantId,
                createdAt: usedAt,
            });
            globalEventBus.publish(new MemoryRetrieved(criteria.taskId, criteria.agentId, criteria.sessionId, entry.id, this.scoreEntry(entry, criteria)));
        }

        globalEventBus.publish(new MemoryAttachedToExecution(criteria.taskId, criteria.agentId, criteria.sessionId, result.entries.map((entry) => entry.id)));

        return result;
    }

    async registerExecutionMemory(task: Task): Promise<{ episodic?: MemoryEntry; semantic?: MemoryEntry }> {
        const metadata = task.getMetadata();
        const result = task.getResult();
        const audit = task.getAuditParecer();
        const summary = typeof result?.content === "string"
            ? result.content.slice(0, 500)
            : JSON.stringify(result || audit || {});
        const shared = {
            title: `Task ${task.getId()} ${task.getStatus()}`,
            content: summary,
            summary: typeof result?.content === "string" ? result.content.slice(0, 180) : undefined,
            tags: this.collectTags(metadata),
            source: "task.execution",
            sourceEventId: task.getId(),
            taskId: task.getId(),
            sessionId: task.getSessionId() || metadata.sessionId,
            agentId: metadata.targetAgentId,
            projectId: metadata.targetProjectId,
            userId: metadata.userId,
            teamId: metadata.targetTeamId,
            metadata: {
                modelId: metadata.modelId,
                interactionMode: metadata.interactionMode,
                audit,
                result,
            },
        };

        const episodic = await this.registerEpisodicMemory({
            ...shared,
            type: "episodic",
            scopeType: "task",
            scopeId: task.getId(),
            importanceScore: this.deriveImportanceFromTask(task),
            isPinned: false,
            expiresAt: null,
        });

        const semanticCandidate = this.createSemanticCandidate(task, shared);
        const semantic = semanticCandidate ? await this.registerSemanticMemory(semanticCandidate) : undefined;

        return { episodic, semantic };
    }

    async registerSessionMessageMemory(input: {
        sessionId: string;
        agentId?: string;
        taskId?: string;
        userId?: string;
        teamId?: string;
        title: string;
        content: string;
        tags?: string[];
        sourceEventId?: string;
        metadata?: Record<string, unknown>;
    }): Promise<MemoryEntry> {
        return this.registerSessionMemory({
            type: "session",
            scopeType: "session",
            scopeId: input.sessionId,
            sessionId: input.sessionId,
            agentId: input.agentId,
            taskId: input.taskId,
            userId: input.userId,
            teamId: input.teamId,
            title: input.title,
            content: input.content,
            tags: input.tags,
            source: "gateway.message",
            sourceEventId: input.sourceEventId,
            metadata: input.metadata,
            isPinned: false,
            importanceScore: 45,
            status: "active",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
    }

    private normalizeEntry(input: MemoryRegistrationInput, type: "session" | "episodic" | "semantic"): MemoryEntry {
        const now = new Date();
        const resolvedAgentId = input.agentId || (input.scopeType === "agent" ? input.scopeId : undefined);
        const resolvedTaskId = input.taskId || (input.scopeType === "task" ? input.scopeId : undefined);
        const resolvedSessionId = input.sessionId || (input.scopeType === "session" ? input.scopeId : undefined);
        const resolvedProjectId = input.projectId || (input.scopeType === "project" ? input.scopeId : undefined);
        const resolvedUserId = input.userId || (input.scopeType === "user" ? input.scopeId : undefined);
        const resolvedTeamId = input.teamId || (input.scopeType === "team" ? input.scopeId : undefined);
        return {
            id: uuidv4(),
            type,
            scopeType: input.scopeType,
            scopeId: input.scopeId,
            agentId: resolvedAgentId || null,
            taskId: resolvedTaskId || null,
            sessionId: resolvedSessionId || null,
            projectId: resolvedProjectId || null,
            userId: resolvedUserId || null,
            teamId: resolvedTeamId || null,
            title: input.title,
            content: input.content,
            summary: input.summary || null,
            tags: input.tags || [],
            source: input.source,
            sourceEventId: input.sourceEventId || null,
            createdAt: now,
            updatedAt: now,
            expiresAt: input.expiresAt === undefined ? null : input.expiresAt,
            isPinned: input.isPinned ?? false,
            status: input.status || "active",
            importanceScore: input.importanceScore ?? 50,
            tenantId: input.tenantId || DEFAULT_TENANT_ID,
            metadata: input.metadata || {},
        };
    }

    private async requireEntry(id: string): Promise<MemoryEntry> {
        const entry = await this.repositories.getEntry(id, DEFAULT_TENANT_ID);
        if (!entry) {
            throw new Error(`Memory entry ${id} not found`);
        }
        return entry;
    }

    private isApplicable(entry: MemoryEntry, criteria: MemoryRetrievalCriteria): boolean {
        if (entry.status !== "active") {
            return false;
        }

        if (entry.expiresAt && entry.expiresAt.getTime() < Date.now()) {
            return false;
        }

        if (entry.sessionId && criteria.sessionId && entry.sessionId === criteria.sessionId) {
            return true;
        }

        if (entry.agentId && criteria.agentId && entry.agentId === criteria.agentId) {
            return true;
        }

        if (entry.projectId && criteria.projectId && entry.projectId === criteria.projectId) {
            return true;
        }

        if (entry.userId && criteria.userId && entry.userId === criteria.userId) {
            return true;
        }

        if (entry.teamId && criteria.teamId && entry.teamId === criteria.teamId) {
            return true;
        }

        return entry.scopeType === "session" || entry.scopeType === "task";
    }

    private scoreEntry(entry: MemoryEntry, criteria: MemoryRetrievalCriteria): number {
        const now = Date.now();
        const ageDays = Math.max(0, (now - entry.updatedAt.getTime()) / (24 * 60 * 60 * 1000));
        const recencyScore = Math.max(0, 30 - ageDays * 5);
        const promptTokens = this.tokenize(criteria.prompt);
        const entryTokens = this.tokenize(`${entry.title} ${entry.summary || ""} ${entry.content}`);
        const overlap = promptTokens.filter((token) => entryTokens.includes(token)).length;

        let score = entry.importanceScore + recencyScore + overlap * 2;
        if (entry.isPinned) score += 20;
        if (entry.sessionId && criteria.sessionId && entry.sessionId === criteria.sessionId) score += 50;
        if (entry.agentId && criteria.agentId && entry.agentId === criteria.agentId) score += 25;
        if (entry.projectId && criteria.projectId && entry.projectId === criteria.projectId) score += 15;
        if (entry.userId && criteria.userId && entry.userId === criteria.userId) score += 10;
        if (entry.teamId && criteria.teamId && entry.teamId === criteria.teamId) score += 10;
        if (entry.type === "session") score += 8;
        if (entry.type === "episodic") score += 5;
        return Math.min(100, score);
    }

    private buildRetrievalReason(entry: MemoryEntry, criteria: MemoryRetrievalCriteria): string {
        const reasons: string[] = [];
        if (entry.sessionId === criteria.sessionId) reasons.push("same_session");
        if (entry.agentId === criteria.agentId) reasons.push("same_agent");
        if (entry.projectId === criteria.projectId) reasons.push("same_project");
        if (entry.userId === criteria.userId) reasons.push("same_user");
        if (entry.teamId === criteria.teamId) reasons.push("same_team");
        if (entry.isPinned) reasons.push("pinned");
        if (entry.type === "session") reasons.push("session_memory");
        if (entry.type === "episodic") reasons.push("episodic_memory");
        if (entry.type === "semantic") reasons.push("semantic_memory");
        if (criteria.interactionMode) reasons.push(`mode:${criteria.interactionMode}`);
        return reasons.join(", ") || "contextual_relevance";
    }

    private renderBlock(entry: MemoryEntry, score: number, reason: string): string {
        return [
            `[${entry.type.toUpperCase()} | score=${score.toFixed(1)} | ${reason}]`,
            `Title: ${entry.title}`,
            `Summary: ${entry.summary || entry.content.slice(0, 220)}`,
            `Tags: ${(entry.tags || []).join(", ") || "none"}`,
            `Source: ${entry.source}`,
        ].join("\n");
    }

    private collectTags(metadata: Record<string, any>): string[] {
        const tags = new Set<string>();
        for (const key of ["targetAgentId", "targetTeamId", "interactionMode", "modelId", "sessionId"]) {
            if (typeof metadata[key] === "string" && metadata[key].trim()) {
                tags.add(metadata[key].trim());
            }
        }
        return Array.from(tags);
    }

    private deriveImportanceFromTask(task: Task): number {
        const status = task.getStatus();
        if (status === "completed") return 78;
        if (status === "failed") return 42;
        return 55;
    }

    private createSemanticCandidate(task: Task, shared: {
        title: string;
        content: string;
        summary?: string | null;
        tags: string[];
        source: string;
        sourceEventId?: string | null;
        taskId?: string | null;
        sessionId?: string | null;
        agentId?: string | null;
        projectId?: string | null;
        userId?: string | null;
        teamId?: string | null;
        metadata: Record<string, unknown>;
    }): MemoryRegistrationInput | null {
        const result = task.getResult();
        const audit = task.getAuditParecer();
        const fact = typeof result?.content === "string" ? result.content.trim() : "";
        if (!fact || fact.length < 40) {
            return null;
        }

        return {
            ...shared,
            type: "semantic",
            scopeType: shared.agentId ? "agent" : "project",
            scopeId: shared.agentId || shared.projectId || shared.sessionId || task.getId(),
            title: `Consolidated memory from task ${task.getId()}`,
            content: fact,
            summary: fact.slice(0, 180),
            source: "task.consolidation",
            sourceEventId: task.getId(),
            isPinned: false,
            importanceScore: Math.min(95, this.deriveImportanceFromTask(task) + 10),
            metadata: {
                ...shared.metadata,
                audit,
            },
            agentId: shared.agentId || undefined,
            taskId: shared.taskId || undefined,
            sessionId: shared.sessionId || undefined,
            projectId: shared.projectId || undefined,
            userId: shared.userId || undefined,
            teamId: shared.teamId || undefined,
        };
    }

    private tokenize(value: string): string[] {
        return value
            .toLowerCase()
            .replace(/[^\p{L}\p{N}\s]+/gu, " ")
            .split(/\s+/)
            .map((token) => token.trim())
            .filter((token) => token.length > 2)
            .slice(0, 80);
    }
}
