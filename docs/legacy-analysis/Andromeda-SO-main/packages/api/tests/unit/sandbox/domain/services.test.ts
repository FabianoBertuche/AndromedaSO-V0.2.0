import { describe, expect, it } from "vitest";
import { createSandboxConfig } from "../../../../src/modules/sandbox/domain/types";
import { CapabilityPolicyEngine, RiskLevelCalculator, SandboxPolicyResolver, SandboxValidator } from "../../../../src/modules/sandbox/domain/services";

describe("sandbox domain services", () => {
    it("keeps the most restrictive policy when resolving layers", () => {
        const resolver = new SandboxPolicyResolver();
        const globalPolicy = createSandboxConfig("process");
        const profilePolicy = createSandboxConfig("container", {
            network: {
                mode: "tool_only",
                blockPrivateNetworks: true,
                allowDns: true,
                httpOnly: true,
            },
        });

        const resolved = resolver.resolve({
            globalPolicy,
            profile: {
                id: "sbx_code_runner",
                name: "Code Runner",
                description: "desc",
                version: 1,
                isSystem: true,
                mode: "process",
                riskLevel: "high",
                config: profilePolicy,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            agentConfig: {
                agentId: "agent-1",
                enabled: true,
                profileId: "sbx_code_runner",
                overrides: {
                    network: {
                        mode: "full",
                    },
                },
                enforcement: {
                    mandatoryForCapabilities: ["exec"],
                    fallbackBehavior: "deny",
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            temporaryOverrides: {
                network: {
                    mode: "restricted",
                },
                filesystem: {
                    allowedWritePaths: ["/workspace/output", "/workspace/tmp"],
                },
            },
        });

        expect(resolved.network.mode).toBe("off");
        expect(resolved.filesystem.allowedWritePaths).toEqual(["/workspace/output"]);
        expect(resolved.security.disablePrivilegedMode).toBe(true);
    });

    it("flags dangerous sandbox settings during validation", () => {
        const validator = new SandboxValidator();
        const config = createSandboxConfig("process", {
            filesystem: {
                allowedWritePaths: [],
            },
        });
        config.mode = "none";
        config.network.mode = "full";
        config.network.blockPrivateNetworks = false;
        config.network.allowDns = true;
        config.network.httpOnly = false;
        config.execution.allowShell = true;
        config.security.runAsNonRoot = false;
        config.security.disablePrivilegedMode = false;

        const result = validator.validate(config, {
            production: true,
            capability: "write",
            requestedPaths: ["/tmp/outside"],
        });

        expect(result.valid).toBe(false);
        expect(result.issues.some((issue) => issue.field === "mode")).toBe(true);
        expect(result.issues.some((issue) => issue.field === "filesystem.allowedWritePaths")).toBe(true);
        expect(result.issues.some((issue) => issue.field === "network.mode")).toBe(true);
        expect(result.issues.some((issue) => issue.field === "execution.allowShell")).toBe(true);
        expect(result.issues.some((issue) => issue.field === "requestedPaths")).toBe(true);
    });

    it("identifies approval needs and risk levels consistently", () => {
        const engine = new CapabilityPolicyEngine();
        const calculator = new RiskLevelCalculator();
        const config = createSandboxConfig("container", {
            network: {
                mode: "tool_only",
                blockPrivateNetworks: true,
                allowDns: true,
                httpOnly: true,
            },
            approvals: {
                requireApprovalForExec: true,
            },
        });

        expect(engine.requiresSandbox("exec")).toBe(true);
        expect(engine.canRunWithoutSandbox("read")).toBe(true);
        expect(engine.requiresApproval("exec", config)).toBe(true);
        expect(calculator.calculate(config, true)).toMatch(/^(moderate|high|critical)$/);
    });
});
