import { Agent, AgentRegistry } from "@andromeda/core";

export class InMemoryAgentRegistry implements AgentRegistry {
    private agents: Map<string, Agent> = new Map();

    constructor() {
        // Agente Padrão (Kernel Agent)
        const defaultAgent = new Agent({
            id: "kernel-agent",
            name: "Andromeda Kernel",
            description: "Agente principal do sistema",
            model: "gpt-4o",
            systemPrompt: "Você é o Kernel do Andromeda OS. Sua missão é ajudar o usuário com precisão e eficiência.",
        });
        this.register(defaultAgent);
    }

    async register(agent: Agent): Promise<void> {
        this.agents.set(agent.getId(), agent);
    }

    async findById(id: string): Promise<Agent | null> {
        return this.agents.get(id) || null;
    }

    async findByName(name: string): Promise<Agent | null> {
        return Array.from(this.agents.values()).find(a => a.getName() === name) || null;
    }

    async listAll(): Promise<Agent[]> {
        return Array.from(this.agents.values());
    }

    async getDefaultAgent(): Promise<Agent> {
        return this.agents.get("kernel-agent")!;
    }
}
