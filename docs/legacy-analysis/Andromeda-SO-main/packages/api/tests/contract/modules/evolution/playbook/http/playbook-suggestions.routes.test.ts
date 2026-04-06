import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { PlaybookSuggestionsController } from "../../../../../../src/modules/evolution/playbook/interfaces/http/PlaybookSuggestionsController";
import { createPlaybookSuggestionsRouter } from "../../../../../../src/modules/evolution/playbook/interfaces/http/playbook-suggestions.routes";

describe("playbook suggestion routes", () => {
    it("lists and reviews suggestions", async () => {
        const service = {
            listByAgent: async () => [{
                id: "s1",
                agentId: "agent-1",
                title: "Improve analysis",
                summary: "Recent episodes suggest more explicit checks.",
                suggestion: "Add a verification step before parsing timestamps.",
                confidence: 0.82,
                status: "pending",
                sourceEpisodeIds: ["e1"],
                sourceEpisodes: [{ id: "e1", summary: "episode", createdAt: "2026-03-23T00:00:00.000Z", importanceScore: 80 }],
                reviewedBy: null,
                reviewedAt: null,
                rejectionReason: null,
                createdAt: "2026-03-23T00:00:00.000Z",
            }],
            approve: async () => ({ id: "s1", status: "approved" }),
            reject: async () => ({ id: "s1", status: "rejected" }),
        };

        const app = express();
        app.use(express.json());
        app.use((req: any, _res, next) => {
            req.tenantId = "default";
            req.user = { id: "user-1", tenantId: "default" };
            next();
        });
        app.use("/agents", createPlaybookSuggestionsRouter(new PlaybookSuggestionsController(service as any)));

        const list = await request(app).get("/agents/agent-1/playbook-suggestions");
        expect(list.status).toBe(200);
        expect(list.body.items[0].id).toBe("s1");

        const approve = await request(app).post("/agents/agent-1/playbook-suggestions/s1/approve");
        expect(approve.status).toBe(200);
        expect(approve.body.status).toBe("approved");

        const reject = await request(app).post("/agents/agent-1/playbook-suggestions/s1/reject").send({ reason: "not useful" });
        expect(reject.status).toBe(200);
        expect(reject.body.status).toBe("rejected");
    });
});
