import { Capability } from "@andromeda/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CognitiveIntegrationError, PythonCognitiveServiceAdapter } from "../../../../../../src/modules/cognitive/infrastructure/python/PythonCognitiveServiceAdapter";

function createAdapter(overrides: Partial<ConstructorParameters<typeof PythonCognitiveServiceAdapter>[0]> = {}) {
    return new PythonCognitiveServiceAdapter({
        enabled: true,
        baseUrl: "http://cognitive.internal:8008",
        timeoutMs: 250,
        retryCount: 1,
        ...overrides,
    });
}

function jsonResponse(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
        text: async () => JSON.stringify(body),
    } as Response;
}

describe("PythonCognitiveServiceAdapter", () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        vi.stubGlobal("fetch", fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
        fetchMock.mockReset();
    });

    it("returns downstream health when the Python service is reachable", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({
            status: "ok",
            service: "cognitive-python",
            version: "0.1.0",
            timestamp: "2026-03-18T12:00:00.000Z",
            checks: {
                http: "ok",
            },
        }));

        const adapter = createAdapter();
        const result = await adapter.health();

        expect(fetchMock).toHaveBeenCalledWith(
            "http://cognitive.internal:8008/health",
            expect.objectContaining({
                method: "GET",
            })
        );
        expect(result.status).toBe("ok");
        expect(result.service).toBe("cognitive-python");
    });

    it("sends the canonical request envelope and returns the canonical response", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({
            success: true,
            data: {
                activityType: "coding.generate",
                requiredCapabilities: [Capability.CODING],
                confidence: 0.91,
                reasoning: "Detected implementation intent.",
            },
            metrics: {
                latencyMs: 48,
            },
            warnings: [],
            error: null,
            provider: "cognitive-python",
            modelUsed: "classifier-v1",
            durationMs: 48,
            trace: {
                requestId: "req-1",
                correlationId: "corr-1",
                taskId: "task-1",
                sessionId: "session-1",
            },
        }));

        const adapter = createAdapter({ authToken: "shared-secret" });
        const response = await adapter.classifyTask({
            requestId: "req-1",
            correlationId: "corr-1",
            taskId: "task-1",
            sessionId: "session-1",
            timeoutMs: 250,
            input: {
                query: "write a python healthcheck",
            },
            constraints: {
                latencyBudgetMs: 250,
            },
            context: {
                channel: "web",
            },
        });

        expect(fetchMock).toHaveBeenCalledWith(
            "http://cognitive.internal:8008/v1/cognitive/classify",
            expect.objectContaining({
                method: "POST",
                headers: expect.objectContaining({
                    "content-type": "application/json",
                    "x-request-id": "req-1",
                    "x-correlation-id": "corr-1",
                    "x-service-token": "shared-secret",
                }),
            })
        );

        const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
        expect(JSON.parse(String(init.body))).toMatchObject({
            requestId: "req-1",
            correlationId: "corr-1",
            taskId: "task-1",
            sessionId: "session-1",
        });
        expect(response.success).toBe(true);
        expect(response.data?.activityType).toBe("coding.generate");
    });

    it("retries controlled failures such as timeouts", async () => {
        fetchMock
            .mockRejectedValueOnce(Object.assign(new Error("The operation was aborted"), { name: "AbortError" }))
            .mockResolvedValueOnce(jsonResponse({
                success: true,
                data: {
                    echo: "ping",
                    acknowledged: true,
                    service: "cognitive-python",
                },
                metrics: {
                    latencyMs: 21,
                },
                warnings: [],
                error: null,
                provider: "cognitive-python",
                modelUsed: "ping-v1",
                durationMs: 21,
                trace: {
                    requestId: "req-ping",
                    correlationId: "corr-ping",
                },
            }));

        const adapter = createAdapter({ retryCount: 1 });
        const response = await adapter.ping({
            requestId: "req-ping",
            correlationId: "corr-ping",
            timeoutMs: 250,
            input: {
                message: "ping",
            },
        });

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(response.success).toBe(true);
        expect(response.data?.acknowledged).toBe(true);
    });

    it("surfaces downstream unavailability as a controlled integration error", async () => {
        fetchMock.mockRejectedValue(new TypeError("fetch failed"));

        const adapter = createAdapter({ retryCount: 0 });

        await expect(adapter.ping({
            requestId: "req-unavailable",
            correlationId: "corr-unavailable",
            timeoutMs: 250,
            input: {
                message: "ping",
            },
        })).rejects.toMatchObject<CognitiveIntegrationError>({
            code: "COGNITIVE_UNAVAILABLE",
            retryable: true,
        });
    });

    it("rejects malformed responses with a contract error", async () => {
        fetchMock.mockResolvedValueOnce(jsonResponse({
            status: "ok",
        }));

        const adapter = createAdapter({ retryCount: 0 });

        await expect(adapter.ping({
            requestId: "req-contract",
            correlationId: "corr-contract",
            timeoutMs: 250,
            input: {
                message: "ping",
            },
        })).rejects.toMatchObject<CognitiveIntegrationError>({
            code: "COGNITIVE_CONTRACT_ERROR",
            retryable: false,
        });
    });
});
