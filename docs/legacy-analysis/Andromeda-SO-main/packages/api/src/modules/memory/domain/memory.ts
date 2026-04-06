export type MemoryType = "session" | "episodic" | "semantic";
export type MemoryScopeType = "session" | "task" | "agent" | "project" | "user" | "team";
export type MemoryStatus = "active" | "archived" | "invalidated" | "deleted";
export type MemoryRetentionMode = "ttl" | "session" | "task" | "persistent";

export interface MemoryPolicy {
    id: string;
    memoryType: MemoryType;
    scopeType: MemoryScopeType;
    retentionMode: MemoryRetentionMode;
    ttlDays?: number | null;
    maxEntries?: number | null;
    allowAutoPromotion: boolean;
    allowManualPin: boolean;
    allowSemanticExtraction: boolean;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface MemoryEntry {
    id: string;
    type: MemoryType;
    scopeType: MemoryScopeType;
    scopeId: string;
    agentId?: string | null;
    taskId?: string | null;
    sessionId?: string | null;
    projectId?: string | null;
    userId?: string | null;
    teamId?: string | null;
    title: string;
    content: string;
    summary?: string | null;
    tags: string[];
    source: string;
    sourceEventId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    expiresAt?: Date | null;
    isPinned: boolean;
    status: MemoryStatus;
    importanceScore: number;
    tenantId: string;
    metadata: Record<string, unknown>;
}

export interface MemoryLink {
    id: string;
    memoryEntryId: string;
    linkedEntityType: string;
    linkedEntityId: string;
    relationType: string;
    tenantId: string;
    createdAt: Date;
}

export interface MemoryRetrievalRecord {
    id: string;
    taskId: string;
    agentId?: string | null;
    sessionId?: string | null;
    memoryEntryId: string;
    retrievalReason: string;
    retrievalScore: number;
    usedInPromptAssembly: boolean;
    usedAt: Date;
    tenantId: string;
    createdAt: Date;
}

export interface MemoryListFilters {
    type?: MemoryType;
    scopeType?: MemoryScopeType;
    agentId?: string;
    sessionId?: string;
    taskId?: string;
    projectId?: string;
    userId?: string;
    teamId?: string;
    status?: MemoryStatus;
    tenantId?: string;
    pinnedOnly?: boolean;
    q?: string;
    limit?: number;
}

export interface MemoryRetrievalCriteria {
    taskId: string;
    agentId?: string;
    sessionId?: string;
    projectId?: string;
    userId?: string;
    teamId?: string;
    interactionMode?: string;
    prompt: string;
    limit?: number;
}

export interface MemoryRetrievalResult {
    entries: MemoryEntry[];
    blocks: string[];
}

export interface MemoryRegistrationInput {
    type: MemoryType;
    scopeType: MemoryScopeType;
    scopeId: string;
    title: string;
    content: string;
    summary?: string;
    tags?: string[];
    source: string;
    sourceEventId?: string;
    agentId?: string;
    taskId?: string;
    sessionId?: string;
    projectId?: string;
    userId?: string;
    teamId?: string;
    expiresAt?: Date | null;
    isPinned?: boolean;
    status?: MemoryStatus;
    importanceScore?: number;
    tenantId?: string;
    metadata?: Record<string, unknown>;
}

export interface MemoryUsageInput {
    taskId: string;
    agentId?: string;
    sessionId?: string;
    memoryEntryId: string;
    retrievalReason: string;
    retrievalScore: number;
    usedInPromptAssembly: boolean;
}
