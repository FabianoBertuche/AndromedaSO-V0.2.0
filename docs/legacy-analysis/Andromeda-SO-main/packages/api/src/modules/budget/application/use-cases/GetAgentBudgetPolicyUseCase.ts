import { AgentBudgetPolicyView } from "../../domain/BudgetPolicy";
import { BudgetRepository } from "../../domain/BudgetRepository";

export class GetAgentBudgetPolicyUseCase {
    constructor(private readonly repository: BudgetRepository) { }

    async execute(tenantId: string, agentId: string): Promise<AgentBudgetPolicyView | null> {
        return this.repository.getPolicy(tenantId, agentId);
    }
}
