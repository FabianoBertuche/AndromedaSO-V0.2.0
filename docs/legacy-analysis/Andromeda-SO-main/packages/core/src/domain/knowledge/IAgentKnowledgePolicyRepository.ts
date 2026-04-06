import { AgentKnowledgePolicy } from "./types";

export interface IAgentKnowledgePolicyRepository {
    getPolicyByAgent(agentId: string, tenantId: string): Promise<AgentKnowledgePolicy | null>;
    upsertPolicy(agentId: string, data: Partial<AgentKnowledgePolicy>, tenantId: string): Promise<AgentKnowledgePolicy>;
    deletePolicy(agentId: string, tenantId: string): Promise<void>;
}
