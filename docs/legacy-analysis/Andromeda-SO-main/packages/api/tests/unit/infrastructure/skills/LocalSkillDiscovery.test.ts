import { mkdtempSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { discoverLocalSkills } from "../../../../src/infrastructure/skills/LocalSkillDiscovery";
import { InMemorySkillRegistry } from "../../../../src/infrastructure/skills/InMemorySkillRegistry";
import { Skill, SkillType } from "@andromeda/core";

describe("LocalSkillDiscovery", () => {
    let tempDir = "";

    beforeEach(() => {
        tempDir = mkdtempSync(path.join(os.tmpdir(), "andromeda-local-skills-"));
    });

    afterEach(() => {
        if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("discovers workspace skills from nested SKILL.md files", async () => {
        createSkill(tempDir, ["clean-code"], `---
name: clean-code
description: Pragmatic coding standards.
---

# Clean Code
`);
        createSkill(tempDir, ["game-development", "2d-games"], `---
name: 2d-games
description: Build 2D games.
---

# 2D Games
`);

        const skills = await discoverLocalSkills(tempDir);

        expect(skills.map((skill) => skill.getId()).sort()).toEqual([
            "local-skill:clean-code",
            "local-skill:game-development/2d-games",
        ]);
        expect(skills.map((skill) => skill.getName()).sort()).toEqual([
            "2d-games",
            "clean-code",
        ]);
    });

    it("bootstraps discovered skills into the registry while preserving manual registrations", async () => {
        createSkill(tempDir, ["brainstorming"], `---
name: brainstorming
description: Socratic questioning.
---

# Brainstorming
`);

        const registry = new InMemorySkillRegistry(() => discoverLocalSkills(tempDir));
        await registry.register(new Skill({
            id: "skill-echo",
            name: "Echo",
            description: "Echoes input.",
            type: SkillType.SCRIPT,
            code: "result = input;",
        }));

        const skills = await registry.listAll();
        const matched = await registry.searchByCapability("please use echo skill");

        expect(skills.map((skill) => skill.getName()).sort()).toEqual([
            "Echo",
            "brainstorming",
        ]);
        expect(matched.map((skill) => skill.getName())).toEqual(["Echo"]);
    });
});

function createSkill(baseDir: string, segments: string[], content: string): void {
    const skillDir = path.join(baseDir, ...segments);
    mkdirSync(skillDir, { recursive: true });
    writeFileSync(path.join(skillDir, "SKILL.md"), content, "utf8");
}
