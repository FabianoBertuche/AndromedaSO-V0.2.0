import crypto from "node:crypto";

export type SandboxMode = "none" | "process" | "container" | "remote";
export type NetworkMode = "off" | "restricted" | "tool_only" | "full";
export type OutputType = "text" | "json" | "file" | "binary";
export type RetentionMode = "none" | "request" | "session" | "task" | "persistent";
export type RiskLevel = "low" | "moderate" | "high" | "critical";
export type SandboxExecutionStatus =
    | "queued"
    | "awaiting_approval"
    | "provisioning"
    | "running"
    | "completed"
    | "failed"
    | "timed_out"
    | "blocked_by_policy"
    | "cancelled";

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object
        ? T[P] extends Array<infer U>
            ? Array<DeepPartial<U>>
            : DeepPartial<T[P]>
        : T[P];
};

export interface FilesystemPolicy {
    readOnlyRoot: boolean;
    workingDirectory: string;
    allowedReadPaths: string[];
    allowedWritePaths: string[];
    tempDirectory: string;
    persistArtifacts: boolean;
    maxArtifactSizeMb?: number;
    maxTotalArtifactSizeMb?: number;
}

export interface NetworkPolicy {
    mode: NetworkMode;
    allowedDomains?: string[];
    allowedIps?: string[];
    allowedPorts?: number[];
    blockPrivateNetworks: boolean;
    allowDns: boolean;
    httpOnly: boolean;
}

export interface ResourceLimits {
    timeoutSeconds: number;
    cpuLimit: number;
    memoryMb: number;
    diskMb: number;
    maxProcesses: number;
    maxThreads: number;
    maxStdoutKb: number;
    maxStderrKb: number;
}

export interface ExecutionPolicy {
    allowShell: boolean;
    allowedBinaries: string[];
    blockedBinaries: string[];
    allowedInterpreters: string[];
    allowSubprocessSpawn: boolean;
    allowPackageInstall: boolean;
}

export interface EnvironmentPolicy {
    runtime: string;
    runtimeVersion: string;
    envVars: Record<string, string>;
    inheritHostEnv: boolean;
    secretInjection: boolean;
    timezone: string;
    locale: string;
}

export interface SecurityPolicy {
    runAsNonRoot: boolean;
    noNewPrivileges: boolean;
    disableDeviceAccess: boolean;
    disablePrivilegedMode: boolean;
    disableHostNamespaces: boolean;
}

export interface IOPolicy {
    maxInputSizeKb: number;
    maxOutputSizeKb: number;
    allowedOutputTypes: OutputType[];
    stripSensitiveOutput: boolean;
    contentScan: boolean;
    retention: RetentionMode;
}

export interface AuditPolicy {
    enabled: boolean;
    captureCommand: boolean;
    captureStdout: boolean;
    captureStderr: boolean;
    captureExitCode: boolean;
    captureArtifacts: boolean;
    captureTiming: boolean;
    captureHashes: boolean;
    capturePolicySnapshot: boolean;
    captureNetworkEvents: boolean;
}

export interface ApprovalPolicy {
    requireApprovalForExec: boolean;
    requireApprovalForWriteOutsideWorkspace: boolean;
    requireApprovalForNetwork: boolean;
    requireApprovalForLargeArtifacts: boolean;
}

export interface SandboxConfig {
    enabled: boolean;
    mode: SandboxMode;
    filesystem: FilesystemPolicy;
    network: NetworkPolicy;
    resources: ResourceLimits;
    execution: ExecutionPolicy;
    environment: EnvironmentPolicy;
    security: SecurityPolicy;
    ioPolicy: IOPolicy;
    audit: AuditPolicy;
    approvals: ApprovalPolicy;
}

export interface SandboxProfile {
    id: string;
    name: string;
    description: string;
    version: number;
    isSystem: boolean;
    mode: SandboxMode;
    riskLevel: RiskLevel;
    config: SandboxConfig;
    createdAt: string;
    updatedAt: string;
}

export interface AgentSandboxConfig {
    agentId: string;
    enabled: boolean;
    profileId: string | null;
    overrides: DeepPartial<SandboxConfig>;
    enforcement: {
        mandatoryForCapabilities: string[];
        fallbackBehavior: "deny" | "allow";
    };
    createdAt: string;
    updatedAt: string;
}

