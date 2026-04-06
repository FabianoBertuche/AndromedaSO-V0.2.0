import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { Task, Skill, SkillType } from "@andromeda/core";
import { InMemorySkillRegistry } from "../../../src/infrastructure/skills/InMemorySkillRegistry";
import { SandboxedSkillExecutor } from "../../../src/infrastructure/skills/SandboxedSkillExecutor";
import { SkillExecutionStrategy } from "../../../src/infrastructure/execution/SkillExecutionStrategy";
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

describe("SkillExecutionStrategy sandbox integration", () => {
    let tempDir = "";

    beforeEach(async () => {
        tempDir = mkdtempSync(path.join(os.tmpdir(), "andromeda-task-sandbox-"));
    });

    afterEach(() => {
        if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("routes skill tasks through the sandbox runner", async () => {
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

        const skillRegistry = new InMemorySkillRegistry();
        await skillRegistry.register(new Skill({
            id: "skill-echo",
            name: "Echo",
            description: "Echo the input through the sandbox.",
            type: SkillType.SCRIPT,
            code: `
result = {
  echoed: input.message,
  source: context.source,
};
`,
        }));

        const strategy = new SkillExecutionStrategy(
            skillRegistry,
            new SandboxedSkillExecutor(sandboxService),
        );

        const task = new Task({
            rawRequest: "please use echo skill for the current task",
            metadata: {
                input: {
                    message: "sandboxed",
                },
                source: "skill-strategy-test",
            },
        });

        const result = await strategy.execute(task);

        expect(result.success).toBe(true);
        expect(result.data?.output).toMatchObject({
            echoed: "sandboxed",
            source: "skill-strategy-test",
        });
    });

    it("ignores instructional skills during automatic skill-first resolution", async () => {
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

        const skillRegistry = new InMemorySkillRegistry();
        await skillRegistry.register(new Skill({
            id: "local-skill:brainstorming",
            name: "brainstorming",
            description: "Socratic questioning for task discovery.",
            type: SkillType.TOOL,
            schema: {
                source: "local-agent-skill",
                executionMode: "instructional",
            },
        }));

        const strategy = new SkillExecutionStrategy(
            skillRegistry,
            new SandboxedSkillExecutor(sandboxService),
        );

        const task = new Task({
            rawRequest: "please use brainstorming skill for the current task",
            metadata: {
                input: {},
            },
        });

        const result = await strategy.execute(task);

        expect(result.success).toBe(false);
        expect(result.error).toBe("Nenhuma skill encontrada");
    });
});
