import { describe, expect, it, vi } from "vitest";
import { RecordSpendUseCase } from "../../../../../../src/modules/budget/application/use-cases/RecordSpendUseCase";
import { BudgetRepository } from "../../../../../../src/modules/budget/domain/BudgetRepository";

describe("RecordSpendUseCase", () => {
    it("normalizes values before persisting spend", async () => {
        const recordSpend = vi.fn().mockResolvedValue(undefined);
        const useCase = new RecordSpendUseCase({
            getPolicy: async () => null,
            upsertPolicy: async () => {
                throw new Error("not implemented");
            },
            recordSpend,
            resetDailyBudgets: async () => 0,
            report: async () => [],
        } satisfies BudgetRepository);

        await useCase.execute({
            tenantId: "default",
            taskId: "task-1",
            agentId: "agent-1",
            status: " completed ",
            costUsd: -1,
            model: " llama3 ",
            provider: " ollama ",
        });

        expect(recordSpend).toHaveBeenCalledWith(expect.objectContaining({
            status: "completed",
            costUsd: 0,
            model: "llama3",
            provider: "ollama",
        }));
    });
});
