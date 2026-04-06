import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { MemoryService } from "../../../../src/modules/memory/application/MemoryService";
import { InMemoryMemoryRepositoryBundle } from "../../../../src/modules/memory/infrastructure/InMemoryMemoryRepository";
import { createMemoryRouter } from "../../../../src/modules/memory/interfaces/http/memory.routes";

describe("memory routes", () => {
    it("creates, retrieves and updates memory entries", async () => {
        const service = new MemoryService(new InMemoryMemoryRepositoryBundle());
        const app = express();
        app.use(express.json());
        app.use("/memory", createMemoryRouter(service));

        const created = await request(app)
            .post("/memory")
            .send({
                type: "semantic",
                scopeType: "agent",
                scopeId: "agent-1",
                title: "Known preference",
                content: "Prefer concise and actionable answers.",
                source: "manual",
                tags: ["preference"],
            });

        expect(created.status).toBe(201);
        expect(created.body.title).toBe("Known preference");

        const list = await request(app).get("/memory?agentId=agent-1");
        expect(list.status).toBe(200);
        expect(list.body).toHaveLength(1);

        const retrieve = await request(app)
            .post("/memory/retrieve")
            .send({
                taskId: "task-1",
                agentId: "agent-1",
                prompt: "Need concise and actionable answers.",
                interactionMode: "chat",
            });

        expect(retrieve.status).toBe(200);
        expect(retrieve.body.entries).toHaveLength(1);

        const pinned = await request(app).post(`/memory/${created.body.id}/pin`);
        expect(pinned.status).toBe(200);
        expect(pinned.body.isPinned).toBe(true);
    });
});
