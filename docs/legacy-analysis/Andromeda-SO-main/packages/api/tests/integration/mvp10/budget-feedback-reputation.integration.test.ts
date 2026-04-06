import { Task } from "@andromeda/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CheckBudgetBeforeExecutionUseCase } from "../../../src/modules/budget/application/use-cases/CheckBudgetBeforeExecutionUseCase";
import { RecordSpendUseCase } from "../../../src/modules/budget/application/use-cases/RecordSpendUseCase";
import { BudgetRepository } from "../../../src/modules/budget/domain/BudgetRepository";
import { SubmitTaskFeedbackUseCase } from "../../../src/modules/feedback/application/use-cases/SubmitTaskFeedbackUseCase";
import { FeedbackRepository } from "../../../src/modules/feedback/domain/FeedbackRepository";
import { AgentReputationService } from "../../../src/modules/evolution/reputation/AgentReputationService";
import { PerformanceRepository } from "../../../src/modules/performance/domain/PerformanceRepository";

describe("MVP10 integration flow", () => {
    let budgetRepo: InMemoryBudgetRepository;
    let feedbackRepo: InMemoryFeedbackRepository;
    let performanceRepo: InMemoryPerformanceRepository;

    beforeEach(() => {
        budgetRepo = new InMemoryBudgetRepository();
        feedbackRepo = new InMemoryFeedbackRepository(budgetRepo);
        performanceRepo = new InMemoryPerformanceRepository(budgetRepo);
    });

    it("runs task -> spend -> budget -> feedback -> reputation", async () => {
        const task = new Task({ id: "task-1", rawRequest: "hello", metadata: { targetAgentId: "agent-1" } });
        const taskRepository = {
            save: async () => undefined,
            findById: async (id: string) => id === "task-1" ? task : null,
            findAll: async () => [task],
            findBySessionId: async () => [task],
        };

        await budgetRepo.upsertPolicy({ tenantId: "default", agentId: "agent-1", dailyLimitUsd: 5, monthlyLimitUsd: 50, currency: "USD", alertsEnabled: true });

        const checkBudget = new CheckBudgetBeforeExecutionUseCase(budgetRepo);
        await expect(checkBudget.execute({ tenantId: "default", agentId: "agent-1", estimatedCostUsd: 1.2 })).resolves.toBeUndefined();

        const recordSpend = new RecordSpendUseCase(budgetRepo);
        await recordSpend.execute({
            tenantId: "default",
            taskId: "task-1",
            agentId: "agent-1",
            capability: "research",
            status: "completed",
            costUsd: 1.2,
            totalTokens: 800,
            conformanceScore: 0.9,
            executionCompletedAt: new Date(),
        });

        const submitFeedback = new SubmitTaskFeedbackUseCase(feedbackRepo, taskRepository as any);
        await submitFeedback.execute({ tenantId: "default", taskId: "task-1", userId: "user-1", rating: 1, comment: "great" });

        const reputation = await new AgentReputationService(performanceRepo).recalculate("agent-1", "default");

        expect(budgetRepo.policy?.dailySpentUsd).toBe(1.2);
        expect(feedbackRepo.items).toHaveLength(1);
        expect(reputation.research).toBeGreaterThan(0);
    });
});

class InMemoryBudgetRepository implements BudgetRepository {
    policy: any = null;
    ledger = new Map<string, any>();
    async getPolicy(_tenantId: string, _agentId: string) { return this.policy; }
    async upsertPolicy(input: any) {
        this.policy = { agentId: input.agentId, dailyLimitUsd: input.dailyLimitUsd, monthlyLimitUsd: input.monthlyLimitUsd, dailySpentUsd: 0, monthlySpentUsd: 0, currency: input.currency || "USD", alertsEnabled: input.alertsEnabled ?? true, lastDailyResetAt: null, lastMonthlyResetAt: null, updatedAt: new Date().toISOString() };
        return this.policy;
    }
    async recordSpend(input: any) {
        if (this.policy && input.costUsd > 0) {
            this.policy.dailySpentUsd += input.costUsd;
            this.policy.monthlySpentUsd += input.costUsd;
        }
        this.ledger.set(input.taskId, { ...input, feedbackRating: this.ledger.get(input.taskId)?.feedbackRating });
    }
    async resetDailyBudgets() { return 0; }
    async report() { return []; }
}

class InMemoryFeedbackRepository implements FeedbackRepository {
    items: any[] = [];
    constructor(private readonly budgetRepo: InMemoryBudgetRepository) { }
    async findByTask(taskId: string, tenantId: string) { return this.items.filter((item) => item.taskId === taskId && item.tenantId === tenantId); }
    async findByTaskAndUser(taskId: string, tenantId: string, userId: string) { return this.items.find((item) => item.taskId === taskId && item.tenantId === tenantId && item.userId === userId) || null; }
    async create(input: any) {
        const item = { id: `fb-${this.items.length + 1}`, taskId: input.taskId, agentId: input.agentId, userId: input.userId, rating: input.rating, comment: input.comment || null, submittedAt: new Date().toISOString(), tenantId: input.tenantId };
        this.items.push(item);
        return item;
    }
    async findExecutionReference(taskId: string) {
        const ledger = this.budgetRepo.ledger.get(taskId);
        return ledger ? { taskId, agentId: ledger.agentId } : null;
    }
    async updateLedgerFeedback(taskId: string, _tenantId: string, rating: number) {
        const ledger = this.budgetRepo.ledger.get(taskId);
        if (ledger) this.budgetRepo.ledger.set(taskId, { ...ledger, feedbackRating: rating });
    }
}

class InMemoryPerformanceRepository implements PerformanceRepository {
    lastSaved: any;
    constructor(private readonly budgetRepo: InMemoryBudgetRepository) { }
    async listAgentRecords() { return []; }
    async listTrend() { return []; }
    async consolidateWindow() { return []; }
    async upsertRecord() { return undefined; }
    async getCapabilityMetrics(agentId: string) {
        const rows = [...this.budgetRepo.ledger.values()].filter((item) => item.agentId === agentId);
        return [{ capability: "research", successRate: rows[0]?.status === "completed" ? 1 : 0, conformance: rows[0]?.conformanceScore || 0, feedback: rows[0]?.feedbackRating === 1 ? 1 : 0 }];
    }
    async saveReputation(_agentId: string, _tenantId: string, reputationScores: Record<string, number>) { this.lastSaved = reputationScores; }
}
