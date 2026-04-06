import { getPrismaClient } from "../../infrastructure/database/prisma";
import { CheckBudgetBeforeExecutionUseCase } from "./application/use-cases/CheckBudgetBeforeExecutionUseCase";
import { GetAgentBudgetPolicyUseCase } from "./application/use-cases/GetAgentBudgetPolicyUseCase";
import { GetBudgetReportUseCase } from "./application/use-cases/GetBudgetReportUseCase";
import { RecordSpendUseCase } from "./application/use-cases/RecordSpendUseCase";
import { ResetDailyBudgetUseCase } from "./application/use-cases/ResetDailyBudgetUseCase";
import { UpsertAgentBudgetPolicyUseCase } from "./application/use-cases/UpsertAgentBudgetPolicyUseCase";
import { PrismaBudgetRepository } from "./infrastructure/PrismaBudgetRepository";
import { ResetDailyBudgetJob } from "./infrastructure/ResetDailyBudgetJob";
import { BudgetController } from "./interfaces/http/BudgetController";
import { createBudgetRouter } from "./interfaces/http/budget.routes";

const prisma = getPrismaClient();

export const budgetRepository = new PrismaBudgetRepository(prisma);
export const getAgentBudgetPolicyUseCase = new GetAgentBudgetPolicyUseCase(budgetRepository);
export const upsertAgentBudgetPolicyUseCase = new UpsertAgentBudgetPolicyUseCase(budgetRepository);
export const checkBudgetBeforeExecutionUseCase = new CheckBudgetBeforeExecutionUseCase(budgetRepository);
export const recordSpendUseCase = new RecordSpendUseCase(budgetRepository);
export const resetDailyBudgetUseCase = new ResetDailyBudgetUseCase(budgetRepository);
export const getBudgetReportUseCase = new GetBudgetReportUseCase(budgetRepository);

const budgetController = new BudgetController(
    getAgentBudgetPolicyUseCase,
    upsertAgentBudgetPolicyUseCase,
    getBudgetReportUseCase,
);

export const budgetRouter = createBudgetRouter(budgetController);
export const resetDailyBudgetJob = new ResetDailyBudgetJob(resetDailyBudgetUseCase);

void resetDailyBudgetJob.schedule().catch((error) => {
    console.error("[budget.daily-reset.schedule.failed]", error);
});
