import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { discoverLocalAgentAssets } from "../../../../src/infrastructure/agent-assets/LocalAgentAssetDiscovery";

describe("LocalAgentAssetDiscovery", () => {
    let tempDir = "";

    beforeEach(() => {
        tempDir = mkdtempSync(path.join(os.tmpdir(), "andromeda-agent-assets-"));
    });

    afterEach(() => {
        if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    });

    it("discovers local skills, rules, workflows and warnings", async () => {
        writeAsset(tempDir, ["skills", "clean-code", "SKILL.md"], `---
name: clean-code
description: Pragmatic coding standards.
---
`);
        writeAsset(tempDir, ["rules", "GEMINI.md"], `---
trigger: always_on
---
`);
        writeAsset(tempDir, ["workflows", "plan.md"], `---
description: Plan work.
---
`);
        writeAsset(tempDir, ["agents", "backend-specialist.md"], `---
name: backend-specialist
description: Backend specialist.
skills: clean-code, api-patterns
---
`);

        const assets = await discoverLocalAgentAssets(tempDir);

        expect(assets.totals).toEqual({ skills: 1, rules: 1, workflows: 1, agents: 1 });
        expect(assets.skills[0]?.name).toBe("clean-code");
        expect(assets.rules[0]?.name).toBe("GEMINI");
        expect(assets.workflows[0]?.name).toBe("plan");
        expect(assets.agents[0]?.name).toBe("backend-specialist");
        expect(assets.agents[0]?.skills).toEqual(["clean-code", "api-patterns"]);
        expect(assets.warnings).toEqual([]);
    });
});

function writeAsset(baseDir: string, segments: string[], content: string): void {
    const filePath = path.join(baseDir, ...segments);
    mkdirSync(path.dirname(filePath), { recursive: true });
    writeFileSync(filePath, content, "utf8");
}
