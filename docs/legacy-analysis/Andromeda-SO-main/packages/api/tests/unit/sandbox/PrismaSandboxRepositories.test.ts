import { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { createSandboxConfig, createSandboxProfile, createDefaultAgentSandboxConfig } from "../../../src/modules/sandbox/domain/types";
import {
    PrismaAgentSandboxConfigRepository,
    PrismaApprovalRequestRepository,
    PrismaSandboxArtifactRepository,
    PrismaSandboxExecutionRepository,
    PrismaSandboxProfileRepository,
} from "../../../src/modules/sandbox/infrastructure/PrismaSandboxRepositories";

function createPrismaMock() {
    return {
        sandboxProfile: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
            deleteMany: vi.fn(),
        },
        agentSandboxConfig: {
            findUnique: vi.fn(),
            findMany: vi.fn(),
            upsert: vi.fn(),
        },
        sandboxExecution: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
        },
        sandboxArtifact: {
            findMany: vi.fn(),
            deleteMany: vi.fn(),
            createMany: vi.fn(),
        },
        approvalRequest: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            upsert: vi.fn(),
            deleteMany: vi.fn(),
        },
    } as unknown as PrismaClient;
}

describe("Prisma sandbox repositories", () => {
    it("persists and reads sandbox profiles through Prisma-shaped records", async () => {
        const prisma = createPrismaMock();
        const repository = new PrismaSandboxProfileRepository(prisma);
        const profile = createSandboxProfile(
            "sbx_test",
            "Test",
            "Test profile",
            "process",
            "moderate",
            createSandboxConfig("process"),
            "2026-03-18T12:00:00.000Z",
        );

        await repository.save(profile);

        expect(prisma.sandboxProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({
            where: { id: "sbx_test" },
            create: expect.objectContaining({
                id: "sbx_test",
                name: "Test",
                config: profile.config,
            }),
        }));

        (prisma.sandboxProfile.findUnique as any).mockResolvedValue({
            ...profile,
            createdAt: new Date(profile.createdAt),
            updatedAt: new Date(profile.updatedAt),
        });

        const loaded = await repository.getById("sbx_test");
        expect(loaded?.id).toBe("sbx_test");
        expect(loaded?.createdAt).toBe(profile.createdAt);
    });

    it("creates default agent sandbox configs when none exist", async () => {
        const prisma = createPrismaMock();
        const repository = new PrismaAgentSandboxConfigRepository(prisma);

        (prisma.agentSandboxConfig.findUnique as any).mockResolvedValue(null);

        const config = await repository.getByAgentId("agent-1");

        expect(config.agentId).toBe("agent-1");
        expect(config.profileId).toBe("sbx_code_runner");
        expect(prisma.agentSandboxConfig.upsert).toHaveBeenCalledTimes(1);
    });

    it("maps execution artifacts and approvals using prisma data shapes", async () => {
        const prisma = createPrismaMock();

        const executionRepository = new PrismaSandboxExecutionRepository(prisma);
        const artifactRepository = new PrismaSandboxArtifactRepository(prisma);
        const approvalRepository = new PrismaApprovalRequestRepository(prisma);

        (prisma.sandboxExecution.findMany as any).mockResolvedValue([
            {
                id: "exec-1",
                agentId: "agent-1",
                taskId: null,
                skillId: null,
                capability: "skill",
                status: "completed",
                mode: "process",
                command: ["node", "-e", "console.log(1)"],
                policySnapshot: createSandboxConfig("process"),
                startedAt: new Date("2026-03-18T12:00:00.000Z"),
                finishedAt: new Date("2026-03-18T12:00:01.000Z"),
                durationMs: 1000,
                exitCode: 0,
                resourceUsage: null,
                errorMessage: null,
                stdout: "ok",
                stderr: "",
            },
        ]);
        const executions = await executionRepository.list();
        expect(executions[0].stdout).toBe("ok");

        await artifactRepository.saveByExecutionId("exec-1", [
            {
                id: "artifact-1",
                executionId: "exec-1",
                name: "execution.log",
                path: "/artifacts/exec-1/execution.log",
                sizeBytes: 10,
                sha256: "abc",
                mimeType: "text/plain",
                retainedUntil: null,
                metadata: { source: "stdout" },
            },
        ]);
        expect(prisma.sandboxArtifact.createMany).toHaveBeenCalledTimes(1);

        (prisma.approvalRequest.findUnique as any).mockResolvedValue({
            id: "approval-1",
            agentId: "agent-1",
            taskId: null,
            executionId: "exec-1",
            reason: "Review required",
            requestedAction: { capability: "skill" },
            status: "pending",
            approvedBy: null,
            approvedAt: null,
            rejectedAt: null,
        });
        const approval = await approvalRepository.getById("approval-1");
        expect(approval?.executionId).toBe("exec-1");
    });
});
