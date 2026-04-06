import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDefaultAgentProfile } from "../../../../../src/modules/agent-management/domain/agent-profile";
import { FileSystemAgentProfileRepository } from "../../../../../src/modules/agent-management/infrastructure/FileSystemAgentProfileRepository";

describe("FileSystemAgentProfileRepository", () => {
    let tempDir = "";

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), "andromeda-agent-profiles-"));
    });

    afterEach(async () => {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it("persists agent markdown files and restores previous versions from history", async () => {
        const repository = new FileSystemAgentProfileRepository(tempDir);
        const profile = createDefaultAgentProfile({
            id: "agent-auditor",
            name: "Auditor",
            role: "Security auditor",
            description: "Validates risky changes and compliance.",
            teamId: "team-trust",
            category: "audit",
            type: "auditor",
            specializations: ["security", "audit", "review"],
        });

        profile.version = "v1.0.0";
        profile.markdown.identity = "# Identity\nInitial identity";

        await repository.save(profile, { summary: "initial import" });

        const updatedProfile = {
            ...profile,
            version: "v1.0.1",
            updatedAt: new Date("2026-03-18T10:00:00.000Z").toISOString(),
            markdown: {
                ...profile.markdown,
                identity: "# Identity\nUpdated identity",
            },
        };

        await repository.save(updatedProfile, { summary: "manual edit" });

        const history = await repository.listHistory(profile.id);
        expect(history.map((entry) => entry.version)).toContain("v1.0.0");

        const restored = await repository.restore(profile.id, "v1.0.0");

        expect(restored.markdown.identity).toContain("Initial identity");
        expect(restored.version).toBe("v1.0.2");

        const current = await repository.getById(profile.id);
        expect(current?.markdown.identity).toContain("Initial identity");
    });
});