export interface SandboxArtifact {
    id: string;
    executionId: string;
    name: string;
    path: string;
    sizeBytes: number;
    sha256: string;
    mimeType?: string | null;
    retainedUntil?: string | null;
    metadata?: Record<string, unknown>;
}

export interface SandboxExecution {
    id: string;
    agentId: string;
    taskId?: string | null;
    skillId?: string | null;
    capability: string;
    status: SandboxExecutionStatus;
    mode: SandboxMode;
    command: string[];
    policySnapshot: SandboxConfig;
    startedAt?: string | null;
    finishedAt?: string | null;
    durationMs?: number | null;
    exitCode?: number | null;
    resourceUsage?: {
        cpuMs?: number;
        memoryPeakMb?: number;
        diskWrittenMb?: number;
        stdoutKb?: number;
        stderrKb?: number;
    };
    errorMessage?: string | null;
    stdout?: string;
    stderr?: string;
}

export interface ApprovalRequest {
    id: string;
    agentId: string;
    taskId?: string | null;
    executionId?: string | null;
    reason: string;
    requestedAction: Record<string, unknown>;
    status: "pending" | "approved" | "rejected";
    approvedBy?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
}

export interface SandboxValidationIssue {
    field: string;
    message: string;
    severity: "error" | "warning";
}

export interface SandboxValidationResult {
    valid: boolean;
    issues: SandboxValidationIssue[];
}

export interface DryRunRequest {
    agentId: string;
    capability: string;
    command: string[];
    requestedPaths?: string[];
    taskId?: string;
    skillId?: string;
    skillRequirements?: DeepPartial<SandboxConfig>;
    temporaryOverrides?: DeepPartial<SandboxConfig>;
}

export interface SandboxDryRunResult {
    allowed: boolean;
    requiresApproval: boolean;
    riskLevel: RiskLevel;
    validation: SandboxValidationResult;
    effectivePolicy: SandboxConfig;
    reasons: string[];
}

export const CAPABILITIES_REQUIRING_SANDBOX = new Set([
    "exec",
    "process",
    "write",
    "edit",
    "cron",
    "gateway",
    "plugin",
    "automation",
]);

export const CAPABILITIES_ALLOWING_LIGHT_POLICY = new Set([
    "read",
    "memory_search",
    "memory_get",
    "sessions_list",
    "agents_list",
]);

export function createSandboxConfig(mode: SandboxMode, overrides: DeepPartial<SandboxConfig> = {}): SandboxConfig {
    const base: SandboxConfig = {
        enabled: true,
        mode,
        filesystem: {
            readOnlyRoot: true,
            workingDirectory: "/workspace",
            allowedReadPaths: ["/workspace"],
            allowedWritePaths: ["/workspace/output"],
            tempDirectory: "/workspace/tmp",
            persistArtifacts: true,
            maxArtifactSizeMb: 25,
            maxTotalArtifactSizeMb: 100,
        },
        network: {
            mode: "off",
            allowedDomains: [],
            allowedIps: [],
            allowedPorts: [],
            blockPrivateNetworks: true,
            allowDns: false,
            httpOnly: true,
        },
        resources: {
            timeoutSeconds: 60,
            cpuLimit: 1,
            memoryMb: 512,
            diskMb: 512,
            maxProcesses: 8,
            maxThreads: 8,
            maxStdoutKb: 256,
            maxStderrKb: 256,
        },
        execution: {
            allowShell: false,
            allowedBinaries: ["node", "python", "python3", "bash"],
            blockedBinaries: ["sudo", "su", "ssh", "scp", "docker", "kubectl", "chmod", "chown"],
            allowedInterpreters: ["node", "python", "python3"],
            allowSubprocessSpawn: false,
            allowPackageInstall: false,
        },
        environment: {
            runtime: "node",
            runtimeVersion: "20",
            envVars: {},
            inheritHostEnv: false,
            secretInjection: false,
            timezone: "UTC",
            locale: "en-US",
        },
        security: {
            runAsNonRoot: true,
            noNewPrivileges: true,
            disableDeviceAccess: true,
            disablePrivilegedMode: true,
            disableHostNamespaces: true,
        },
        ioPolicy: {
            maxInputSizeKb: 256,
            maxOutputSizeKb: 512,
            allowedOutputTypes: ["text", "json", "file"],
            stripSensitiveOutput: true,
            contentScan: true,
            retention: "task",
        },
        audit: {
            enabled: true,
            captureCommand: true,
            captureStdout: true,
            captureStderr: true,
            captureExitCode: true,
            captureArtifacts: true,
            captureTiming: true,
            captureHashes: true,
            capturePolicySnapshot: true,
            captureNetworkEvents: false,
        },
        approvals: {
            requireApprovalForExec: true,
            requireApprovalForWriteOutsideWorkspace: true,
            requireApprovalForNetwork: true,
            requireApprovalForLargeArtifacts: false,
        },
    };

    return deepMergeSandboxConfig(base, overrides);
}

