type JsonRecord = Record<string, unknown>;

export type AgentVersionSnapshot = {
  version: number;
  gitCommit: string;
  manifest: JsonRecord;
  createdAt: string;
};

export type AgentPerformanceRecord = {
  agentId: string;
  date: string;
  latencyP95: number;
  successRate: number;
  throughput: number;
};

export class AgentEvolutionService {
  private readonly versionsByAgent = new Map<string, AgentVersionSnapshot[]>();
  private readonly performanceByAgent = new Map<string, AgentPerformanceRecord[]>();

  snapshotVersion(agentId: string, payload: { gitCommit: string; manifest: JsonRecord }): AgentVersionSnapshot {
    const current = this.versionsByAgent.get(agentId) ?? [];
    const snapshot: AgentVersionSnapshot = {
      version: current.length + 1,
      gitCommit: payload.gitCommit,
      manifest: payload.manifest,
      createdAt: new Date().toISOString()
    };

    current.push(snapshot);
    this.versionsByAgent.set(agentId, current);
    return snapshot;
  }

  getDiff(agentId: string, fromVersion: number, toVersion: number) {
    const versions = this.versionsByAgent.get(agentId) ?? [];
    const from = versions.find((v) => v.version === fromVersion);
    const to = versions.find((v) => v.version === toVersion);

    if (!from || !to) {
      return null;
    }

    const changedKeys = new Set<string>();
    const fromKeys = Object.keys(from.manifest);
    const toKeys = Object.keys(to.manifest);
    [...fromKeys, ...toKeys].forEach((key) => {
      if (JSON.stringify(from.manifest[key]) !== JSON.stringify(to.manifest[key])) {
        changedKeys.add(key);
      }
    });

    return {
      fromVersion,
      toVersion,
      changedKeys: [...changedKeys]
    };
  }

  rollback(agentId: string): AgentVersionSnapshot | null {
    const versions = this.versionsByAgent.get(agentId) ?? [];
    if (versions.length < 2) {
      return null;
    }

    const previous = versions[versions.length - 2];
    const rollbackSnapshot: AgentVersionSnapshot = {
      version: versions.length + 1,
      gitCommit: previous.gitCommit,
      manifest: previous.manifest,
      createdAt: new Date().toISOString()
    };

    versions.push(rollbackSnapshot);
    this.versionsByAgent.set(agentId, versions);
    return rollbackSnapshot;
  }

  recordPerformance(agentId: string, payload: Omit<AgentPerformanceRecord, 'agentId'>): AgentPerformanceRecord {
    const current = this.performanceByAgent.get(agentId) ?? [];
    const record: AgentPerformanceRecord = {
      agentId,
      ...payload
    };
    current.push(record);
    this.performanceByAgent.set(agentId, current);
    return record;
  }

  getPerformance(agentId: string): AgentPerformanceRecord[] {
    return this.performanceByAgent.get(agentId) ?? [];
  }
}

export const agentEvolutionService = new AgentEvolutionService();