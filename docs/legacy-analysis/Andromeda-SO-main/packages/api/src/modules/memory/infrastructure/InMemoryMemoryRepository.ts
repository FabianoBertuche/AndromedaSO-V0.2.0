import { v4 as uuidv4 } from "uuid";
import {
    MemoryEntry,
    MemoryListFilters,
    MemoryLink,
    MemoryPolicy,
    MemoryRetrievalRecord,
    MemoryStatus,
} from "../domain/memory";
import { MemoryRepositoryBundle } from "./MemoryRepository";

export class InMemoryMemoryRepositoryBundle implements MemoryRepositoryBundle {
    private readonly entries = new Map<string, MemoryEntry>();
    private readonly links = new Map<string, MemoryLink[]>();
    private readonly usage = new Map<string, MemoryRetrievalRecord[]>();
    private readonly policies = new Map<string, MemoryPolicy>();

    async listEntries(filters: MemoryListFilters = {}): Promise<MemoryEntry[]> {
        return Array.from(this.entries.values())
            .filter((entry) => this.matches(entry, filters))
            .sort((left, right) => Number(right.isPinned) - Number(left.isPinned) || right.importanceScore - left.importanceScore || right.updatedAt.getTime() - left.updatedAt.getTime())
            .slice(0, filters.limit || Number.MAX_SAFE_INTEGER)
            .map((entry) => ({ ...entry, tags: [...entry.tags], metadata: { ...entry.metadata } }));
    }

    async getEntry(id: string, tenantId: string): Promise<MemoryEntry | null> {
        const entry = this.entries.get(id);
        if (entry && entry.tenantId === tenantId) {
            return { ...entry, tags: [...entry.tags], metadata: { ...entry.metadata } };
        }
        return null;
    }

    async createEntry(entry: MemoryEntry): Promise<MemoryEntry> {
        this.entries.set(entry.id, { ...entry, tags: [...entry.tags], metadata: { ...entry.metadata } });
        return this.getEntry(entry.id, entry.tenantId) as Promise<MemoryEntry>;
    }

    async updateEntry(id: string, patch: Partial<MemoryEntry>): Promise<MemoryEntry> {
        const current = this.entries.get(id);
        if (!current || (patch.tenantId && current.tenantId !== patch.tenantId)) {
            throw new Error(`Memory entry ${id} not found or access denied`);
        }
        const next = {
            ...current,
            ...patch,
            tags: patch.tags ? [...patch.tags] : current.tags,
            metadata: patch.metadata ? { ...patch.metadata } : current.metadata,
        };
        this.entries.set(id, next);
        return this.getEntry(id, current.tenantId) as Promise<MemoryEntry>;
    }

    async deleteEntry(id: string, tenantId: string): Promise<void> {
        const entry = this.entries.get(id);
        if (entry && entry.tenantId === tenantId) {
            this.entries.delete(id);
            this.links.delete(id);
            this.usage.delete(id);
        }
    }

    async listLinks(memoryEntryId: string, tenantId: string): Promise<MemoryLink[]> {
        return (this.links.get(memoryEntryId) || [])
            .filter(link => link.tenantId === tenantId)
            .map((link) => ({ ...link }));
    }

    async createLink(link: MemoryLink): Promise<MemoryLink> {
        const current = this.links.get(link.memoryEntryId) || [];
        current.push({ ...link });
        this.links.set(link.memoryEntryId, current);
        return { ...link };
    }

    async listUsage(memoryEntryId: string, tenantId: string): Promise<MemoryRetrievalRecord[]> {
        return (this.usage.get(memoryEntryId) || [])
            .filter(record => record.tenantId === tenantId)
            .map((record) => ({ ...record }));
    }

    async createUsage(record: MemoryRetrievalRecord): Promise<MemoryRetrievalRecord> {
        const current = this.usage.get(record.memoryEntryId) || [];
        current.push({ ...record });
        this.usage.set(record.memoryEntryId, current);
        return { ...record };
    }

    async listPolicies(tenantId: string): Promise<MemoryPolicy[]> {
        return Array.from(this.policies.values())
            .filter(p => p.tenantId === tenantId)
            .map((policy) => ({ ...policy }));
    }

    async getPolicy(id: string, tenantId: string): Promise<MemoryPolicy | null> {
        const policy = this.policies.get(id);
        if (policy && policy.tenantId === tenantId) {
            return { ...policy };
        }
        return null;
    }

    async upsertPolicy(policy: MemoryPolicy): Promise<MemoryPolicy> {
        this.policies.set(policy.id, { ...policy });
        return { ...policy };
    }

    async findPolicy(memoryType: MemoryPolicy["memoryType"], scopeType: MemoryPolicy["scopeType"], tenantId: string): Promise<MemoryPolicy | null> {
        const policy = Array.from(this.policies.values()).find(
            (item) => item.memoryType === memoryType && item.scopeType === scopeType && item.tenantId === tenantId
        );
        return policy ? { ...policy } : null;
    }

    private matches(entry: MemoryEntry, filters: MemoryListFilters): boolean {
        if (filters.tenantId && entry.tenantId !== filters.tenantId) return false;
        if (filters.type && entry.type !== filters.type) return false;
        if (filters.scopeType && entry.scopeType !== filters.scopeType) return false;
        if (filters.agentId && entry.agentId !== filters.agentId) return false;
        if (filters.sessionId && entry.sessionId !== filters.sessionId) return false;
        if (filters.taskId && entry.taskId !== filters.taskId) return false;
        if (filters.projectId && entry.projectId !== filters.projectId) return false;
        if (filters.userId && entry.userId !== filters.userId) return false;
        if (filters.teamId && entry.teamId !== filters.teamId) return false;
        if (filters.status && entry.status !== filters.status) return false;
        if (filters.pinnedOnly && !entry.isPinned) return false;
        if (filters.q && !this.matchesQuery(entry, filters.q)) return false;
        if (entry.status === "deleted") return false;
        if (entry.expiresAt && entry.expiresAt.getTime() < Date.now()) return false;
        return true;
    }

    private matchesQuery(entry: MemoryEntry, query: string): boolean {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return true;
        }

        const haystack = [
            entry.id,
            entry.type,
            entry.scopeType,
            entry.scopeId,
            entry.title,
            entry.content,
            entry.summary || "",
            entry.source,
            ...(entry.tags || []),
            JSON.stringify(entry.metadata || {}),
        ].join(" ").toLowerCase();

        return haystack.includes(normalized);
    }
}
