import { describe, expect, it } from "vitest";
import { createDefaultAgentProfile } from "../../../../../src/modules/agent-management/domain/agent-profile";
import { AgentPromptAssembler } from "../../../../../src/modules/agent-management/application/AgentPromptAssembler";

describe("AgentPromptAssembler", () => {
    it("assembles the agent context in the required layer order and translates persona controls", () => {
        const profile = createDefaultAgentProfile({
            id: "agent-kernel",
            name: "Kernel",
            role: "Operational orchestrator",
            description: "Coordinates execution across the platform.",
            teamId: "team-core",
            category: "orchestration",
            type: "orchestrator",
            specializations: ["planning", "coordination", "websocket"],
        });

        profile.version = "v1.2.0";
        profile.markdown.identity = "# Identity\nYou are the formal execution kernel.";
        profile.markdown.soul = "# Soul\nStay calm, precise, and collaborative.";
        profile.markdown.rules = "# Rules\n- Never invent facts.\n- Escalate when evidence is missing.";
        profile.markdown.playbook = "# Playbook\n1. Clarify.\n2. Execute.\n3. Review.\n4. Report.";
        profile.markdown.context = "# Context\nCurrent stack: TypeScript, React, Express.";
        profile.persona.formality = 88;
        profile.persona.proactivity = 91;
        profile.persona.detailLevel = 76;
        profile.safeguards.alwaysSuggestNextSteps = true;

        const assembler = new AgentPromptAssembler();
        const assembly = assembler.build(profile, {
            userPrompt: "Inspect the websocket handoff and explain the next move.",
            sessionId: "session-42",
            interactionMode: "chat",
        });

        const prompt = assembly.systemPrompt;

        expect(prompt.indexOf("## 1. Identity")).toBeLessThan(prompt.indexOf("## 2. Soul"));
        expect(prompt.indexOf("## 2. Soul")).toBeLessThan(prompt.indexOf("## 3. Rules"));
        expect(prompt.indexOf("## 3. Rules")).toBeLessThan(prompt.indexOf("## 4. Playbook"));
        expect(prompt.indexOf("## 4. Playbook")).toBeLessThan(prompt.indexOf("## 5. Context"));
        expect(prompt.indexOf("## 5. Context")).toBeLessThan(prompt.indexOf("## 6. Memory Layer"));
        expect(prompt.indexOf("## 6. Memory Layer")).toBeLessThan(prompt.indexOf("## 7. Persona Modulation"));
        expect(prompt).toContain("Maintain a highly formal tone.");
        expect(prompt).toContain("Proactively identify gaps and suggest next steps.");
        expect(prompt).toContain("Provide a thorough level of detail.");
        expect(prompt).toContain("Session: session-42");
        expect(prompt).toContain("Interaction mode: chat");
        expect(assembly.behaviorSnapshot.profileVersion).toBe("v1.2.0");
    });
});
