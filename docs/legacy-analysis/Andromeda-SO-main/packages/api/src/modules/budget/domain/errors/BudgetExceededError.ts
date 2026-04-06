export class BudgetExceededError extends Error {
    constructor(
        public readonly agentId: string,
        public readonly budgetScope: "daily" | "monthly",
        public readonly limitUsd: number,
        public readonly spentUsd: number,
        public readonly requestedUsd: number,
    ) {
        super(`Budget exceeded for agent ${agentId} on ${budgetScope} limit.`);
        this.name = "BudgetExceededError";
    }
}
