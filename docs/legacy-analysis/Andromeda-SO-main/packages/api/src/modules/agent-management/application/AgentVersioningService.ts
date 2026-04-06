import { AgentProfile, normalizeAgentProfile } from "../domain/agent-profile";

export interface AgentVersionRecord {
    versionNumber: number;
    sourceVersionLabel?: string;
    changeSummary: string;
    restoredFromVersionNumber?: number;
    createdBy?: string;
    createdAt: string;
    snapshot: AgentProfile;
}

export interface AgentVersionRepository {
    list(agentId: string, tenantId?: string): Promise<AgentVersionRecord[]>;
    get(agentId: string, versionNumber: number, tenantId?: string): Promise<AgentVersionRecord | null>;
    create(input: {
        agentId: string;
        tenantId: string;
        sourceVersionLabel?: string;
        changeSummary: string;
        restoredFromVersionNumber?: number;
        createdBy?: string;
        snapshot: AgentProfile;
    }): Promise<AgentVersionRecord>;
}

export class AgentVersioningService {
    constructor(private readonly repository: AgentVersionRepository) { }

    async listVersions(agentId: string, tenantId = "default"): Promise<AgentVersionRecord[]> {
        return this.repository.list(agentId, tenantId);
    }

    async getVersion(agentId: string, versionNumber: number, tenantId = "default"): Promise<AgentVersionRecord | null> {
        return this.repository.get(agentId, versionNumber, tenantId);
    }

    async recordCurrentVersion(
        profile: AgentProfile,
        summary: string,
        options: { tenantId?: string; restoredFromVersionNumber?: number; createdBy?: string } = {},
    ): Promise<AgentVersionRecord> {
        const tenantId = options.tenantId || profile.teamId || "default";
        const normalized = normalizeAgentProfile(profile);
        const existing = await this.repository.list(profile.id, tenantId);
        const latest = existing[0];

        if (latest && snapshotsMatch(latest.snapshot, normalized)) {
            return latest;
        }

        return this.repository.create({
            agentId: profile.id,
            tenantId,
            sourceVersionLabel: profile.version,
            changeSummary: summary,
            restoredFromVersionNumber: options.restoredFromVersionNumber,
            createdBy: options.createdBy,
            snapshot: normalized,
        });
    }
}

function snapshotsMatch(left: AgentProfile, right: AgentProfile): boolean {
    return JSON.stringify(normalizeAgentProfile(left)) === JSON.stringify(normalizeAgentProfile(right));
}
