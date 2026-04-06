import { TaskRepository, TaskTimelineView, TimelineEntry } from "@andromeda/core";

export class BuildTaskTimeline {
    constructor(private readonly taskRepository: TaskRepository) { }

    async execute(taskId: string): Promise<TaskTimelineView> {
        const task = await this.taskRepository.findById(taskId);
        if (!task) throw new Error("Tarefa não encontrada");

        const entries: TimelineEntry[] = [];

        // In the future, we could have a specific TaskEventRepository.
        // For now, we reconstruct from the Task state and metadata.

        entries.push({
            type: "task.created",
            timestamp: task.getCreatedAt().toISOString(),
            description: "Tarefa criada e recebida pelo kernel",
            metadata: { status: "received" }
        });

        // Add transitions based on current status (this is a simplified reconstruction)
        const status = task.getStatus();
        const updatedAt = task.getUpdatedAt().toISOString();

        if (status !== "received") {
            entries.push({
                type: "task.updated",
                timestamp: updatedAt,
                description: `Tarefa em estado: ${status}`,
                metadata: { status }
            });
        }

        if (task.getResult()) {
            entries.push({
                type: "task.result",
                timestamp: updatedAt,
                description: status === "completed" ? "Tarefa concluída com sucesso" : "Tarefa falhou",
                metadata: { result: task.getResult() }
            });
        }

        const appliedAgentAssets = task.getMetadata().appliedAgentAssets;
        if (appliedAgentAssets) {
            entries.push({
                type: "task.agent_assets",
                timestamp: updatedAt,
                description: "Assets locais aplicados na execucao",
                metadata: appliedAgentAssets,
            });
        }

        if (task.getAuditParecer()) {
            entries.push({
                type: "audit.completed",
                timestamp: updatedAt,
                description: "Auditoria finalizada",
                metadata: { parecer: task.getAuditParecer() }
            });
        }

        return {
            taskId,
            entries
        };
    }
}
