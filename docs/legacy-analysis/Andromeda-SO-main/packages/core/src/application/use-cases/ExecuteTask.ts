import { TaskRepository } from "../../domain/task/TaskRepository";
import { ExecutionStrategyFactory } from "../../domain/execution/ExecutionStrategyFactory";
import { TaskStatus } from "../../domain/task/TaskState";
import { Task } from "../../domain/task/Task";
import { DomainEventBus } from "../../infrastructure/events/DomainEventBus";
import { TaskStatusChanged, TaskResultAvailable } from "../../domain/task/TaskEvent";

export class ExecuteTask {
    constructor(
        private readonly repository: TaskRepository,
        private readonly factory: ExecutionStrategyFactory,
        private readonly eventBus: DomainEventBus
    ) { }

    async execute(taskId: string): Promise<Task> {
        const task = await this.repository.findById(taskId);
        if (!task) throw new Error("Tarefa não encontrada");

        try {
            const oldStatus1 = task.getStatus();
            task.transitionTo(TaskStatus.STRUCTURING);
            await this.repository.save(task);
            this.eventBus.publish(new TaskStatusChanged(task.getId(), oldStatus1, task.getStatus()));

            const oldStatus2 = task.getStatus();
            task.transitionTo(TaskStatus.RESOLVING);
            await this.repository.save(task);
            this.eventBus.publish(new TaskStatusChanged(task.getId(), oldStatus2, task.getStatus()));

            const oldStatus3 = task.getStatus();
            task.transitionTo(TaskStatus.EXECUTING);
            await this.repository.save(task);
            this.eventBus.publish(new TaskStatusChanged(task.getId(), oldStatus3, task.getStatus()));

            const strategy = await this.factory.getStrategy(task);
            const result = await strategy.execute(task);
            task.mergeMetadata({
                execution: {
                    strategyUsed: result.strategyUsed,
                    success: result.success,
                },
            });

            const oldStatus4 = task.getStatus();
            if (result.success) {
                task.setResult(result.data);
                if (result.data?.audit) {
                    task.setAuditParecer(result.data.audit);
                }
                this.eventBus.publish(new TaskResultAvailable(task.getId(), result.data));
                task.transitionTo(TaskStatus.AUDITING);
                await this.repository.save(task);
                this.eventBus.publish(new TaskStatusChanged(task.getId(), oldStatus4, task.getStatus()));

                const oldStatus5 = task.getStatus();
                task.transitionTo(TaskStatus.COMPLETED);
                await this.repository.save(task);
                this.eventBus.publish(new TaskStatusChanged(task.getId(), oldStatus5, task.getStatus()));
                return task;
            } else {
                task.transitionTo(TaskStatus.FAILED);
                task.setResult({ error: result.error });
                this.eventBus.publish(new TaskResultAvailable(task.getId(), { error: result.error }));
            }

            await this.repository.save(task);
            this.eventBus.publish(new TaskStatusChanged(task.getId(), oldStatus4, task.getStatus()));
            return task;
        } catch (error: any) {
            task.mergeMetadata({
                execution: {
                    strategyUsed: task.getMetadata().execution?.strategyUsed,
                    success: false,
                },
            });
            task.transitionTo(TaskStatus.FAILED);
            task.setResult({ error: error.message });
            await this.repository.save(task);
            throw error;
        }
    }
}
