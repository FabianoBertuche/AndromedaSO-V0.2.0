import { Task } from "@andromeda/core";
import { ITaskExecutionPort } from "../domain/ports";
import { globalTaskRepository } from "../../../infrastructure/repositories/GlobalRepositories";
import { globalAgentRegistry } from "../../agent-management/dependencies";
import { AssetAwareExecuteTask } from "../../../infrastructure/execution/AssetAwareExecuteTask";
import { HandoffPayload } from "../domain/handoff-payload";

export class TaskExecutionPortAdapter implements ITaskExecutionPort {
    async execute(input: { tenantId: string; taskId: string; agentId: string; payload: HandoffPayload }): Promise<Record<string, unknown>> {
        const task = await globalTaskRepository.findById(input.taskId);
        if (!task) {
            const newTask = new Task({
                id: input.taskId,
                rawRequest: input.payload.taskContext.currentObjective,
                metadata: {
                    targetAgentId: input.agentId,
                    tenantId: input.tenantId,
                    handoffPayload: input.payload,
                },
            });
            await globalTaskRepository.save(newTask);

            const executor = new AssetAwareExecuteTask(globalTaskRepository, globalAgentRegistry);
            const executed = await executor.execute(newTask.getId());
            return executed.getResult() || {};
        }

        const executor = new AssetAwareExecuteTask(globalTaskRepository, globalAgentRegistry);
        const executed = await executor.execute(task.getId());
        return executed.getResult() || {};
    }
}
