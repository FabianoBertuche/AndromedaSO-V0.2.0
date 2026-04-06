import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { PlanCreationError } from "../../../../../src/modules/planner/domain/errors";
import { PlannerController } from "../../../../../src/modules/planner/interfaces/http/PlannerController";
import { createPlannerRouter } from "../../../../../src/modules/planner/interfaces/http/planner.routes";

function makeApp(controller: PlannerController) {
    const app = express();
    app.use(express.json());
    app.use((req: any, _res, next) => {
        req.tenantId = "default";
        req.user = { id: "user-1", tenantId: "default", role: "owner" };
        next();
    });
    app.use(createPlannerRouter(controller));
    return app;
}

describe("planner routes", () => {
    it("creates a plan through POST /plans", async () => {
        const controller = new PlannerController(
            { execute: async () => ({ plan: { id: "plan-1", title: "Plan", totalSteps: 2, status: "pending" }, steps: [{ id: "step-1", title: "Inspect" }, { id: "step-2", title: "Write" }] }) } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => ({ plan: null, steps: [] }) } as any,
            { execute: async () => [] } as any,
        );
        const response = await request(makeApp(controller))
            .post("/plans")
            .send({ taskId: "task-1", goal: "Analyze repo and write report" });

        expect(response.status).toBe(201);
        expect(response.body.planId).toBe("plan-1");
        expect(response.body.steps).toHaveLength(2);
    });

    it("returns 422 when plan creation fails", async () => {
        const controller = new PlannerController(
            { execute: async () => { throw new PlanCreationError("LLM retornou JSON inválido"); } } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => ({ plan: null, steps: [] }) } as any,
            { execute: async () => [] } as any,
        );
        const response = await request(makeApp(controller))
            .post("/plans")
            .send({ taskId: "task-1", goal: "Analyze repo and write report" });

        expect(response.status).toBe(422);
        expect(response.body.error.code).toBe("PLAN_CREATION_ERROR");
    });

    it("returns plan list through GET /plans", async () => {
        const controller = new PlannerController(
            { execute: async () => ({ plan: { id: "p1", title: "P", totalSteps: 1, status: "pending" }, steps: [] }) } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => ({ plan: null, steps: [] }) } as any,
            { execute: async () => [{ id: "plan-1", title: "Plan", status: "pending", totalSteps: 2, completedSteps: 0, failedSteps: 0, requiresApproval: false, taskId: "t1", description: null, createdAt: new Date(), updatedAt: new Date() }] } as any,
        );
        const response = await request(makeApp(controller)).get("/plans");

        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0].id).toBe("plan-1");
    });

    it("approves a step through POST /plans/:id/steps/:stepId/approve", async () => {
        const controller = new PlannerController(
            { execute: async () => ({ plan: { id: "p1", title: "P", totalSteps: 1, status: "pending" }, steps: [] }) } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => ({ plan: null, steps: [] }) } as any,
            { execute: async () => [] } as any,
        );
        const response = await request(makeApp(controller))
            .post("/plans/plan-1/steps/step-1/approve");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("approved");
    });

    it("rolls back a plan through POST /plans/:id/rollback", async () => {
        const controller = new PlannerController(
            { execute: async () => ({ plan: { id: "p1", title: "P", totalSteps: 1, status: "pending" }, steps: [] }) } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => undefined } as any,
            { execute: async () => ({ plan: null, steps: [] }) } as any,
            { execute: async () => [] } as any,
        );
        const response = await request(makeApp(controller))
            .post("/plans/plan-1/rollback");

        expect(response.status).toBe(200);
        expect(response.body.status).toBe("rolled_back");
    });
});