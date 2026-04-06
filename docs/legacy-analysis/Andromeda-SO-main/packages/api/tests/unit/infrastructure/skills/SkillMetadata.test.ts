import { describe, expect, it } from "vitest";
import { Skill, SkillType } from "@andromeda/core";
import { buildSkillDiagnostics, isExecutableSkill } from "../../../../src/infrastructure/skills/SkillMetadata";

describe("SkillMetadata", () => {
    it("treats local instructional skills as non-executable", () => {
        const skill = new Skill({
            id: "local-skill:clean-code",
            name: "clean-code",
            description: "Pragmatic coding standards.",
            type: SkillType.TOOL,
            schema: {
                source: "local-agent-skill",
                executionMode: "instructional",
            },
        });

        expect(isExecutableSkill(skill)).toBe(false);
    });

    it("treats manually registered script skills with code as executable", () => {
        const skill = new Skill({
            id: "skill-echo",
            name: "Echo",
            description: "Echoes input.",
            type: SkillType.SCRIPT,
            code: "result = input;",
            schema: {
                source: "manual-api",
                executionMode: "executable",
            },
        });

        expect(isExecutableSkill(skill)).toBe(true);
    });

    it("builds diagnostics grouped by executable state", () => {
        const diagnostics = buildSkillDiagnostics([
            new Skill({
                id: "local-skill:brainstorming",
                name: "brainstorming",
                description: "Socratic questioning.",
                type: SkillType.TOOL,
                schema: {
                    source: "local-agent-skill",
                    sourceKind: "skill",
                    executionMode: "instructional",
                    folder: "brainstorming",
                    filePath: ".agent/skills/brainstorming/SKILL.md",
                },
            }),
            new Skill({
                id: "skill-echo",
                name: "Echo",
                description: "Echoes input.",
                type: SkillType.SCRIPT,
                code: "result = input;",
                schema: {
                    source: "manual-api",
                    executionMode: "executable",
                },
            }),
        ]);

        expect(diagnostics.totals).toEqual({
            discovered: 2,
            executable: 1,
            instructional: 1,
        });
        expect(diagnostics.bySource).toEqual([
            { source: "local-agent-skill", count: 1 },
            { source: "manual-api", count: 1 },
        ]);
        expect(diagnostics.executable[0]?.name).toBe("Echo");
        expect(diagnostics.instructional[0]?.name).toBe("brainstorming");
        expect(diagnostics.instructional[0]?.folder).toBe("brainstorming");
    });
});
