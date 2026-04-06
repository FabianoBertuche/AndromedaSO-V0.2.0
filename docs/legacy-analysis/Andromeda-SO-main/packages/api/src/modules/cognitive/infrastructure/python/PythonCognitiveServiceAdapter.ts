import {
    CognitiveHealthPort,
    CognitiveHealthResponse,
    CognitivePingRequest,
    CognitivePingResponse,
    CognitiveReadinessResponse,
    CognitiveServiceResponse,
    CognitiveSignalPort,
    CognitiveTaskClassificationRequest,
    CognitiveTaskClassificationResponse,
    CognitiveTrace,
} from "@andromeda/core";
import { CognitiveServiceConfig } from "../cognitive-service.config";

type HttpMethod = "GET" | "POST";

export class CognitiveIntegrationError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly retryable: boolean,
        public readonly statusCode?: number,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = "CognitiveIntegrationError";
    }
}

export class PythonCognitiveServiceAdapter implements CognitiveHealthPort, CognitiveSignalPort {
    constructor(private readonly config: CognitiveServiceConfig) { }

    async health(): Promise<CognitiveHealthResponse> {
        if (!this.config.enabled) {
            return this.disabledHealth();
        }

        return this.request("/health", {
            method: "GET",
            operation: "health",
            validator: isHealthResponse,
        });
    }

    async readiness(): Promise<CognitiveReadinessResponse> {
        if (!this.config.enabled) {
            return this.disabledReadiness();
        }

        return this.request("/readiness", {
            method: "GET",
            operation: "readiness",
            validator: isReadinessResponse,
        });
    }

    async ping(request: CognitivePingRequest): Promise<CognitivePingResponse> {
        this.ensureEnabled();

        return this.request("/v1/integration/ping", {
            method: "POST",
            operation: "ping",
            body: request,
            trace: request,
            validator: isPingResponse,
        });
    }

    async classifyTask(request: CognitiveTaskClassificationRequest): Promise<CognitiveTaskClassificationResponse> {
        this.ensureEnabled();

        return this.request("/v1/cognitive/classify", {
            method: "POST",
            operation: "classify",
            body: request,
            trace: request,
            validator: isTaskClassificationResponse,
        });
    }

    async analyzeEpisodes(request: {
        requestId: string;
        correlationId: string;
        agentId: string;
        tenantId: string;
        episodes: Array<{
            id: string;
            title: string;
            summary?: string | null;
            content: string;
            importanceScore: number;
            createdAt: string;
            tags: string[];
        }>;
    }): Promise<Array<{
        title: string;
        summary: string;
        suggestion: string;
        confidence: number;
        sourceEpisodeIds: string[];
    }>> {
        this.ensureEnabled();

        const response = await this.request("/evolution/analyze-episodes", {
            method: "POST",
            operation: "analyze-episodes",
            body: {
                requestId: request.requestId,
                correlationId: request.correlationId,
                tenantId: request.tenantId,
                agentId: request.agentId,
                episodes: request.episodes,
            },
            trace: {
                requestId: request.requestId,
                correlationId: request.correlationId,
                agentId: request.agentId,
                tenantId: request.tenantId,
            },
            validator: isEpisodeAnalysisResponse,
        });

        return response.data?.suggestions || [];
    }

    private ensureEnabled() {
        if (!this.config.enabled) {
            throw new CognitiveIntegrationError(
                "COGNITIVE_DISABLED",
                "Cognitive Python service is disabled by configuration",
                false,
                503,
            );
        }
    }

    private async request<T>(
        path: string,
        input: {
            method: HttpMethod;
            operation: string;
            body?: unknown;
            trace?: Partial<CognitiveTrace>;
            validator: (value: unknown) => value is T;
        }
    ): Promise<T> {
        const url = `${this.config.baseUrl}${path}`;
        const attempts = this.config.retryCount + 1;

        for (let attempt = 1; attempt <= attempts; attempt += 1) {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

            try {
                console.info("[cognitive.integration.request]", {
                    operation: input.operation,
                    attempt,
                    requestId: input.trace?.requestId,
                    correlationId: input.trace?.correlationId,
                });

                const response = await fetch(url, {
                    method: input.method,
                    headers: this.buildHeaders(input.trace, input.body !== undefined),
                    body: input.body !== undefined ? JSON.stringify(input.body) : undefined,
                    signal: controller.signal,
                });

                if (!response.ok) {
                    const details = await this.readErrorDetails(response);
                    throw new CognitiveIntegrationError(
                        response.status >= 500 ? "COGNITIVE_DOWNSTREAM_ERROR" : "COGNITIVE_REQUEST_REJECTED",
                        `Cognitive service responded with status ${response.status}`,
                        response.status >= 500,
                        response.status,
                        details,
                    );
                }

                const payload = await response.json();
                if (!input.validator(payload)) {
                    throw new CognitiveIntegrationError(
                        "COGNITIVE_CONTRACT_ERROR",
                        `Cognitive service returned an invalid ${input.operation} payload`,
                        false,
                        response.status,
                        payload,
                    );
                }

                console.info("[cognitive.integration.success]", {
                    operation: input.operation,
                    attempt,
                    requestId: input.trace?.requestId,
                    correlationId: input.trace?.correlationId,
                });

                return payload;
            } catch (error) {
                const normalizedError = this.normalizeError(error);
                console.warn("[cognitive.integration.failure]", {
                    operation: input.operation,
                    attempt,
                    requestId: input.trace?.requestId,
                    correlationId: input.trace?.correlationId,
                    code: normalizedError.code,
                    retryable: normalizedError.retryable,
                    message: normalizedError.message,
                });

                if (attempt >= attempts || !normalizedError.retryable) {
                    throw normalizedError;
                }
            } finally {
                clearTimeout(timeout);
            }
        }

        throw new CognitiveIntegrationError(
            "COGNITIVE_UNAVAILABLE",
            "Cognitive service failed after all retry attempts",
            true,
        );
    }

