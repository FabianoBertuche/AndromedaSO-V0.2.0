import { Task, TaskRepository, TaskCreated, globalEventBus } from "@andromeda/core";

export interface CreateTaskInput {
    rawRequest: string;
    metadata?: Record<string, any>;
}

export class CreateTask {
    constructor(private readonly repository: TaskRepository) { }

    async execute(input: CreateTaskInput): Promise<Task> {
        const task = new Task({
            rawRequest: input.rawRequest,
            metadata: input.metadata || {},
        });

        await this.repository.save(task);

        // Emit creation event
        globalEventBus.publish(new TaskCreated(task.getId(), task.getMetadata().sessionId));

        return task;
    }
}
