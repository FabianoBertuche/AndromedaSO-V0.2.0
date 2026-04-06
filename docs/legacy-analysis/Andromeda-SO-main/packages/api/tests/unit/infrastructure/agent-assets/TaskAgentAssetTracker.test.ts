import { describe, expect, it } from "vitest";
import { Task } from "@andromeda/core";
import { buildAppliedAgentAssetsFromDiagnostics } from "../../../../src/infrastructure/agent-assets/TaskAgentAssetTracker";

describe("TaskAgentAssetTracker", () => {
    it("records matching rules, workflows and skills for a task", () => {
        const task = new Task({
            rawRequest: "/plan improve clean-code usage",
            metadata: {
                targetAgentId: "project-planner",
                skillName: "clean-code",
                resolvedAgent: {
                    id: "project-planner",
                    name: "project-planner",
                    role: "planner",
                    version: "1.0.0",
                },
            },
        });

        const applied = buildAppliedAgentAssetsFromDiagnostics(task, {
            rootDir: ".agent",
            directories: {
                skills: ".agent/skills",
                rules: ".agent/rules",
                workflows: ".agent/workflows",
                agents: ".agent/agents",
            },
            totals: {
                skills: 1,
                rules: 1,
                workflows: 1,
                agents: 1,
            },
            skills: [{
                id: "skill:clean-code",
                name: "clean-code",
                description: "Pragmatic coding standards.",
                filePath: ".agent/skills/clean-code/SKILL.md",
                relativePath: "clean-code/SKILL.md",
                category: "skill",
            }],
            rules: [{
                id: "rule:GEMINI",
                name: "GEMINI",
                description: "Always-on workspace rule.",
                filePath: ".agent/rules/GEMINI.md",
                relativePath: "GEMINI.md",
                category: "rule",
            }],
            workflows: [{
                id: "workflow:plan",
                name: "plan",
                description: "Planning workflow.",
                filePath: ".agent/workflows/plan.md",
                relativePath: "plan.md",
                category: "workflow",
            }],
            agents: [{
                id: "agent:project-planner",
                name: "project-planner",
                description: "Planning agent.",
                filePath: ".agent/agents/project-planner.md",
                relativePath: "project-planner.md",
                category: "agent",
                skills: ["clean-code", "plan-writing"],
            }],
            warnings: [],
        }, "skill-strategy-v0");

        expect(applied.agents.map((item) => item.name)).toEqual(["project-planner"]);
        expect(applied.rules).toHaveLength(1);
        expect(applied.workflows.map((item) => item.name)).toEqual(["plan"]);
        expect(applied.skills.map((item) => item.name)).toEqual(["clean-code"]);
        expect(applied.resolvedAgent?.matchedLocalAgent?.name).toBe("project-planner");
        expect(applied.strategyUsed).toBe("skill-strategy-v0");
    });
});
