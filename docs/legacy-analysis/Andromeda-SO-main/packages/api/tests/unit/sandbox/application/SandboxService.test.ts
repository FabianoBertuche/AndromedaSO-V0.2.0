import { describe, expect, it, vi } from "vitest";
import { createSystemSandboxProfiles } from "../../../../src/modules/sandbox/domain/presets";
import { createDefaultAgentSandboxConfig, SandboxArtifact, SandboxExecution, SandboxProfile } from "../../../../src/modules/sandbox/domain/types";
import { SandboxService } from "../../../../src/modules/sandbox/application/SandboxService";

describe("SandboxService", () => {
    it("returns approval requests for sensitive capabilities", async () => {
        const rig = createSandboxRig();

        const result = await rig.service.startExecution({
            agentId: "agent-1",
            capability: "exec",
            command: [process.execPath, "-e", "console.log('not-run')"],
        });

        expect(result.execution.status).toBe("awaiting_approval");
        expect(result.approvalRequest?.status).toBe("pending");
        expect(rig.runner.run).not.toHaveBeenCalled();
        expect(rig.approvals.size).toBe(1);
    });

    it("executes allowed capabilities and stores artifacts", async () => {
        const rig = createSandboxRig();

        const result = await rig.service.startExecution({
            agentId: "agent-1",
            capability: "read",
            command: [process.execPath, "-e", "console.log('sandbox-run')"],
        });

        expect(result.execution.status).toBe("completed");
        expect(result.execution.exitCode).toBe(0);
        expect(result.execution.stdout).toContain("sandbox-run");
        expect(result.artifacts).toHaveLength(1);
        expect(rig.runner.run).toHaveBeenCalledTimes(1);
        expect(rig.executions.get(result.execution.id)?.status).toBe("completed");
        expect((await rig.service.listArtifacts(result.execution.id))).toHaveLength(1);
    });

    it("resolves a dry-run with the active sandbox profile and agent config", async () => {
        const rig = createSandboxRig();

        const result = await rig.service.dryRun({
            agentId: "agent-1",
            capability: "read",
            command: ["node", "-v"],
            requestedPaths: ["/workspace/input"],
        });

        expect(result.validation.valid).toBe(true);
        expect(result.allowed).toBe(true);
        expect(result.effectivePolicy.mode).toBe("process");
        expect(result.profile?.id).toBe("sbx_code_runner");
    });
});

function createSandboxRig() {
    const profiles = new Map<string, SandboxProfile>(createSystemSandboxProfiles().map((profile) => [profile.id, profile]));
    const agentConfigs = new Map([
        ["agent-1", createDefaultAgentSandboxConfig("agent-1")],
    ]);
    const executions = new Map<string, SandboxExecution>();
    const artifacts = new Map<string, SandboxArtifact[]>();
    const approvals = new Map<string, any>();
    const runner = {
        run: vi.fn(async () => ({
            status: "completed",
            stdout: "sandbox-run\n",
            stderr: "",
            exitCode: 0,
            durationMs: 11,
            resourceUsage: {
                stdoutKb: 1,
                stderrKb: 0,
            },
        })),
    };

    const service = new SandboxService(
        {
            list: async () => [...profiles.values()],
            getById: async (id: string) => profiles.get(id) || null,
            save: async (profile: SandboxProfile) => {
                profiles.set(profile.id, profile);
                return profile;
            },
            delete: async () => {
                return;
            },
        } as any,
        {
            getByAgentId: async (agentId: string) => agentConfigs.get(agentId) || createDefaultAgentSandboxConfig(agentId),
            save: async (config: any) => {
                agentConfigs.set(config.agentId, config);
                return config;
            },
            list: async () => [...agentConfigs.values()],
        } as any,
        {
            list: async () => [...executions.values()],
            getById: async (id: string) => executions.get(id) || null,
            save: async (execution: SandboxExecution) => {
                executions.set(execution.id, execution);
                return execution;
            },
        } as any,
        {
            listByExecutionId: async (executionId: string) => artifacts.get(executionId) || [],
            saveByExecutionId: async (executionId: string, nextArtifacts: SandboxArtifact[]) => {
                artifacts.set(executionId, nextArtifacts);
            },
        } as any,
        {
            list: async () => [...approvals.values()],
            getById: async (id: string) => approvals.get(id) || null,
            save: async (request: any) => {
                approvals.set(request.id, request);
                return request;
            },
            delete: async () => {
                return;
            },
        } as any,
        undefined,
        undefined,
        undefined,
        undefined,
        runner as any,
    );

    return { service, runner, executions, artifacts, approvals };
}
