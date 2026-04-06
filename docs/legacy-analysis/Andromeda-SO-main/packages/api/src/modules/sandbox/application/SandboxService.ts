import { randomUUID } from "node:crypto";
import {
    ApprovalRequest,
    AgentSandboxConfig,
    DryRunRequest,
    SandboxArtifact,
    SandboxConfig,
    SandboxExecution,
    SandboxProfile,
    SandboxValidationResult,
    DeepPartial,
    createSandboxConfig,
    hashText,
} from "../domain/types";
import {
    ApprovalRequestRepository,
    AgentSandboxConfigRepository,
    SandboxArtifactRepository,
    SandboxExecutionRepository,
    SandboxProfileRepository,
} from "../domain/ports";
import {
    CapabilityPolicyEngine,
    DryRunComputation,
    RiskLevelCalculator,
    SandboxPolicyResolver,
    SandboxValidator,
    computeDryRunResult,
} from "../domain/services";
import { SandboxRunner, mapRunnerResultToExecution } from "../infrastructure/ProcessSandboxRunner";

export interface StartSandboxExecutionInput {
    agentId: string;
    capability: string;
    command: string[];
    taskId?: string;
    skillId?: string;
    requestedPaths?: string[];
    temporaryOverrides?: DeepPartial<SandboxConfig>;
    skillRequirements?: DeepPartial<SandboxConfig>;
}

export class SandboxService {
    private readonly globalPolicy: SandboxConfig;

    constructor(
        private readonly profileRepository: SandboxProfileRepository,
        private readonly agentConfigRepository: AgentSandboxConfigRepository,
        private readonly executionRepository: SandboxExecutionRepository,
        private readonly artifactRepository: SandboxArtifactRepository,
        private readonly approvalRepository: ApprovalRequestRepository,
        private readonly policyResolver = new SandboxPolicyResolver(),
        private readonly validator = new SandboxValidator(),
        private readonly capabilityEngine = new CapabilityPolicyEngine(),
        private readonly riskCalculator = new RiskLevelCalculator(),
        private readonly runner: SandboxRunner,
    ) {
        this.globalPolicy = createSandboxConfig("process");
    }

    async listProfiles(): Promise<SandboxProfile[]> {
        return this.profileRepository.list();
    }

    async getProfile(id: string): Promise<SandboxProfile> {
        const profile = await this.profileRepository.getById(id);
        if (!profile) {
            throw new Error(`Sandbox profile ${id} not found`);
        }
        return profile;
    }

    async createProfile(input: SandboxProfile): Promise<SandboxProfile> {
        return this.profileRepository.save(input);
    }

    async updateProfile(id: string, patch: Partial<SandboxProfile>): Promise<SandboxProfile> {
        const current = await this.getProfile(id);
        const updated: SandboxProfile = {
            ...current,
            ...patch,
            id,
            updatedAt: new Date().toISOString(),
        };
        return this.profileRepository.save(updated);
    }

    async deleteProfile(id: string): Promise<void> {
        await this.profileRepository.delete(id);
    }

    async getAgentSandboxConfig(agentId: string): Promise<AgentSandboxConfig> {
        return this.agentConfigRepository.getByAgentId(agentId);
    }

    async updateAgentSandboxConfig(agentId: string, patch: Partial<AgentSandboxConfig>): Promise<AgentSandboxConfig> {
        const current = await this.agentConfigRepository.getByAgentId(agentId);
        const updated: AgentSandboxConfig = {
            ...current,
            ...patch,
            agentId,
            overrides: {
                ...current.overrides,
                ...(patch.overrides || {}),
            },
            enforcement: {
                ...current.enforcement,
                ...(patch.enforcement || {}),
            },
            updatedAt: new Date().toISOString(),
        };
        return this.agentConfigRepository.save(updated);
    }

    validate(config: SandboxConfig, requestedPaths?: string[], capability?: string): SandboxValidationResult {
        return this.validator.validate(config, {
            production: process.env.NODE_ENV === "production",
            requestedPaths,
            capability,
        });
    }

    async dryRun(input: DryRunRequest): Promise<DryRunComputation & { agentConfig: AgentSandboxConfig | null; profile: SandboxProfile | null }> {
        const agentConfig = await this.agentConfigRepository.getByAgentId(input.agentId);
        const profile = agentConfig.profileId ? await this.profileRepository.getById(agentConfig.profileId) : null;
        const resolvedPolicy = this.policyResolver.resolve({
            globalPolicy: this.globalPolicy,
            profile,
            agentConfig,
            skillRequirements: input.skillRequirements,
            temporaryOverrides: input.temporaryOverrides,
            environmentRestrictions: process.env.NODE_ENV === "production"
                ? {
                    environment: {
                        inheritHostEnv: false,
                        secretInjection: false,
                    },
                }
                : undefined,
        });

        const result = computeDryRunResult({
            dryRun: input,
            resolvedPolicy,
            validator: this.validator,
            capabilityEngine: this.capabilityEngine,
        });

        return {
            ...result,
            agentConfig,
            profile,
        };
    }

