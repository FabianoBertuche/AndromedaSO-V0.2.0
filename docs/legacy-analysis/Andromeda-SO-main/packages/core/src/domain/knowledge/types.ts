export enum KnowledgeScopeType {
    AGENT = 'agent',
    TEAM = 'team',
    PROJECT = 'project',
    SHARED = 'shared'
}

export enum KnowledgeSourceType {
    UPLOAD = 'upload',
    MANUAL = 'manual',
    VAULT = 'vault'
}

export enum KnowledgeStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    ARCHIVED = 'archived'
}

export interface KnowledgeCollection {
    id: string;
    name: string;
    description?: string;
    scopeType: KnowledgeScopeType;
    scopeId: string;
    sourceType: KnowledgeSourceType;
    status: KnowledgeStatus;
    metadata: Record<string, any>;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface KnowledgeDocument {
    id: string;
    collectionId: string;
    title: string;
    sourceType: KnowledgeSourceType;
    sourcePath?: string;
    mimeType?: string;
    rawText?: string;
    checksum?: string;
    status: KnowledgeStatus;
    metadata: Record<string, any>;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface KnowledgeChunk {
    id: string;
    documentId: string;
    ordinal: number;
    content: string;
    tokenEstimate?: number;
    embeddingRef?: string;
    metadata: Record<string, any>;
    tenantId?: string;
    createdAt: Date;
}

export interface RetrievalResult {
    chunk: KnowledgeChunk;
    document: KnowledgeDocument;
    score: number;
}

export interface AgentKnowledgePolicy {
    id: string;
    agentId: string;
    knowledgeEnabled: boolean;
    vaultReadEnabled: boolean;
    vaultWriteEnabled: boolean;
    writeMode: 'disabled' | 'draft_only' | 'append_only' | 'managed_write';
    approvalRequired: boolean;
    allowedCollectionIds: string[];
    allowedPaths: string[];
    maxChunks: number;
    maxContextTokens: number;
    rerankEnabled: boolean;
    preferMemoryOverKnowledge: boolean;
    preferKnowledgeOverMemory: boolean;
    tenantId: string;
    createdAt: Date;
    updatedAt: Date;
}
