import {
    AuditParecerAvailable,
    TaskCreated,
    TaskRepository,
    TaskResultAvailable,
    TaskStatusChanged,
} from "@andromeda/core";

export interface GatewayEventEnvelope {
    type: string;
    taskId?: string;
    sessionId?: string;
    status?: string;
    result?: unknown;
    parecer?: unknown;
    timestamp: string;
    name?: string;
    payload?: unknown;
}

export async function resolveGatewayEventEnvelope(
    event: unknown,
    taskRepository: TaskRepository
): Promise<GatewayEventEnvelope | null> {
    const timestamp = new Date().toISOString();

    if (event instanceof TaskCreated) {
        return {
            type: "task.created",
            taskId: event.taskId,
            sessionId: event.sessionId,
            timestamp,
        };
    }

    if (event instanceof TaskStatusChanged) {
        const sessionId = await findTaskSessionId(taskRepository, event.taskId);
        if (!sessionId) {
            return null;
        }

        return {
            type: "task.updated",
            taskId: event.taskId,
            status: event.newStatus,
            sessionId,
            timestamp,
        };
    }

    if (event instanceof TaskResultAvailable) {
        const sessionId = await findTaskSessionId(taskRepository, event.taskId);
        if (!sessionId) {
            return null;
        }

        return {
            type: "task.completed",
            taskId: event.taskId,
            result: event.result,
            sessionId,
            timestamp,
        };
    }

    if (event instanceof AuditParecerAvailable) {
        const sessionId = await findTaskSessionId(taskRepository, event.taskId);
        if (!sessionId) {
            return null;
        }

        return {
            type: "audit.completed",
            taskId: event.taskId,
            parecer: event.parecer,
            sessionId,
            timestamp,
        };
    }

    return {
        type: "domain.event",
        name: event instanceof Error ? event.name : (event as any)?.constructor?.name || "UnknownEvent",
        payload: event,
        timestamp,
    };
}

async function findTaskSessionId(taskRepository: TaskRepository, taskId: string): Promise<string | undefined> {
    const task = await taskRepository.findById(taskId);
    if (!task) {
        return undefined;
    }

    const metadata = task.getMetadata();
    return metadata.sessionId || task.getSessionId();
}
