import { AgentBehaviorSnapshot, AgentProfile } from "../domain/agent-profile";
import { PersonaConfigTranslator } from "./PersonaConfigTranslator";

export interface AgentPromptAssemblyInput {
    userPrompt: string;
    sessionId?: string;
    interactionMode?: string;
    memoryBlocks?: string[];
}

export interface AgentPromptAssembly {
    systemPrompt: string;
    behaviorSnapshot: AgentBehaviorSnapshot;
    translatedPersona: string[];
}

export class AgentPromptAssembler {
    constructor(private readonly personaTranslator = new PersonaConfigTranslator()) { }

    build(profile: AgentProfile, input: AgentPromptAssemblyInput): AgentPromptAssembly {
        const translatedPersona = this.personaTranslator.translate(profile.persona, profile.safeguards);
        const behaviorSnapshot: AgentBehaviorSnapshot = {
            agentId: profile.id,
            profileVersion: profile.version,
            persona: profile.persona,
            safeguards: profile.safeguards,
            appliedPolicies: profile.safeguards.activePolicies,
            generatedAt: new Date().toISOString(),
        };

        const sections = [
            ["## 1. Identity", profile.markdown.identity],
            ["## 2. Soul", profile.markdown.soul],
            ["## 3. Rules", profile.markdown.rules],
            ["## 4. Playbook", profile.markdown.playbook],
            ["## 5. Context", profile.markdown.context],
            ["## 6. Memory Layer", this.renderMemoryContext(input.memoryBlocks || [])],
            ["## 7. Persona Modulation", translatedPersona.map((line) => `- ${line}`).join("\n")],
            ["## 8. Runtime Context", this.renderRuntimeContext(profile, input)],
        ];

        return {
            systemPrompt: sections
                .map(([title, body]) => `${title}\n${body}`.trim())
                .join("\n\n"),
            behaviorSnapshot,
            translatedPersona,
        };
    }

    private renderRuntimeContext(profile: AgentProfile, input: AgentPromptAssemblyInput): string {
        return [
            `Agent ID: ${profile.id}`,
            `Profile version: ${profile.version}`,
            `Session: ${input.sessionId || "n/a"}`,
            `Interaction mode: ${input.interactionMode || "chat"}`,
            `Current user request: ${input.userPrompt}`,
        ].join("\n");
    }

    private renderMemoryContext(memoryBlocks: string[]): string {
        if (memoryBlocks.length === 0) {
            return "No retrieved memory available for this execution.";
        }

        return memoryBlocks.map((block) => `- ${block}`).join("\n\n");
    }
}
