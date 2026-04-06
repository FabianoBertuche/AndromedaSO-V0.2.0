import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import agentAssetRoutes from "../../../../src/presentation/routes/agentAssetRoutes";

describe("agent-assets routes", () => {
    it("returns diagnostics for local rules, workflows and skills", async () => {
        const app = express();
        app.use("/agent-assets", agentAssetRoutes);

        const response = await request(app).get("/agent-assets/diagnostics");

        expect(response.status).toBe(200);
        expect(response.body.totals.skills).toBeGreaterThan(0);
        expect(response.body.totals.rules).toBeGreaterThan(0);
        expect(response.body.totals.workflows).toBeGreaterThan(0);
        expect(response.body.totals.agents).toBeGreaterThan(0);
        expect(Array.isArray(response.body.skills)).toBe(true);
        expect(Array.isArray(response.body.rules)).toBe(true);
        expect(Array.isArray(response.body.workflows)).toBe(true);
        expect(Array.isArray(response.body.agents)).toBe(true);
    });
});
