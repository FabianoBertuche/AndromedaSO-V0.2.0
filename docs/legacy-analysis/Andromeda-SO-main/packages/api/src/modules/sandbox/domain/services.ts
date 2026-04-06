import {
    AgentSandboxConfig,
    CAPABILITIES_ALLOWING_LIGHT_POLICY,
    CAPABILITIES_REQUIRING_SANDBOX,
    DryRunRequest,
    NetworkMode,
    RiskLevel,
    SandboxConfig,
    SandboxProfile,
    SandboxValidationIssue,
    SandboxValidationResult,
    DeepPartial,
    deepMergeSandboxConfig,
} from "./types";

export class CapabilityPolicyEngine {
    requiresSandbox(capability: string): boolean {
        return CAPABILITIES_REQUIRING_SANDBOX.has(normalizeCapability(capability));
    }

    canRunWithoutSandbox(capability: string): boolean {
        return CAPABILITIES_ALLOWING_LIGHT_POLICY.has(normalizeCapability(capability));
    }

    requiresApproval(capability: string, config: SandboxConfig): boolean {
        const normalized = normalizeCapability(capability);

        if (this.requiresSandbox(normalized)) {
            return config.approvals.requireApprovalForExec
                || normalized === "write" && config.approvals.requireApprovalForWriteOutsideWorkspace
                || normalized === "gateway" && config.approvals.requireApprovalForNetwork;
        }

        if (normalized === "web_search" || normalized === "web_fetch" || normalized === "browser") {
            return config.approvals.requireApprovalForNetwork;
        }

        return false;
    }
}

export class SandboxPolicyResolver {
    resolve(input: {
        globalPolicy: SandboxConfig;
        profile?: SandboxProfile | null;
        agentConfig?: AgentSandboxConfig | null;
        skillRequirements?: DeepPartial<SandboxConfig>;
        temporaryOverrides?: DeepPartial<SandboxConfig>;
        environmentRestrictions?: DeepPartial<SandboxConfig>;
    }): SandboxConfig {
        const layers: Partial<SandboxConfig>[] = [
            input.globalPolicy,
            input.profile?.config,
            input.agentConfig?.overrides,
            input.skillRequirements,
            input.temporaryOverrides,
            input.environmentRestrictions,
        ].filter(Boolean) as Partial<SandboxConfig>[];

        return layers.reduce<SandboxConfig>((current, layer) => deepMergeSandboxConfig(current, layer), input.globalPolicy);
    }
}

export class SandboxValidator {
    validate(config: SandboxConfig, options?: { production?: boolean; requestedPaths?: string[]; capability?: string }): SandboxValidationResult {
        const issues: SandboxValidationIssue[] = [];
        const production = options?.production ?? process.env.NODE_ENV === "production";
        const capability = normalizeCapability(options?.capability || "");

        if (config.mode === "none" && production) {
            issues.push({ field: "mode", message: "mode=none is not allowed in production.", severity: "error" });
        }

        if (!config.filesystem.workingDirectory || !isControlledPath(config.filesystem.workingDirectory)) {
            issues.push({ field: "filesystem.workingDirectory", message: "Working directory must be under a controlled workspace path.", severity: "error" });
        }

        if (CAPABILITIES_REQUIRING_SANDBOX.has(capability) && capability === "write" && config.filesystem.allowedWritePaths.length === 0) {
            issues.push({ field: "filesystem.allowedWritePaths", message: "Write capability requires at least one allowed write path.", severity: "error" });
        }

        if (config.network.mode === "full" && production) {
            issues.push({ field: "network.mode", message: "network.mode=full requires administrative authorization.", severity: "error" });
        }

        if (config.execution.allowShell) {
            issues.push({ field: "execution.allowShell", message: "allowShell=true increases risk and should be explicitly justified.", severity: "warning" });
        }

        const blocked = new Set(config.execution.blockedBinaries.map(normalizeBinary));
        for (const binary of config.execution.allowedBinaries.map(normalizeBinary)) {
            if (blocked.has(binary)) {
                issues.push({ field: "execution.blockedBinaries", message: `Binary ${binary} cannot be both allowed and blocked.`, severity: "error" });
            }
        }

        if (config.resources.timeoutSeconds < 1 || config.resources.timeoutSeconds > 3600) {
            issues.push({ field: "resources.timeoutSeconds", message: "Timeout must be between 1 and 3600 seconds.", severity: "error" });
        }

        if (config.resources.memoryMb < 64 || config.resources.memoryMb > 32768) {
            issues.push({ field: "resources.memoryMb", message: "Memory must be between 64 and 32768 MB.", severity: "error" });
        }

        if (config.resources.diskMb < 32 || config.resources.diskMb > 131072) {
            issues.push({ field: "resources.diskMb", message: "Disk must be between 32 and 131072 MB.", severity: "error" });
        }

        if (!config.security.runAsNonRoot || !config.security.noNewPrivileges || !config.security.disablePrivilegedMode) {
            issues.push({ field: "security", message: "Sandbox must run without root, privileged mode, or new privileges.", severity: "error" });
        }

        if (config.environment.inheritHostEnv) {
            issues.push({ field: "environment.inheritHostEnv", message: "Host environment inheritance should remain off unless explicitly approved.", severity: "warning" });
        }

        if (options?.requestedPaths?.length) {
            for (const requestedPath of options.requestedPaths) {
                if (!isControlledPath(requestedPath)) {
                    issues.push({ field: "requestedPaths", message: `Requested path ${requestedPath} is outside the controlled workspace.`, severity: "error" });
                }
            }
        }

        return {
            valid: !issues.some((issue) => issue.severity === "error"),
            issues,
        };
    }
}