    async startExecution(input: StartSandboxExecutionInput): Promise<{
        execution: SandboxExecution;
        approvalRequest?: ApprovalRequest;
        artifacts: SandboxArtifact[];
    }> {
        const dryRun = await this.dryRun({
            agentId: input.agentId,
            capability: input.capability,
            command: input.command,
            requestedPaths: input.requestedPaths,
            taskId: input.taskId || undefined,
            skillId: input.skillId || undefined,
            skillRequirements: input.skillRequirements,
            temporaryOverrides: input.temporaryOverrides,
        });

        const execution: SandboxExecution = {
            id: randomUUID(),
            agentId: input.agentId,
            taskId: input.taskId || null,
            skillId: input.skillId || null,
            capability: input.capability,
            status: dryRun.validation.valid ? "queued" : "blocked_by_policy",
            mode: dryRun.effectivePolicy.mode,
            command: input.command,
            policySnapshot: dryRun.effectivePolicy,
            startedAt: null,
            finishedAt: null,
            durationMs: null,
            exitCode: null,
            resourceUsage: undefined,
            errorMessage: dryRun.validation.valid ? null : "Blocked by sandbox validation",
        };

        await this.executionRepository.save(execution);

        if (!dryRun.validation.valid) {
            return {
                execution,
                artifacts: [],
            };
        }

        const requiresApproval = dryRun.requiresApproval;
        if (requiresApproval) {
            const approvalRequest: ApprovalRequest = {
                id: randomUUID(),
                agentId: input.agentId,
                taskId: input.taskId || null,
                executionId: execution.id,
                reason: `Capability ${input.capability} requires human approval.`,
                requestedAction: {
                    capability: input.capability,
                    command: input.command,
                },
                status: "pending",
                approvedBy: null,
                approvedAt: null,
                rejectedAt: null,
            };
            await this.approvalRepository.save(approvalRequest);

            const awaitingApproval: SandboxExecution = {
                ...execution,
                status: "awaiting_approval",
                errorMessage: "Awaiting human approval",
            };
            await this.executionRepository.save(awaitingApproval);

            return {
                execution: awaitingApproval,
                approvalRequest,
                artifacts: [],
            };
        }

        const running = {
            ...execution,
            status: "running" as const,
            startedAt: new Date().toISOString(),
        };
        await this.executionRepository.save(running);

        const result = await this.runner.run({
            executionId: running.id,
            command: input.command,
            policy: dryRun.effectivePolicy,
            workingDirectory: dryRun.effectivePolicy.filesystem.workingDirectory,
            env: dryRun.effectivePolicy.environment.envVars,
            timeoutSeconds: dryRun.effectivePolicy.resources.timeoutSeconds,
        });

        const completed = mapRunnerResultToExecution(running, result);
        await this.executionRepository.save(completed);

        const artifacts = dryRun.effectivePolicy.filesystem.persistArtifacts
            ? await this.generateExecutionArtifacts(completed)
            : [];
        if (artifacts.length > 0) {
            await this.artifactRepository.saveByExecutionId(completed.id, artifacts);
        }

        return {
            execution: completed,
            artifacts,
        };
    }

    async listExecutions(): Promise<SandboxExecution[]> {
        return this.executionRepository.list();
    }

    async getExecution(id: string): Promise<SandboxExecution> {
        const execution = await this.executionRepository.getById(id);
        if (!execution) {
            throw new Error(`Sandbox execution ${id} not found`);
        }
        return execution;
    }

    async getExecutionLogs(id: string): Promise<{ stdout: string; stderr: string }> {
        const execution = await this.getExecution(id);
        return {
            stdout: execution.stdout || "",
            stderr: execution.stderr || "",
        };
    }

    async listArtifacts(executionId: string): Promise<SandboxArtifact[]> {
        return this.artifactRepository.listByExecutionId(executionId);
    }

    async cancelExecution(id: string): Promise<SandboxExecution> {
        const execution = await this.getExecution(id);
        const cancelled: SandboxExecution = {
            ...execution,
            status: "cancelled",
            finishedAt: new Date().toISOString(),
            errorMessage: "Cancelled by user",
        };
        await this.executionRepository.save(cancelled);
        return cancelled;
    }

    async listApprovals(): Promise<ApprovalRequest[]> {
        return this.approvalRepository.list();
    }

    async approve(id: string, approvedBy = "human-operator"): Promise<ApprovalRequest> {
        const request = await this.getApproval(id);
        const approved: ApprovalRequest = {
            ...request,
            status: "approved",
            approvedBy,
            approvedAt: new Date().toISOString(),
        };
        await this.approvalRepository.save(approved);
        return approved;
    }

    async reject(id: string, rejectedBy = "human-operator"): Promise<ApprovalRequest> {
        const request = await this.getApproval(id);
        const rejected: ApprovalRequest = {
            ...request,
            status: "rejected",
            approvedBy: rejectedBy,
            rejectedAt: new Date().toISOString(),
        };
        await this.approvalRepository.save(rejected);
        return rejected;
    }

    private async getApproval(id: string): Promise<ApprovalRequest> {
        const request = await this.approvalRepository.getById(id);
        if (!request) {
            throw new Error(`Approval request ${id} not found`);
        }
        return request;
    }

    private async generateExecutionArtifacts(execution: SandboxExecution): Promise<SandboxArtifact[]> {
        const content = execution.stdout || execution.stderr || "";
        if (!content) {
            return [];
        }

        const artifact: SandboxArtifact = {
            id: randomUUID(),
            executionId: execution.id,
            name: "execution.log",
            path: `/artifacts/${execution.id}/execution.log`,
            sizeBytes: Buffer.byteLength(content, "utf8"),
            sha256: hashText(content),
            mimeType: "text/plain",
            retainedUntil: null,
            metadata: {
                source: "stdout-stderr",
            },
        };

        return [artifact];
    }
}
