import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { Task } from "@andromeda/core";
import { TaskController } from "../../../../src/presentation/controllers/TaskController";
import { InMemoryTaskRepository } from "../../../../src/infrastructure/repositories/InMemoryTaskRepository";

describe("task asset routes", () => {
    it("returns applied agent assets for a task", async () => {
        const repository = new InMemoryTaskRepository();
        const task = new Task({
            id: "task-1",
            rawRequest: "plan this work",
            metadata: {
                appliedAgentAssets: {
                    agents: [{ name: "project-planner" }],
                    rules: [{ name: "GEMINI" }],
                },
            },
        });
        await repository.save(task);

        const controller = new TaskController(repository);
        const app = express();
        app.get("/tasks/:id/assets", (req, res) => controller.getAssets(req as any, res));

        const response = await request(app).get("/tasks/task-1/assets");

        expect(response.status).toBe(200);
        expect(response.body.taskId).toBe("task-1");
        expect(response.body.appliedAgentAssets.agents[0].name).toBe("project-planner");
    });

    it("returns a lightweight applied asset summary on task detail responses", async () => {
        const repository = new InMemoryTaskRepository();
        const task = new Task({
            id: "task-2",
            rawRequest: "debug this issue",
            metadata: {
                appliedAgentAssets: {
                    agents: [{ name: "backend-specialist" }],
                    rules: [{ name: "GEMINI" }],
                    workflows: [{ name: "debug" }],
                    skills: [{ name: "clean-code" }, { name: "api-patterns" }],
                    strategyUsed: "llm-agent-strategy-v1",
                    resolvedAgent: { name: "backend-specialist" },
                },
            },
        });
        await repository.save(task);

        const controller = new TaskController(repository);
        const app = express();
        app.get("/tasks/:id", (req, res) => controller.getById(req as any, res));

        const response = await request(app).get("/tasks/task-2");

        expect(response.status).toBe(200);
        expect(response.body.appliedAgentAssetsSummary).toEqual({
            agents: 1,
            rules: 1,
            workflows: 1,
            skills: 2,
            resolvedAgent: "backend-specialist",
            strategyUsed: "llm-agent-strategy-v1",
        });
    });
});
