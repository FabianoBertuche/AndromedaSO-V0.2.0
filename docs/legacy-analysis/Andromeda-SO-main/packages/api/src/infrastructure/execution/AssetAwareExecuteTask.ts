import { AgentRegistry, ExecuteTask, Task, TaskRepository, globalEventBus } from "@andromeda/core";
import { buildAppliedAgentAssets } from "../agent-assets/TaskAgentAssetTracker";
import { createDefaultExecutionFactory } from "./createDefaultExecuteTaskUseCase";

export class AssetAwareExecuteTask {
    constructor(
        private readonly taskRepository: TaskRepository,
        private readonly agentRegistry: AgentRegistry,
    ) { }

    async execute(taskId: string): Promise<Task> {
        const initialTask = await this.taskRepository.findById(taskId);
        if (!initialTask) {
            throw new Error("Tarefa não encontrada");
        }

        await this.attachAppliedAssets(initialTask);

        const executeTask = new ExecuteTask(
            this.taskRepository,
            createDefaultExecutionFactory(this.agentRegistry),
            globalEventBus,
        );
        const executedTask = await executeTask.execute(taskId);
        const strategyUsed = executedTask.getMetadata().execution?.strategyUsed;

        await this.attachAppliedAssets(executedTask, strategyUsed);

        return (await this.taskRepository.findById(taskId)) || executedTask;
    }

    private async attachAppliedAssets(task: Task, strategyUsed?: string): Promise<void> {
        const result = task.getResult();
        if (result?.agent) {
            task.mergeMetadata({
                resolvedAgent: result.agent,
            });
        }

        const appliedAgentAssets = await buildAppliedAgentAssets(task, strategyUsed);
        task.mergeMetadata({ appliedAgentAssets });
        await this.taskRepository.save(task);
    }
}
