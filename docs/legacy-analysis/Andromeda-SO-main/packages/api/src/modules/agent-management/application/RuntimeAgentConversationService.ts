import { CreateTask, TaskRepository } from "@andromeda/core";
import { v4 as uuidv4 } from "uuid";
import { createDefaultExecuteTaskUseCase } from "../../../infrastructure/execution/createDefaultExecuteTaskUseCase";
import { FileBackedAgentRegistry } from "../infrastructure/FileBackedAgentRegistry";
import { MemoryService } from "../../memory/application/MemoryService";
import { memoryService } from "../../memory/dependencies";

export interface AgentConversationInput {
    agentId: string;
    prompt: string;
    sessionId?: string;
    modelId?: string;
    interactionMode?: string;
}

export class RuntimeAgentConversationService {
    constructor(
        private readonly taskRepository: TaskRepository,
        private readonly agentRegistry: FileBackedAgentRegistry,
        private readonly memoryLayer: MemoryService = memoryService,
    ) { }

    async chat(input: AgentConversationInput) {
        const sessionId = input.sessionId || `agent-session-${uuidv4()}`;

        // MAX_ITERATIONS_POLICY: Parar task após 50 iterações (interações) na mesma sessão
        const sessionHistory = await this.memoryLayer.listMemory({ sessionId });
        if (sessionHistory && sessionHistory.length >= 50) {
            console.warn(`[RuntimeAgentConversationService] Sesion ${sessionId} hit MAX_ITERATIONS_POLICY`);
            return {
                taskId: `blocked-${uuidv4()}`,
                status: "failed",
                sessionId,
                result: { error: "MAX_ITERATIONS_EXCEEDED", content: "Agent stopped due to loop protection (>= 50 iterations)." },
                audit: { status: "blocked", actionTaken: "MAX_ITERATIONS_POLICY" },
            };
        }

        const createTask = new CreateTask(this.taskRepository);
        const executeTask = createDefaultExecuteTaskUseCase(this.taskRepository, this.agentRegistry);

        const task = await createTask.execute({
            rawRequest: input.prompt,
            metadata: {
                sessionId,
                targetAgentId: input.agentId,
                interactionMode: input.interactionMode || "chat",
                modelId: input.modelId,
            },
        });

        await this.memoryLayer.registerSessionMessageMemory({
            sessionId,
            agentId: input.agentId,
            taskId: task.getId(),
            title: `Console request for ${input.agentId}`,
            content: input.prompt.slice(0, 1200),
            tags: ["console", input.interactionMode || "chat"],
            sourceEventId: task.getId(),
            metadata: {
                modelId: input.modelId,
                interactionMode: input.interactionMode || "chat",
            },
        }).catch((error) => {
            console.warn("[memory.session.record.failed]", {
                sessionId,
                taskId: task.getId(),
                error: error instanceof Error ? error.message : "unknown_error",
            });
        });

        const executed = await executeTask.execute(task.getId());

        return {
            taskId: executed.getId(),
            status: executed.getStatus(),
            sessionId,
            result: executed.getResult(),
            audit: executed.getAuditParecer() || executed.getResult()?.audit,
        };
    }
}