export function createDefaultAgentSandboxConfig(agentId: string): AgentSandboxConfig {
    const now = new Date().toISOString();
    return {
        agentId,
        enabled: true,
        profileId: "sbx_code_runner",
        overrides: {},
        enforcement: {
            mandatoryForCapabilities: ["exec", "process", "write", "edit", "cron", "gateway"],
            fallbackBehavior: "deny",
        },
        createdAt: now,
        updatedAt: now,
    };
}

export function createSandboxProfile(
    id: string,
    name: string,
    description: string,
    mode: SandboxMode,
    riskLevel: RiskLevel,
    config: SandboxConfig,
    now = new Date().toISOString(),
): SandboxProfile {
    return {
        id,
        name,
        description,
        version: 1,
        isSystem: true,
        mode,
        riskLevel,
        config,
        createdAt: now,
        updatedAt: now,
    };
}

export function deepMergeSandboxConfig(base: SandboxConfig, override: DeepPartial<SandboxConfig>): SandboxConfig {
    return {
        enabled: override.enabled ?? base.enabled,
        mode: override.mode ?? base.mode,
        filesystem: {
            readOnlyRoot: mergeBooleanRestrictive(base.filesystem.readOnlyRoot, override.filesystem?.readOnlyRoot),
            workingDirectory: override.filesystem?.workingDirectory || base.filesystem.workingDirectory,
            allowedReadPaths: mergePathLists(base.filesystem.allowedReadPaths, override.filesystem?.allowedReadPaths),
            allowedWritePaths: mergePathLists(base.filesystem.allowedWritePaths, override.filesystem?.allowedWritePaths),
            tempDirectory: override.filesystem?.tempDirectory || base.filesystem.tempDirectory,
            persistArtifacts: override.filesystem?.persistArtifacts ?? base.filesystem.persistArtifacts,
            maxArtifactSizeMb: mergeNumberRestrictive(base.filesystem.maxArtifactSizeMb, override.filesystem?.maxArtifactSizeMb),
            maxTotalArtifactSizeMb: mergeNumberRestrictive(base.filesystem.maxTotalArtifactSizeMb, override.filesystem?.maxTotalArtifactSizeMb),
        },
        network: {
            mode: mergeNetworkMode(base.network.mode, override.network?.mode),
            allowedDomains: mergeStringLists(base.network.allowedDomains || [], override.network?.allowedDomains),
            allowedIps: mergeStringLists(base.network.allowedIps || [], override.network?.allowedIps),
            allowedPorts: mergeNumberLists(base.network.allowedPorts || [], override.network?.allowedPorts),
            blockPrivateNetworks: mergeBooleanRestrictive(base.network.blockPrivateNetworks, override.network?.blockPrivateNetworks),
            allowDns: mergeBooleanRestrictive(base.network.allowDns, override.network?.allowDns),
            httpOnly: mergeBooleanRestrictive(base.network.httpOnly, override.network?.httpOnly),
        },
        resources: {
            timeoutSeconds: mergeNumberRestrictive(base.resources.timeoutSeconds, override.resources?.timeoutSeconds) ?? base.resources.timeoutSeconds,
            cpuLimit: mergeNumberRestrictive(base.resources.cpuLimit, override.resources?.cpuLimit) ?? base.resources.cpuLimit,
            memoryMb: mergeNumberRestrictive(base.resources.memoryMb, override.resources?.memoryMb) ?? base.resources.memoryMb,
            diskMb: mergeNumberRestrictive(base.resources.diskMb, override.resources?.diskMb) ?? base.resources.diskMb,
            maxProcesses: mergeNumberRestrictive(base.resources.maxProcesses, override.resources?.maxProcesses) ?? base.resources.maxProcesses,
            maxThreads: mergeNumberRestrictive(base.resources.maxThreads, override.resources?.maxThreads) ?? base.resources.maxThreads,
            maxStdoutKb: mergeNumberRestrictive(base.resources.maxStdoutKb, override.resources?.maxStdoutKb) ?? base.resources.maxStdoutKb,
            maxStderrKb: mergeNumberRestrictive(base.resources.maxStderrKb, override.resources?.maxStderrKb) ?? base.resources.maxStderrKb,
        },
        execution: {
            allowShell: mergeBooleanRestrictive(base.execution.allowShell, override.execution?.allowShell),
            allowedBinaries: mergeStringLists(base.execution.allowedBinaries, override.execution?.allowedBinaries),
            blockedBinaries: mergeStringLists(base.execution.blockedBinaries, override.execution?.blockedBinaries),
            allowedInterpreters: mergeStringLists(base.execution.allowedInterpreters, override.execution?.allowedInterpreters),
            allowSubprocessSpawn: mergeBooleanRestrictive(base.execution.allowSubprocessSpawn, override.execution?.allowSubprocessSpawn),
            allowPackageInstall: mergeBooleanRestrictive(base.execution.allowPackageInstall, override.execution?.allowPackageInstall),
        },
        environment: {
            runtime: override.environment?.runtime || base.environment.runtime,
            runtimeVersion: override.environment?.runtimeVersion || base.environment.runtimeVersion,
            envVars: mergeEnvVars(base.environment.envVars, override.environment?.envVars),
            inheritHostEnv: mergeBooleanRestrictive(base.environment.inheritHostEnv, override.environment?.inheritHostEnv),
            secretInjection: mergeBooleanRestrictive(base.environment.secretInjection, override.environment?.secretInjection),
            timezone: override.environment?.timezone || base.environment.timezone,
            locale: override.environment?.locale || base.environment.locale,
        },
        security: {
            runAsNonRoot: mergeBooleanRestrictive(base.security.runAsNonRoot, override.security?.runAsNonRoot),
            noNewPrivileges: mergeBooleanRestrictive(base.security.noNewPrivileges, override.security?.noNewPrivileges),
            disableDeviceAccess: mergeBooleanRestrictive(base.security.disableDeviceAccess, override.security?.disableDeviceAccess),
            disablePrivilegedMode: mergeBooleanRestrictive(base.security.disablePrivilegedMode, override.security?.disablePrivilegedMode),
            disableHostNamespaces: mergeBooleanRestrictive(base.security.disableHostNamespaces, override.security?.disableHostNamespaces),
        },
        ioPolicy: {
            maxInputSizeKb: mergeNumberRestrictive(base.ioPolicy.maxInputSizeKb, override.ioPolicy?.maxInputSizeKb) ?? base.ioPolicy.maxInputSizeKb,
            maxOutputSizeKb: mergeNumberRestrictive(base.ioPolicy.maxOutputSizeKb, override.ioPolicy?.maxOutputSizeKb) ?? base.ioPolicy.maxOutputSizeKb,
            allowedOutputTypes: mergeOutputTypes(base.ioPolicy.allowedOutputTypes, override.ioPolicy?.allowedOutputTypes),
            stripSensitiveOutput: mergeBooleanRestrictive(base.ioPolicy.stripSensitiveOutput, override.ioPolicy?.stripSensitiveOutput),
            contentScan: mergeBooleanRestrictive(base.ioPolicy.contentScan, override.ioPolicy?.contentScan),
            retention: mergeRetention(base.ioPolicy.retention, override.ioPolicy?.retention),
        },
        audit: {
            enabled: mergeBooleanRestrictive(base.audit.enabled, override.audit?.enabled),
            captureCommand: mergeBooleanRestrictive(base.audit.captureCommand, override.audit?.captureCommand),
            captureStdout: mergeBooleanRestrictive(base.audit.captureStdout, override.audit?.captureStdout),
            captureStderr: mergeBooleanRestrictive(base.audit.captureStderr, override.audit?.captureStderr),
            captureExitCode: mergeBooleanRestrictive(base.audit.captureExitCode, override.audit?.captureExitCode),
            captureArtifacts: mergeBooleanRestrictive(base.audit.captureArtifacts, override.audit?.captureArtifacts),
            captureTiming: mergeBooleanRestrictive(base.audit.captureTiming, override.audit?.captureTiming),
            captureHashes: mergeBooleanRestrictive(base.audit.captureHashes, override.audit?.captureHashes),
            capturePolicySnapshot: mergeBooleanRestrictive(base.audit.capturePolicySnapshot, override.audit?.capturePolicySnapshot),
            captureNetworkEvents: mergeBooleanRestrictive(base.audit.captureNetworkEvents, override.audit?.captureNetworkEvents),
        },
        approvals: {
            requireApprovalForExec: mergeBooleanRestrictive(base.approvals.requireApprovalForExec, override.approvals?.requireApprovalForExec),
            requireApprovalForWriteOutsideWorkspace: mergeBooleanRestrictive(base.approvals.requireApprovalForWriteOutsideWorkspace, override.approvals?.requireApprovalForWriteOutsideWorkspace),
            requireApprovalForNetwork: mergeBooleanRestrictive(base.approvals.requireApprovalForNetwork, override.approvals?.requireApprovalForNetwork),
            requireApprovalForLargeArtifacts: mergeBooleanRestrictive(base.approvals.requireApprovalForLargeArtifacts, override.approvals?.requireApprovalForLargeArtifacts),
        },
    };
}