export class RiskLevelCalculator {
    calculate(config: SandboxConfig, approvalRequired: boolean): RiskLevel {
        let score = 0;

        if (config.mode === "container") score += 1;
        if (config.mode === "remote") score += 2;
        if (config.network.mode === "restricted") score += 1;
        if (config.network.mode === "tool_only") score += 2;
        if (config.network.mode === "full") score += 4;
        if (config.execution.allowShell) score += 2;
        if (config.environment.inheritHostEnv) score += 2;
        if (config.approvals.requireApprovalForExec) score += 1;
        if (approvalRequired) score += 1;
        if (!config.security.noNewPrivileges) score += 3;

        if (score <= 1) return "low";
        if (score <= 4) return "moderate";
        if (score <= 7) return "high";
        return "critical";
    }
}

export interface DryRunComputation {
    allowed: boolean;
    effectivePolicy: SandboxConfig;
    validation: SandboxValidationResult;
    riskLevel: RiskLevel;
    requiresApproval: boolean;
    reasons: string[];
}

export function computeDryRunResult(input: {
    dryRun: DryRunRequest;
    resolvedPolicy: SandboxConfig;
    validator: SandboxValidator;
    capabilityEngine: CapabilityPolicyEngine;
}): DryRunComputation {
    const validation = input.validator.validate(input.resolvedPolicy, {
        capability: input.dryRun.capability,
        requestedPaths: input.dryRun.requestedPaths,
        production: process.env.NODE_ENV === "production",
    });

    const requiresApproval = input.capabilityEngine.requiresApproval(input.dryRun.capability, input.resolvedPolicy);
    const riskLevel = new RiskLevelCalculator().calculate(input.resolvedPolicy, requiresApproval);
    const allowed = validation.valid && !requiresApproval;
    const reasons = validation.issues.map((issue) => `${issue.severity.toUpperCase()}: ${issue.message}`);

    return {
        allowed,
        effectivePolicy: input.resolvedPolicy,
        validation,
        riskLevel,
        requiresApproval,
        reasons,
    };
}

function normalizeCapability(value: string): string {
    return value.trim().toLowerCase();
}

function normalizeBinary(value: string): string {
    return value.trim().toLowerCase();
}

function isControlledPath(value: string): boolean {
    const normalized = value.replace(/\\/g, "/").toLowerCase();
    return normalized.startsWith("/workspace")
        || normalized.startsWith("./workspace")
        || normalized.startsWith("workspace")
        || normalized.startsWith("c:/fb/andromeda-so")
        || normalized.startsWith("c:\\fb\\andromeda-so")
        || normalized.startsWith("c:/fb/andromeda so")
        || normalized.startsWith("c:\\fb\\andromeda so");
}
