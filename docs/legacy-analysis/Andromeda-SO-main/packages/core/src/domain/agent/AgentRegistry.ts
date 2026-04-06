import { Agent } from "./Agent";

export interface AgentRegistry {
    register(agent: Agent): Promise<void>;
    findById(id: string): Promise<Agent | null>;
    getDefaultAgent(): Promise<Agent>;
    listAll(): Promise<Agent[]>;
}
