import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { GetAgentPerformanceTrendUseCase } from "../../../../../src/modules/performance/application/use-cases/GetAgentPerformanceTrendUseCase";
import { GetAgentPerformanceUseCase } from "../../../../../src/modules/performance/application/use-cases/GetAgentPerformanceUseCase";
import { PerformanceController } from "../../../../../src/modules/performance/interfaces/http/PerformanceController";
import { createPerformanceRouter } from "../../../../../src/modules/performance/interfaces/http/performance.routes";

describe("performance routes", () => {
    it("returns performance history and trend", async () => {
        const repository = {
            listAgentRecords: async () => [{
                agentId: "agent-1",
                periodType: "daily",
                periodStart: "2026-03-23T00:00:00.000Z",
                periodEnd: "2026-03-23T23:59:59.999Z",
                tasksTotal: 4,
                tasksSucceeded: 3,
                tasksFailed: 1,
                successRate: 0.75,
                avgConformance: 0.8,
                feedbackScore: 1,
                avgLatencyMs: 1200,
                totalTokensUsed: 1200,
                totalCostUsd: 1.25,
                reputationScores: { research: 0.88 },
                reputationUpdatedAt: "2026-03-23T01:00:00.000Z",
                metricsSnapshot: null,
            }],
            listTrend: async () => [{ weekStart: "2026-03-17T00:00:00.000Z", avgSuccessRate: 0.75, avgConformanceScore: 0.8, totalCostUsd: 1.25 }],
        };

        const controller = new PerformanceController(
            new GetAgentPerformanceUseCase(repository as any),
            new GetAgentPerformanceTrendUseCase(repository as any),
        );
        const app = express();
        app.use((req: any, _res, next) => {
            req.tenantId = "default";
            next();
        });
        app.use("/agents", createPerformanceRouter(controller));

        const history = await request(app).get("/agents/agent-1/performance?period=30d");
        expect(history.status).toBe(200);
        expect(history.body.items[0].reputationScores.research).toBe(0.88);

        const trend = await request(app).get("/agents/agent-1/performance/trend");
        expect(trend.status).toBe(200);
        expect(trend.body.items[0].totalCostUsd).toBe(1.25);
    });
});
