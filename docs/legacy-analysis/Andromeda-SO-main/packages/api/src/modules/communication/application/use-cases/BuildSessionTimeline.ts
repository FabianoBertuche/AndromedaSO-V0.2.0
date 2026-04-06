import { CommunicationMessageRepository } from "../../domain/repositories/communication-message.repository";
import { TaskRepository } from "@andromeda/core";
import { SessionTimelineView, TimelineEntry } from "../dto/timeline.view.dto";

export class BuildSessionTimeline {
    constructor(
        private readonly messageRepository: CommunicationMessageRepository,
        private readonly taskRepository: TaskRepository
    ) { }

    async execute(sessionId: string): Promise<SessionTimelineView> {
        const messages = await this.messageRepository.findBySessionId(sessionId);
        const tasks = await this.taskRepository.findBySessionId(sessionId);

        const entries: TimelineEntry[] = [];

        // Mensagens do Chat
        for (const msg of messages) {
            entries.push({
                type: "message",
                timestamp: msg.metadata.timestamp || new Date().toISOString(),
                summary: msg.role === 'user' ? `Mensagem do usuário: "${msg.content.text?.substring(0, 40)}..."` : `Resposta do assistente`,
                details: {
                    messageId: msg.id,
                    channel: msg.channel,
                    model: msg.metadata.modelId,
                    content: msg.content.text
                }
            });
        }

        // Fluxo de Tarefas e Kernel
        for (const task of tasks) {
            const meta = task.getMetadata();

            entries.push({
                type: "task_created",
                timestamp: task.getCreatedAt().toISOString(),
                summary: `Tarefa iniciada via ${meta.sourceChannel || 'sistema'}`,
                details: {
                    taskId: task.getId(),
                    status: task.getStatus(),
                    input: task.getRawRequest(),
                    modelId: meta.modelId,
                    agentId: meta.targetAgentId || task.getResult()?.agent?.id,
                    profileVersion: task.getResult()?.agent?.version,
                }
            });

            if (task.getStatus() === "completed" || task.getStatus() === "failed") {
                const result = task.getResult();
                entries.push({
                    type: "task_result",
                    timestamp: task.getUpdatedAt().toISOString(),
                    summary: task.getStatus() === "completed"
                        ? `Tarefa concluída com sucesso (Modelo: ${result?.model || 'Desconhecido'})`
                        : `Tarefa falhou: ${result?.error || 'Erro desconhecido'}`,
                    details: {
                        taskId: task.getId(),
                        status: task.getStatus(),
                        result,
                        audit: task.getAuditParecer(),
                        executionTime: task.getUpdatedAt().getTime() - task.getCreatedAt().getTime()
                    }
                });
            }
        }

        // Ordenar por timestamp
        entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return {
            sessionId,
            entries
        };
    }
}
