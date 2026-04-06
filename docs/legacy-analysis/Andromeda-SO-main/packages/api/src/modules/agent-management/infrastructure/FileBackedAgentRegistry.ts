import { Agent, AgentRegistry } from "@andromeda/core";
import { AgentPromptAssembler } from "../application/AgentPromptAssembler";
import { AgentProfileService } from "../application/AgentProfileService";

export class FileBackedAgentRegistry implements AgentRegistry {
    constructor(
        private readonly profileService: AgentProfileService,
        private readonly promptAssembler = new AgentPromptAssembler(),
    ) { }

    async register(agent: Agent): Promise<void> {
        await this.profileService.createAgent({
            id: agent.getId(),
            name: agent.getName(),
            role: agent.getName(),
            description: agent.getDescription(),
            defaultModel: agent.getModel(),
            isDefault: false,
            specializations: ["general"],
        });
    }

    async findById(id: string): Promise<Agent | null> {
        const profile = await this.profileService.getOptionalProfile(id);
        return profile ? this.toAgent(profile) : null;
    }

    async getDefaultAgent(): Promise<Agent> {
        const profile = await this.profileService.getActiveProfile();
        return this.toAgent(profile);
    }

    async listAll(): Promise<Agent[]> {
        const profiles = await this.profileService.listProfilesRaw();
        return profiles.map((profile) => this.toAgent(profile));
    }

    private toAgent(profile: Awaited<ReturnType<AgentProfileService["getActiveProfile"]>>): Agent {
        const assembly = this.promptAssembler.build(profile, {
            userPrompt: "",
            interactionMode: "task",
        });

        return new Agent({
            id: profile.id,
            name: profile.identity.name,
            description: profile.description,
            model: profile.defaultModel,
            systemPrompt: assembly.systemPrompt,
            temperature: mapPersonaToTemperature(profile.persona.creativity, profile.persona.caution),
        });
    }
}

function mapPersonaToTemperature(creativity: number, caution: number): number {
    const creativeBias = creativity / 100;
    const cautionPenalty = caution / 200;
    return Math.max(0.1, Math.min(0.95, 0.35 + creativeBias * 0.45 - cautionPenalty * 0.25));
}
