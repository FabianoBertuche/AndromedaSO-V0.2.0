import { describe, expect, it } from "vitest";
import { GatewayResponseMapper } from "../../../../../src/modules/communication/application/mappers/GatewayResponseMapper";

describe("GatewayResponseMapper", () => {
    it("includes appliedAgentAssets in task and meta payloads", () => {
        const response = GatewayResponseMapper.fromTaskResult({
            message: {
                id: "msg-1",
                channel: "web",
                sender: { externalId: "user-1" },
                content: { type: "text", text: "hello" },
                metadata: { requestId: "req-1", correlationId: "corr-1" },
            } as any,
            session: {
                id: "session-1",
            } as any,
            taskResult: {
                taskId: "task-1",
                status: "RECEIVED",
                appliedAgentAssets: {
                    agents: [{ name: "backend-specialist" }],
                    rules: [{ name: "GEMINI" }],
                },
            },
            durationMs: 10,
        });

        expect(response.task?.appliedAgentAssets).toBeDefined();
        expect(response.meta?.appliedAgentAssets).toBeDefined();
    });
});
