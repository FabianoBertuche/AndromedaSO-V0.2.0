import express from "express";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createSystemSandboxProfiles } from "../../../../src/modules/sandbox/domain/presets";
import { createDefaultAgentSandboxConfig } from "../../../../src/modules/sandbox/domain/types";
import { SandboxService } from "../../../../src/modules/sandbox/application/SandboxService";
import {
    FileAgentSandboxConfigRepository,
    FileApprovalRequestRepository,
    FileSandboxArtifactRepository,
    FileSandboxExecutionRepository,
    FileSandboxProfileRepository,
} from "../../../../src/modules/sandbox/infrastructure/FileSandboxRepositories";
import { ProcessSandboxRunner } from "../../../../src/modules/sandbox/infrastructure/ProcessSandboxRunner";
import { createSandboxRouter } from "../../../../src/modules/sandbox/interfaces/http/sandbox.routes";

describe("sandbox HTTP integration", () => {
    let tempDir: string;
    let app: express.Express;

    beforeEach(async () => {
        tempDir = mkdtempSync(path.join(os.tmpdir(), "andromeda-sandbox-"));

        const profileRepository = new FileSandboxProfileRepository(path.join(tempDir, "profiles"));
        const agentRepository = new FileAgentSandboxConfigRepository(path.join(tempDir, "agent-configs"));
        const executionRepository = new FileSandboxExecutionRepository(path.join(tempDir, "executions"));
        const artifactRepository = new FileSandboxArtifactRepository(path.join(tempDir, "artifacts"));
        const approvalRepository = new FileApprovalRequestRepository(path.join(tempDir, "approvals"));

        for (const profile of createSystemSandboxProfiles()) {
            await profileRepository.save(profile);
        }

        const service = new SandboxService(
            profileRepository,
            agentRepository,
            executionRepository,
            artifactRepository,
            approvalRepository,
            undefined,
            undefined,
            undefined,
            undefined,
            new ProcessSandboxRunner(),
        );

        app = express();
        app.use(express.json());
        app.use("/sandbox", createSandboxRouter(service));

        await agentRepository.save(createDefaultAgentSandboxConfig("agent-1"));
    });

    afterEach(() => {
        if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("orquestra agente, sandbox e execucao em um fluxo completo", async () => {
        const cwd = process.cwd();
        const command = [process.execPath, "-e", "console.log('sandbox-flow')"];

        const sandboxBefore = await request(app).get("/sandbox/agents/agent-1/sandbox");
        expect(sandboxBefore.status).toBe(200);
        expect(sandboxBefore.body.profileId).toBe("sbx_code_runner");

        const sandboxUpdate = await request(app)
            .put("/sandbox/agents/agent-1/sandbox")
            .send({
                profileId: "sbx_code_runner",
                overrides: {
                    filesystem: {
                        workingDirectory: cwd,
                        allowedReadPaths: [cwd],
                        allowedWritePaths: [],
                    },
                },
            });

        expect(sandboxUpdate.status).toBe(200);
        expect(sandboxUpdate.body.overrides.filesystem.workingDirectory).toBe(cwd);

        const dryRun = await request(app)
            .post("/sandbox/dry-run")
            .send({
                agentId: "agent-1",
                capability: "read",
                command,
                requestedPaths: [cwd],
            });

        expect(dryRun.status).toBe(200);
        expect(dryRun.body.allowed).toBe(true);
        expect(dryRun.body.validation.valid).toBe(true);
        expect(dryRun.body.profile.id).toBe("sbx_code_runner");
        expect(dryRun.body.agentConfig.agentId).toBe("agent-1");

        const executionResponse = await request(app)
            .post("/sandbox/executions")
            .send({
                agentId: "agent-1",
                capability: "read",
                command,
                requestedPaths: [cwd],
            });

        expect(executionResponse.status).toBe(201);
        expect(executionResponse.body.execution.agentId).toBe("agent-1");
        expect(executionResponse.body.execution.status).toBe("completed");
        expect(executionResponse.body.execution.stdout).toContain("sandbox-flow");

        const executions = await request(app).get("/sandbox/executions");
        expect(executions.status).toBe(200);
        expect(executions.body).toHaveLength(1);
        expect(executions.body[0].id).toBe(executionResponse.body.execution.id);

        const executionDetail = await request(app).get(`/sandbox/executions/${executionResponse.body.execution.id}`);
        expect(executionDetail.status).toBe(200);
        expect(executionDetail.body.id).toBe(executionResponse.body.execution.id);
        expect(executionDetail.body.stdout).toContain("sandbox-flow");
    });
});
