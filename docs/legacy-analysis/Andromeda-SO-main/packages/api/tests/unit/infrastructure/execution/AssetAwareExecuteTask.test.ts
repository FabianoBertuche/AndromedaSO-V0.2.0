import { describe, expect, it } from "vitest";
import { CreateTask, TaskStatus } from "@andromeda/core";
import { AssetAwareExecuteTask } from "../../../../src/infrastructure/execution/AssetAwareExecuteTask";
import { InMemoryTaskRepository } from "../../../../src/infrastructure/repositories/InMemoryTaskRepository";

describe("AssetAwareExecuteTask", () => {
    it("stores applied local assets in task metadata during execution", async () => {
        const repository = new InMemoryTaskRepository();
        const createTask = new CreateTask(repository);
        const task = await createTask.execute({
            rawRequest: "/plan use clean-code skill",
            metadata: {
                skill: true,
                skillName: "clean-code",
            },
        });

        const useCase = new AssetAwareExecuteTask(repository, {} as any);
        const executed = await useCase.execute(task.getId());

        expect(executed.getStatus()).toBe(TaskStatus.FAILED);
        expect(executed.getMetadata().execution?.strategyUsed).toBe("skill-strategy-v0");
        expect(Array.isArray(executed.getMetadata().appliedAgentAssets?.agents)).toBe(true);
        expect(executed.getMetadata().appliedAgentAssets?.rules?.length).toBeGreaterThan(0);
        expect(executed.getMetadata().appliedAgentAssets?.workflows?.some((item: any) => item.name === "plan")).toBe(true);
        expect(Array.isArray(executed.getMetadata().appliedAgentAssets?.skills)).toBe(true);
        expect(executed.getMetadata().appliedAgentAssets?.resolvedAgent).toBeUndefined();
    });
});
