import express from "express";
import request from "supertest";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AgentProfileService } from "../../../../../src/modules/agent-management/application/AgentProfileService";
import { AgentVersioningService } from "../../../../../src/modules/agent-management/application/AgentVersioningService";
import { createDefaultAgentProfile } from "../../../../../src/modules/agent-management/domain/agent-profile";
import { FileSystemAgentProfileRepository } from "../../../../../src/modules/agent-management/infrastructure/FileSystemAgentProfileRepository";
import { createAgentManagementRouter } from "../../../../../src/modules/agent-management/interfaces/http/agent-management.routes";

describe("agent-management routes", () => {
    vi.setConfig({ testTimeout: 15000 });
    let tempDir = "";

    beforeEach(async () => {
        tempDir = await mkdtemp(path.join(os.tmpdir(), "andromeda-agent-routes-"));
    });

    afterEach(async () => {
        if (tempDir) {
            await rm(tempDir, { recursive: true, force: true });
        }
    });

    it("lists agents and persists behavior updates through the REST API", async () => {
        const repository = new FileSystemAgentProfileRepository(tempDir);
        const versioningService = new AgentVersioningService(new InMemoryVersionRepository());
        const profile = createDefaultAgentProfile({
            id: "agent-kernel",
            name: "Kernel",
            role: "Operational orchestrator",
            description: "Coordinates work across the system.",
            teamId: "team-core",
            category: "orchestration",
            type: "orchestrator",
            specializations: ["planning", "coordination"],
        });

        await repository.save(profile, { summary: "seed" });

        const profileService = new AgentProfileService(repository, undefined, versioningService);
        const app = express();
        app.use(express.json());
        app.use("/agents", createAgentManagementRouter({
            profileService,
            conversationService: {
                chat: vi.fn(),
            },
        }));

        const listResponse = await request(app).get("/agents");
        expect(listResponse.status).toBe(200);
        expect(listResponse.body).toHaveLength(1);
        expect(listResponse.body[0].id).toBe("agent-kernel");
        expect(listResponse.body[0].role).toBe("Operational orchestrator");

        const updateResponse = await request(app)
            .put("/agents/agent-kernel/behavior")
            .send({
                formality: 93,
                warmth: 40,
            });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.formality).toBe(93);

        const behaviorResponse = await request(app).get("/agents/agent-kernel/behavior");
        expect(behaviorResponse.status).toBe(200);
        expect(behaviorResponse.body.formality).toBe(93);

        const historyResponse = await request(app).get("/agents/agent-kernel/profile/history");
        expect(historyResponse.status).toBe(200);
        expect(historyResponse.body.length).toBeGreaterThanOrEqual(1);

        const versionsResponse = await request(app).get("/agents/agent-kernel/versions");
        expect(versionsResponse.status).toBe(200);
        expect(Array.isArray(versionsResponse.body.items)).toBe(true);
        expect(versionsResponse.body.items.length).toBeGreaterThanOrEqual(1);
    });
});

class InMemoryVersionRepository {
    private readonly items: any[] = [];

    async list(agentId: string, tenantId = "default") {
        return this.items
            .filter((item) => item.agentId === agentId && item.tenantId === tenantId)
            .sort((left, right) => right.versionNumber - left.versionNumber);
    }

    async get(agentId: string, versionNumber: number, tenantId = "default") {
        return this.items.find((item) => item.agentId === agentId && item.tenantId === tenantId && item.versionNumber === versionNumber) || null;
    }

    async create(input: any) {
        const next = {
            versionNumber: this.items.filter((item) => item.agentId === input.agentId && item.tenantId === input.tenantId).length + 1,
            sourceVersionLabel: input.sourceVersionLabel,
            changeSummary: input.changeSummary,
            restoredFromVersionNumber: input.restoredFromVersionNumber,
            createdBy: input.createdBy,
            createdAt: new Date().toISOString(),
            snapshot: input.snapshot,
            agentId: input.agentId,
            tenantId: input.tenantId,
        };
        this.items.push(next);
        return next;
    }
}
