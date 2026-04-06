import {
    ApprovalRequest,
    AgentSandboxConfig,
    SandboxArtifact,
    SandboxExecution,
    SandboxProfile,
} from "./types";

export interface SandboxProfileRepository {
    list(): Promise<SandboxProfile[]>;
    getById(id: string): Promise<SandboxProfile | null>;
    save(profile: SandboxProfile): Promise<SandboxProfile>;
    delete(id: string): Promise<void>;
}

export interface AgentSandboxConfigRepository {
    getByAgentId(agentId: string): Promise<AgentSandboxConfig>;
    save(config: AgentSandboxConfig): Promise<AgentSandboxConfig>;
    list(): Promise<AgentSandboxConfig[]>;
}

export interface SandboxExecutionRepository {
    list(): Promise<SandboxExecution[]>;
    getById(id: string): Promise<SandboxExecution | null>;
    save(execution: SandboxExecution): Promise<SandboxExecution>;
}

export interface SandboxArtifactRepository {
    listByExecutionId(executionId: string): Promise<SandboxArtifact[]>;
    saveByExecutionId(executionId: string, artifacts: SandboxArtifact[]): Promise<void>;
}

export interface ApprovalRequestRepository {
    list(): Promise<ApprovalRequest[]>;
    getById(id: string): Promise<ApprovalRequest | null>;
    save(request: ApprovalRequest): Promise<ApprovalRequest>;
    delete(id: string): Promise<void>;
}
