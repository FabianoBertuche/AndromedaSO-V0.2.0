import { globalEventBus, FeedbackSubmitted } from "@andromeda/core";
import { getPrismaClient } from "../../infrastructure/database/prisma";
import { AgentReputationService } from "../evolution/reputation/AgentReputationService";
import { PerformanceConsolidationService } from "./application/services/PerformanceConsolidationService";
import { GetAgentPerformanceUseCase } from "./application/use-cases/GetAgentPerformanceUseCase";
import { GetAgentPerformanceTrendUseCase } from "./application/use-cases/GetAgentPerformanceTrendUseCase";
import { ConsolidatePerformanceJob } from "./infrastructure/ConsolidatePerformanceJob";
import { PrismaPerformanceRepository } from "./infrastructure/PrismaPerformanceRepository";
import { PerformanceController } from "./interfaces/http/PerformanceController";
import { createPerformanceRouter } from "./interfaces/http/performance.routes";

const prisma = getPrismaClient();

export const performanceRepository = new PrismaPerformanceRepository(prisma);
export const performanceConsolidationService = new PerformanceConsolidationService(performanceRepository);
export const agentReputationService = new AgentReputationService(performanceRepository);
export const getAgentPerformanceUseCase = new GetAgentPerformanceUseCase(performanceRepository);
export const getAgentPerformanceTrendUseCase = new GetAgentPerformanceTrendUseCase(performanceRepository);

const performanceController = new PerformanceController(
    getAgentPerformanceUseCase,
    getAgentPerformanceTrendUseCase,
);

export const performanceRouter = createPerformanceRouter(performanceController);
export const consolidatePerformanceJob = new ConsolidatePerformanceJob(
    performanceConsolidationService,
    async (agentIds) => {
        await Promise.all([...new Set(agentIds)].map((agentId) => agentReputationService.recalculate(agentId, "default")));
    },
);

void consolidatePerformanceJob.schedule().catch((error) => {
    console.error("[performance.consolidation.schedule.failed]", error);
});

globalEventBus.subscribe("feedback.submitted", async (event: FeedbackSubmitted) => {
    try {
        await agentReputationService.recalculate(event.agentId, event.tenantId);
    } catch (error) {
        console.error("[reputation.feedback.recalculate.failed]", error);
    }
});
