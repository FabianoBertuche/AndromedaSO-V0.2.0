import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createSandboxRouter } from "../../../../src/modules/sandbox/interfaces/http/sandbox.routes";

describe("sandbox routes", () => {
    it("serves profiles, sandbox config and dry-run responses", async () => {
        const service = {
            listProfiles: vi.fn(async () => [
                {
                    id: "sbx_code_runner",
                    name: "Code Runner",
                    description: "desc",
                    version: 1,
                    isSystem: true,
                    mode: "process",
                    riskLevel: "high",
                    config: {
                        enabled: true,
                        mode: "process",
                        filesystem: {
                            readOnlyRoot: true,
                            workingDirectory: "/workspace",
                            allowedReadPaths: ["/workspace"],
                            allowedWritePaths: ["/workspace/output"],
                            tempDirectory: "/workspace/tmp",
                            persistArtifacts: true,
                        },
                        network: {
                            mode: "off",
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
                            allowedBinaries: ["node"],
                            blockedBinaries: ["sudo"],
                            allowedInterpreters: ["node"],
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
                            allowedOutputTypes: ["text", "json"],
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
                    },
                    createdAt: "2026-03-18T00:00:00.000Z",
                    updatedAt: "2026-03-18T00:00:00.000Z",
                },
            ]),
            getAgentSandboxConfig: vi.fn(async () => ({
                agentId: "agent-1",
                enabled: true,
                profileId: "sbx_code_runner",
                overrides: {},
                enforcement: {
                    mandatoryForCapabilities: ["exec"],
                    fallbackBehavior: "deny",
                },
                createdAt: "2026-03-18T00:00:00.000Z",
                updatedAt: "2026-03-18T00:00:00.000Z",
            })),
            updateAgentSandboxConfig: vi.fn(async (_agentId: string, payload: any) => ({
                agentId: "agent-1",
                enabled: payload.enabled ?? true,
                profileId: payload.profileId ?? "sbx_code_runner",
                overrides: payload.overrides ?? {},
                enforcement: payload.enforcement ?? {
                    mandatoryForCapabilities: ["exec"],
                    fallbackBehavior: "deny",
                },
                createdAt: "2026-03-18T00:00:00.000Z",
                updatedAt: "2026-03-18T00:00:00.000Z",
            })),
            dryRun: vi.fn(async () => ({
                allowed: true,
                requiresApproval: false,
                riskLevel: "low",
                validation: { valid: true, issues: [] },
                effectivePolicy: {
                    enabled: true,
                    mode: "process",
                    filesystem: {
                        readOnlyRoot: true,
                        workingDirectory: "/workspace",
                        allowedReadPaths: ["/workspace"],
                        allowedWritePaths: ["/workspace/output"],
                        tempDirectory: "/workspace/tmp",
                        persistArtifacts: true,
                    },
                    network: {
                        mode: "off",
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
                        allowedBinaries: ["node"],
                        blockedBinaries: ["sudo"],
                        allowedInterpreters: ["node"],
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
                        allowedOutputTypes: ["text", "json"],
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
                },
                reasons: [],
                agentConfig: null,
                profile: null,
            })),
            listExecutions: vi.fn(async () => []),
            listApprovals: vi.fn(async () => []),
        } as any;

        const app = express();
        app.use(express.json());
        app.use("/sandbox", createSandboxRouter(service));

        const profilesResponse = await request(app).get("/sandbox/profiles");
        expect(profilesResponse.status).toBe(200);
        expect(profilesResponse.body).toHaveLength(1);

        const sandboxResponse = await request(app).get("/sandbox/agents/agent-1/sandbox");
        expect(sandboxResponse.status).toBe(200);
        expect(sandboxResponse.body.profileId).toBe("sbx_code_runner");

        const dryRunResponse = await request(app).post("/sandbox/dry-run").send({
            agentId: "agent-1",
            capability: "read",
            command: ["node", "-v"],
        });
        expect(dryRunResponse.status).toBe(200);
        expect(dryRunResponse.body.allowed).toBe(true);
    });
});
