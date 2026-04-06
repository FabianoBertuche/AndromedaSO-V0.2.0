import { Task } from "@andromeda/core";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentProfileService } from "../../../../src/modules/agent-management/application/AgentProfileService";
import { AgentPromptAssembler } from "../../../../src/modules/agent-management/application/AgentPromptAssembler";
import { AgentRuntimeOrchestrator } from "../../../../src/modules/agent-management/application/AgentRuntimeOrchestrator";
import { createDefaultAgentProfile } from "../../../../src/modules/agent-management/domain/agent-profile";
import { FileBackedAgentRegistry } from "../../../../src/modules/agent-management/infrastructure/FileBackedAgentRegistry";
import { FileSystemAgentProfileRepository } from "../../../../src/modules/agent-management/infrastructure/FileSystemAgentProfileRepository";
import { InMemoryTaskRepository } from "../../../../src/infrastructure/repositories/InMemoryTaskRepository";
import { LLMExecutionStrategy } from "../../../../src/infrastructure/execution/LLMExecutionStrategy";

describe("LLMExecutionStrategy agent runtime integration", () => {
    vi.setConfig({ testTimeout: 15000 });
    let tempDir = "";

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), "andromeda-agent-runtime-"));
    });

    afterEach(async () => {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it("uses targetAgentId to assemble the system prompt and returns behavior audit metadata", async () => {
        const repository = new FileSystemAgentProfileRepository(tempDir);
        const profile = createDefaultAgentProfile({
            id: "agent-executor",
            name: "Executor",
            role: "Technical executor",
            description: "Implements TypeScript changes with discipline.",
            teamId: "team-core",
            category: "delivery",
            type: "executor",
            specializations: ["coding", "testing", "websocket"],
        });
        profile.markdown.identity = "# Identity\nYou are the execution specialist.";
        profile.markdown.rules = "# Rules\n- Never invent facts.\n- Report next steps.";
        profile.persona.formality = 70;
        profile.persona.detailLevel = 75;
        profile.safeguards.alwaysSuggestNextSteps = true;

        await repository.save(profile, { summary: "seed" });

        const profileService = new AgentProfileService(repository, new InMemoryTaskRepository());
        const registry = new FileBackedAgentRegistry(profileService, new AgentPromptAssembler());
        const runtime = new AgentRuntimeOrchestrator(profileService, new AgentPromptAssembler());

        const providerAdapter = {
            chat: vi.fn().mockResolvedValue({
                message: {
                    content: "Status: websocket flow inspected.\nNext steps: add the agent selector to the console.",
                },
                usage: {
                    prompt_tokens: 25,
                    completion_tokens: 18,
                },
            }),
            listModels: vi.fn().mockResolvedValue([]),
        };

        const strategy = new LLMExecutionStrategy(
            registry,
            undefined,
            providerAdapter as any,
            runtime,
        );

        const task = new Task({
            rawRequest: "Inspect the websocket task handoff and recommend the next implementation step.",
            metadata: {
                modelId: "mock-model",
                targetAgentId: "agent-executor",
                interactionMode: "chat",
            },
        });

        const result = await strategy.execute(task);

        expect(providerAdapter.chat).toHaveBeenCalledTimes(1);
        const llmPayload = providerAdapter.chat.mock.calls[0]?.[1];
        expect(llmPayload.messages[0].role).toBe("system");
        expect(llmPayload.messages[0].content).toContain("You are the execution specialist.");
        expect(result.success).toBe(true);
        expect(result.data?.agent.id).toBe("agent-executor");
        expect(result.data?.audit.overallConformanceScore).toBeGreaterThan(70);
    });

    it("blocks out-of-role prompts before calling the model when strict safeguards require it", async () => {
        const repository = new FileSystemAgentProfileRepository(tempDir);
        const profile = createDefaultAgentProfile({
            id: "agent-auditor",
            name: "Auditor",
            role: "Security auditor",
            description: "Reviews security and compliance changes.",
            teamId: "team-trust",
            category: "audit",
            type: "auditor",
            specializations: ["security", "audit", "review"],
        });
        profile.safeguards.mode = "strict";
        profile.safeguards.blockOutOfRoleResponses = true;
        profile.safeguards.correctiveAction = "fallback";

        await repository.save(profile, { summary: "seed" });

        const profileService = new AgentProfileService(repository, new InMemoryTaskRepository());
        const registry = new FileBackedAgentRegistry(profileService, new AgentPromptAssembler());
        const runtime = new AgentRuntimeOrchestrator(profileService, new AgentPromptAssembler());

        const providerAdapter = {
            chat: vi.fn(),
            listModels: vi.fn().mockResolvedValue([]),
        };

        const strategy = new LLMExecutionStrategy(
            registry,
            undefined,
            providerAdapter as any,
            runtime,
        );

        const task = new Task({
            rawRequest: "Write a whimsical poem about moonlight and ocean waves.",
            metadata: {
                modelId: "mock-model",
                targetAgentId: "agent-auditor",
                interactionMode: "chat",
            },
        });

        const result = await strategy.execute(task);

        expect(providerAdapter.chat).not.toHaveBeenCalled();
        expect(result.success).toBe(true);
        expect(result.data?.audit.status).toBe("blocked");
        expect(result.data?.content).toContain("outside the agent role");
    });
});
