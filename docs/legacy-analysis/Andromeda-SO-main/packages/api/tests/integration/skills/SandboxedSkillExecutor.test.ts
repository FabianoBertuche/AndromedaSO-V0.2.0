import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { Skill, SkillType } from "@andromeda/core";
import { createSystemSandboxProfiles } from "../../../src/modules/sandbox/domain/presets";
import { createDefaultAgentSandboxConfig } from "../../../src/modules/sandbox/domain/types";
import { SandboxService } from "../../../src/modules/sandbox/application/SandboxService";
import {
    FileAgentSandboxConfigRepository,
    FileApprovalRequestRepository,
    FileSandboxArtifactRepository,
    FileSandboxExecutionRepository,
    FileSandboxProfileRepository,
} from "../../../src/modules/sandbox/infrastructure/FileSandboxRepositories";
import { ProcessSandboxRunner } from "../../../src/modules/sandbox/infrastructure/ProcessSandboxRunner";
import { SandboxedSkillExecutor } from "../../../src/infrastructure/skills/SandboxedSkillExecutor";

describe("SandboxedSkillExecutor", () => {
    let tempDir = "";

    beforeEach(async () => {
        tempDir = mkdtempSync(path.join(os.tmpdir(), "andromeda-skill-sandbox-"));
    });

    afterEach(() => {
        if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("executes script skills through sandboxed process execution", async () => {
        const profileRepository = new FileSandboxProfileRepository(path.join(tempDir, "profiles"));
        const agentRepository = new FileAgentSandboxConfigRepository(path.join(tempDir, "agent-configs"));
        const executionRepository = new FileSandboxExecutionRepository(path.join(tempDir, "executions"));
        const artifactRepository = new FileSandboxArtifactRepository(path.join(tempDir, "artifacts"));
        const approvalRepository = new FileApprovalRequestRepository(path.join(tempDir, "approvals"));

        for (const profile of createSystemSandboxProfiles()) {
            await profileRepository.save(profile);
        }

        const sandboxService = new SandboxService(
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

        await agentRepository.save(createDefaultAgentSandboxConfig("agent-1"));

        const executor = new SandboxedSkillExecutor(sandboxService);
        const skill = new Skill({
            id: "skill-echo",
            name: "Echo",
            description: "Echo the input",
            type: SkillType.SCRIPT,
            code: `
result = {
  echoed: input.message,
  mode: context.mode,
};
`,
        });

        const result = await executor.execute(skill, { message: "sandboxed" }, {
            agentId: "agent-1",
            metadata: { mode: "integration-test" },
        });

        expect(result.status).toBe("completed");
        expect(result.executionId).toBeDefined();
        expect(result.output).toMatchObject({
            echoed: "sandboxed",
            mode: "integration-test",
        });
    });
});