    private buildHeaders(trace: Partial<CognitiveTrace> | undefined, hasBody: boolean): Record<string, string> {
        const headers: Record<string, string> = {};

        if (hasBody) {
            headers["content-type"] = "application/json";
        }
        if (trace?.requestId) {
            headers["x-request-id"] = trace.requestId;
        }
        if (trace?.correlationId) {
            headers["x-correlation-id"] = trace.correlationId;
        }
        if (this.config.authToken) {
            headers["x-service-token"] = this.config.authToken;
        }

        return headers;
    }

    private async readErrorDetails(response: Response): Promise<unknown> {
        try {
            return await response.json();
        } catch {
            try {
                return await response.text();
            } catch {
                return undefined;
            }
        }
    }

    private normalizeError(error: unknown): CognitiveIntegrationError {
        if (error instanceof CognitiveIntegrationError) {
            return error;
        }

        if (isAbortError(error)) {
            return new CognitiveIntegrationError(
                "COGNITIVE_TIMEOUT",
                "Cognitive service request timed out",
                true,
                504,
            );
        }

        if (error instanceof TypeError) {
            return new CognitiveIntegrationError(
                "COGNITIVE_UNAVAILABLE",
                error.message || "Cognitive service is unavailable",
                true,
                503,
            );
        }

        if (error instanceof Error) {
            return new CognitiveIntegrationError(
                "COGNITIVE_INTEGRATION_ERROR",
                error.message,
                false,
                500,
            );
        }

        return new CognitiveIntegrationError(
            "COGNITIVE_INTEGRATION_ERROR",
            "Unknown cognitive integration error",
            false,
            500,
            error,
        );
    }

    private disabledHealth(): CognitiveHealthResponse {
        return {
            status: "disabled",
            service: this.config.serviceName,
            version: this.config.serviceVersion,
            timestamp: new Date().toISOString(),
            checks: {
                enabled: false,
                url: this.config.baseUrl,
            },
        };
    }

    private disabledReadiness(): CognitiveReadinessResponse {
        return {
            status: "disabled",
            service: this.config.serviceName,
            version: this.config.serviceVersion,
            timestamp: new Date().toISOString(),
            dependencies: {
                http: "disabled",
            },
        };
    }
}

function isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === "AbortError";
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function isHealthResponse(value: unknown): value is CognitiveHealthResponse {
    return isObject(value)
        && typeof value.status === "string"
        && typeof value.service === "string"
        && typeof value.version === "string"
        && typeof value.timestamp === "string"
        && isObject(value.checks);
}

function isReadinessResponse(value: unknown): value is CognitiveReadinessResponse {
    return isObject(value)
        && typeof value.status === "string"
        && typeof value.service === "string"
        && typeof value.version === "string"
        && typeof value.timestamp === "string"
        && isObject(value.dependencies);
}

function isCanonicalResponse(value: unknown): value is CognitivePingResponse | CognitiveTaskClassificationResponse {
    return isObject(value)
        && typeof value.success === "boolean"
        && Array.isArray(value.warnings)
        && (value.error === null || isObject(value.error))
        && typeof value.provider === "string"
        && typeof value.durationMs === "number"
        && isObject(value.trace)
        && typeof value.trace.requestId === "string"
        && typeof value.trace.correlationId === "string"
        && ("data" in value);
}

function isPingResponse(value: unknown): value is CognitivePingResponse {
    return isCanonicalResponse(value);
}

function isTaskClassificationResponse(value: unknown): value is CognitiveTaskClassificationResponse {
    return isCanonicalResponse(value);
}

function isEpisodeAnalysisResponse(value: unknown): value is CognitiveServiceResponse<{
    suggestions: Array<{
        title: string;
        summary: string;
        suggestion: string;
        confidence: number;
        sourceEpisodeIds: string[];
    }>;
}> {
    if (!isCanonicalResponse(value)) {
        return false;
    }

    const suggestions = ((value.data as unknown) as Record<string, unknown>)?.suggestions;
    return Array.isArray(suggestions) && suggestions.every((item) => isObject(item)
        && typeof item.title === "string"
        && typeof item.summary === "string"
        && typeof item.suggestion === "string"
        && typeof item.confidence === "number"
        && Array.isArray(item.sourceEpisodeIds));
}