export function hashText(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
}

function mergeBooleanRestrictive(base: boolean, override?: boolean): boolean {
    if (override === undefined) {
        return base;
    }
    return base && override;
}

function mergeNumberRestrictive(base: number | undefined, override?: number): number | undefined {
    if (override === undefined) {
        return base;
    }
    if (base === undefined) {
        return override;
    }
    return Math.min(base, override);
}

function mergeStringLists(base: string[], override?: string[]): string[] {
    if (override === undefined) {
        return base;
    }
    if (override.length === 0) {
        return [];
    }
    if (base.length === 0) {
        return override;
    }
    const intersection = base.filter((value) => override.includes(value));
    return intersection.length > 0 ? intersection : [];
}

function mergePathLists(base: string[], override?: string[]): string[] {
    return mergeStringLists(base, override).map((value) => value.trim()).filter(Boolean);
}

function mergeEnvVars(base: Record<string, string>, override?: Record<string, string | undefined>): Record<string, string> {
    const result: Record<string, string> = { ...base };
    for (const [key, value] of Object.entries(override || {})) {
        if (typeof value === "string") {
            result[key] = value;
        }
    }
    return result;
}

function mergeNumberLists(base: number[], override?: number[]): number[] {
    if (override === undefined) {
        return base;
    }
    if (override.length === 0) {
        return [];
    }
    if (base.length === 0) {
        return override;
    }
    return base.filter((value) => override.includes(value));
}

function mergeOutputTypes(base: OutputType[], override?: OutputType[]): OutputType[] {
    if (override === undefined) {
        return base;
    }
    if (override.length === 0) {
        return [];
    }
    if (base.length === 0) {
        return override;
    }
    return base.filter((value) => override.includes(value));
}

function mergeNetworkMode(base: NetworkMode, override?: NetworkMode): NetworkMode {
    if (!override) {
        return base;
    }
    const ranks: Record<NetworkMode, number> = {
        off: 0,
        restricted: 1,
        tool_only: 2,
        full: 3,
    };
    return ranks[base] <= ranks[override] ? base : override;
}

function mergeRetention(base: RetentionMode, override?: RetentionMode): RetentionMode {
    if (!override) {
        return base;
    }
    const ranks: Record<RetentionMode, number> = {
        none: 0,
        request: 1,
        session: 2,
        task: 3,
        persistent: 4,
    };
    return ranks[base] <= ranks[override] ? base : override;
}
