import { TaskRepository } from "@andromeda/core";

export class GetGatewayTaskStatus {
    constructor(private readonly taskRepository: TaskRepository) { }

    async execute(taskId: string) {
        const task = await this.taskRepository.findById(taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }

        return {
            taskId: task.getId(),
            status: task.getStatus(),
            updatedAt: task.getUpdatedAt(),
            result: task.getResult(),
            auditParecer: task.getAuditParecer(),
            appliedAgentAssets: task.getMetadata().appliedAgentAssets,
        };
    }
}
