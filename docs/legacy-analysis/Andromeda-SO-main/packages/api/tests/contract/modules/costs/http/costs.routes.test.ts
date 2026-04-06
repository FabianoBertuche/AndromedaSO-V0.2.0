import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { ExportCostsCsvUseCase } from "../../../../../src/modules/costs/application/use-cases/ExportCostsCsvUseCase";
import { GetCostsByAgentUseCase } from "../../../../../src/modules/costs/application/use-cases/GetCostsByAgentUseCase";
import { GetCostsSummaryUseCase } from "../../../../../src/modules/costs/application/use-cases/GetCostsSummaryUseCase";
import { CostsController } from "../../../../../src/modules/costs/interfaces/http/CostsController";
import { createCostsRouter } from "../../../../../src/modules/costs/interfaces/http/costs.routes";

describe("costs routes", () => {
    it("returns summary, by-agent data and csv export", async () => {
        const repository = {
            getSummary: async () => ({
                range: { from: "2026-03-01T00:00:00.000Z", to: "2026-03-31T23:59:59.999Z" },
                currency: "USD",
                totals: { costUsd: 12.5, tokensUsed: 1200, executions: 4, avgCostPerExecutionUsd: 3.125 },
                series: [{ bucket: "2026-03-23", costUsd: 12.5, tokensUsed: 1200, executions: 4 }],
            }),
            getByAgent: async () => ({
                range: { from: "2026-03-01T00:00:00.000Z", to: "2026-03-31T23:59:59.999Z" },
                items: [{ agentId: "agent-1", executions: 4, tokensUsed: 1200, costUsd: 12.5, avgLatencyMs: 1200 }],
            }),
            exportCsv: async () => "agentId,executions,tokensUsed,costUsd,avgLatencyMs\nagent-1,4,1200,12.5,1200\n",
        };

        const controller = new CostsController(
            new GetCostsSummaryUseCase(repository as any),
            new GetCostsByAgentUseCase(repository as any),
            new ExportCostsCsvUseCase(repository as any),
        );

        const app = express();
        app.use(express.json());
        app.use((req: any, _res, next) => {
            req.tenantId = "default";
            next();
        });
        app.use("/costs", createCostsRouter(controller));

        const summary = await request(app).get("/costs/summary");
        expect(summary.status).toBe(200);
        expect(summary.body.totals.costUsd).toBe(12.5);

        const byAgent = await request(app).get("/costs/by-agent?limit=5");
        expect(byAgent.status).toBe(200);
        expect(byAgent.body.items[0].agentId).toBe("agent-1");

        const exported = await request(app).post("/costs/export").send({ groupBy: "agent" });
        expect(exported.status).toBe(200);
        expect(exported.body.data).toContain("agent-1,4,1200,12.5,1200");
    });
});
