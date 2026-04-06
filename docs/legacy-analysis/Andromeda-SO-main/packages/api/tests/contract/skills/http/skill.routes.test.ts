import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { Skill, SkillType } from "@andromeda/core";
import { SkillController } from "../../../../src/presentation/controllers/SkillController";
import { InMemorySkillRegistry } from "../../../../src/infrastructure/skills/InMemorySkillRegistry";

describe("skill routes", () => {
    it("returns diagnostics and blocks execution of instructional skills", async () => {
        const registry = new InMemorySkillRegistry();
        await registry.register(new Skill({
            id: "local-skill:clean-code",
            name: "clean-code",
            description: "Pragmatic coding standards.",
            type: SkillType.TOOL,
            schema: {
                source: "local-agent-skill",
                executionMode: "instructional",
                filePath: ".agent/skills/clean-code/SKILL.md",
            },
        }));
        await registry.register(new Skill({
            id: "skill-echo",
            name: "Echo",
            description: "Echoes input.",
            type: SkillType.SCRIPT,
            code: "result = input;",
            schema: {
                source: "manual-api",
                executionMode: "executable",
            },
        }));

        const app = express();
        const executor = {
            execute: vi.fn().mockResolvedValue({ ok: true }),
        } as any;
        const controller = new SkillController(registry, executor);

        app.use(express.json());
        app.get("/skills/diagnostics", (req, res) => controller.diagnostics(req, res));
        app.post("/skills/:id/execute", (req, res) => controller.execute(req, res));

        const diagnosticsResponse = await request(app).get("/skills/diagnostics");
        expect(diagnosticsResponse.status).toBe(200);
        expect(diagnosticsResponse.body.totals).toEqual({
            discovered: 2,
            executable: 1,
            instructional: 1,
        });
        expect(diagnosticsResponse.body.workspace.totals.skills).toBeGreaterThan(0);
        expect(Array.isArray(diagnosticsResponse.body.workspace.rules)).toBe(true);
        expect(Array.isArray(diagnosticsResponse.body.workspace.workflows)).toBe(true);

        const executeInstructionalResponse = await request(app)
            .post("/skills/local-skill:clean-code/execute")
            .send({ input: {} });
        expect(executeInstructionalResponse.status).toBe(409);
        expect(executeInstructionalResponse.body.error).toBe("Skill instrucional não pode ser executada");
        expect(executor.execute).not.toHaveBeenCalled();

        const executeScriptResponse = await request(app)
            .post("/skills/skill-echo/execute")
            .send({ input: { message: "hello" } });
        expect(executeScriptResponse.status).toBe(200);
        expect(executor.execute).toHaveBeenCalledTimes(1);
    });
});
