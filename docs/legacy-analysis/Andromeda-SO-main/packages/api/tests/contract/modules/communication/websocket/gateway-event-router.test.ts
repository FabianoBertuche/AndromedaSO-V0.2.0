import { Task, TaskCreated, TaskResultAvailable, TaskStatusChanged } from "@andromeda/core";
import { describe, expect, it } from "vitest";
import { InMemoryTaskRepository } from "../../../../../src/infrastructure/repositories/InMemoryTaskRepository";
import { resolveGatewayEventEnvelope } from "../../../../../src/modules/communication/interfaces/websocket/gateway-event-router";

describe("resolveGatewayEventEnvelope", () => {
    it("keeps the sessionId already present in TaskCreated events", async () => {
        const repository = new InMemoryTaskRepository();

        const envelope = await resolveGatewayEventEnvelope(
            new TaskCreated("task-1", "session-1"),
            repository
        );

        expect(envelope?.sessionId).toBe("session-1");
        expect(envelope?.type).toBe("task.created");
    });

    it("hydrates sessionId for task status changes from the repository", async () => {
        const repository = new InMemoryTaskRepository();
        await repository.save(new Task({
            id: "task-2",
            rawRequest: "ping",
            metadata: {
                sessionId: "session-2",
            },
        }));

        const envelope = await resolveGatewayEventEnvelope(
            new TaskStatusChanged("task-2", "received", "executing"),
            repository
        );

        expect(envelope?.sessionId).toBe("session-2");
        expect(envelope?.type).toBe("task.updated");
    });

    it("hydrates sessionId for task results from the repository", async () => {
        const repository = new InMemoryTaskRepository();
        await repository.save(new Task({
            id: "task-3",
            rawRequest: "ping",
            metadata: {
                sessionId: "session-3",
            },
        }));

        const envelope = await resolveGatewayEventEnvelope(
            new TaskResultAvailable("task-3", { content: "pong" }),
            repository
        );

        expect(envelope?.sessionId).toBe("session-3");
        expect(envelope?.type).toBe("task.completed");
    });
});
