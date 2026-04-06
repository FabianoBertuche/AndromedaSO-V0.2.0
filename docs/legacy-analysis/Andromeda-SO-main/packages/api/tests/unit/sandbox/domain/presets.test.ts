import { describe, expect, it } from "vitest";
import { createSystemSandboxProfiles } from "../../../../src/modules/sandbox/domain/presets";

describe("sandbox presets", () => {
    it("exposes the official reusable profiles", () => {
        const profiles = createSystemSandboxProfiles();

        expect(profiles).toHaveLength(5);
        expect(profiles.map((profile) => profile.id)).toEqual([
            "sbx_safe_readonly",
            "sbx_research",
            "sbx_code_runner",
            "sbx_automation_restricted",
            "sbx_operator_elevated",
        ]);
        expect(profiles.every((profile) => profile.isSystem)).toBe(true);
        expect(profiles.find((profile) => profile.id === "sbx_safe_readonly")?.config.filesystem.allowedWritePaths).toEqual([]);
        expect(profiles.find((profile) => profile.id === "sbx_research")?.config.network.mode).toBe("off");
        expect(profiles.find((profile) => profile.id === "sbx_operator_elevated")?.mode).toBe("container");
    });
});
