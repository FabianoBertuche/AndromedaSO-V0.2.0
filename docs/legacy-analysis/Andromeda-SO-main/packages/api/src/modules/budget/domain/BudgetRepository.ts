import {
    AgentBudgetPolicyView,
    BudgetReportFilters,
    BudgetReportItem,
    BudgetSpendInput,
    UpsertBudgetPolicyInput,
} from "./BudgetPolicy";

export interface BudgetReportAggregate extends BudgetReportItem {
    currency: string;
}

export interface BudgetRepository {
    getPolicy(tenantId: string, agentId: string): Promise<AgentBudgetPolicyView | null>;
    upsertPolicy(input: UpsertBudgetPolicyInput): Promise<AgentBudgetPolicyView>;
    recordSpend(input: BudgetSpendInput): Promise<void>;
    resetDailyBudgets(referenceAt: Date): Promise<number>;
    report(filters: BudgetReportFilters): Promise<BudgetReportAggregate[]>;
}
