import { Capability, Task } from "@andromeda/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CognitiveSignalPort } from "@andromeda/core";
import { CognitiveRoutingSignalService } from "../../../../../src/modules/cognitive/application/CognitiveRoutingSignalService";

describe("CognitiveRoutingSignalService", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("uses the Python signal when the service is enabled and healthy", async () => {
        const port: CognitiveSignalPort = {
            classifyTask: vi.fn().mockResolvedValue({
                success: true,
                data: {
                    activityType: "coding.generate",
                    requiredCapabilities: [Capability.CODING],
                    confidence: 0.94,
                    reasoning: "The request is asking for implementation.",
                },
                metrics: {
                    latencyMs: 37,
                },
                warnings: [],
                error: null,
                provider: "cognitive-python",
                modelUsed: "classifier-v1",
                durationMs: 37,
                trace: {
                    requestId: "req-1",
                    correlationId: "corr-1",
                    taskId: "task-1",
                    sessionId: "session-1",
                },
            }),
        };

        const service = new CognitiveRoutingSignalService(port, {
            enabled: true,
            timeoutMs: 900,
        });

        const task = new Task({
            id: "task-1",
            rawRequest: "write an integration adapter in TypeScript",
            metadata: {
                requestId: "req-1",
                correlationId: "corr-1",
                sessionId: "session-1",
                sourceChannel: "web",
            },
        });

        const result = await service.resolve(task);

        expect(port.classifyTask).toHaveBeenCalledWith(expect.objectContaining({
            requestId: "req-1",
            correlationId: "corr-1",
            taskId: "task-1",
            sessionId: "session-1",
            timeoutMs: 900,
        }));
        expect(result.source).toBe("cognitive");
        expect(result.activityType).toBe("coding.generate");
        expect(result.requiredCapabilities).toEqual([Capability.CODING]);
    });

    it("falls back to the local heuristic when the Python service is disabled", async () => {
        const port: CognitiveSignalPort = {
            classifyTask: vi.fn(),
        };

        const service = new CognitiveRoutingSignalService(port, {
            enabled: false,
            timeoutMs: 900,
        });

        const task = new Task({
            id: "task-2",
            rawRequest: "summarize this status report",
        });

        const result = await service.resolve(task);

        expect(port.classifyTask).not.toHaveBeenCalled();
        expect(result.source).toBe("heuristic");
        expect(result.activityType).toBe("chat.summarization");
        expect(result.requiredCapabilities).toEqual([Capability.SUMMARIZATION]);
    });

    it("isolates Python failures and preserves the legacy routing flow", async () => {
        const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
        const port: CognitiveSignalPort = {
            classifyTask: vi.fn().mockRejectedValue(new Error("connection refused")),
        };

        const service = new CognitiveRoutingSignalService(port, {
            enabled: true,
            timeoutMs: 900,
        });

        const task = new Task({
            id: "task-3",
            rawRequest: "debug this broken websocket flow",
            metadata: {
                requestId: "req-3",
                correlationId: "corr-3",
            },
        });

        const result = await service.resolve(task);

        expect(result.source).toBe("heuristic");
        expect(result.activityType).toBe("coding.debug");
        expect(result.requiredCapabilities).toEqual([Capability.CODING]);
        expect(warnSpy).toHaveBeenCalled();
    });
});
