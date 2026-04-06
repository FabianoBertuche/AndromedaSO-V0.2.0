export interface AgentBundleFile {
    bundleId: string;
    filePath: string;
    checksum: string;
    manifest: BundleManifest;
}

export interface BundleManifest {
    schemaVersion: string;
    exportedAt: string;
    agent: {
        id: string;
        slug: string;
        name: string;
        role: string;
        description: string;
        version: string;
        locale: string;
        teamId: string;
        category: string;
        type: string;
        defaultModel: string;
        identity: Record<string, unknown>;
        soul: Record<string, unknown>;
        rules: Record<string, unknown>;
        playbook: Record<string, unknown>;
        context: Record<string, unknown>;
        persona: Record<string, unknown>;
        safeguards: Record<string, unknown>;
    };
    includes: {
        knowledge: boolean;
        versions: boolean;
        performance: boolean;
    };
}

export interface BundleOptions {
    includesKnowledge?: boolean;
    includesVersions?: boolean;
    includesPerformance?: boolean;
}

export type AgentImportStatus = "PENDING" | "VALIDATING" | "CONFLICT_DETECTED" | "IMPORTING" | "COMPLETED" | "FAILED";

export type ConflictPolicy = "ABORT" | "RENAME" | "OVERWRITE";

export interface AgentImportJobRecord {
    id: string;
    tenantId: string;
    bundleChecksum: string;
    status: AgentImportStatus;
    conflictPolicy: ConflictPolicy;
    importedAgentId?: string;
    report?: {
        created: string[];
        skipped: string[];
        conflicts: string[];
    };
    errorMessage?: string;
    startedAt: string;
    completedAt?: string;
    createdBy: string;
}