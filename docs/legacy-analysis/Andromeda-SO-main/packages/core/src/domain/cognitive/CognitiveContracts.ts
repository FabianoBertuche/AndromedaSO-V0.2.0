import { Capability } from "../model/Capability";

export interface CognitiveTrace {
    requestId: string;
    correlationId: string;
    taskId?: string;
    sessionId?: string;
    agentId?: string;
    tenantId?: string;
}

export interface CognitiveServiceMetrics {
    tokensIn?: number;
    tokensOut?: number;
    latencyMs?: number;
    [key: string]: number | undefined;
}

export interface CognitiveServiceError {
    code: string;
    message: string;
    retryable?: boolean;
    details?: Record<string, unknown>;
}

export interface CognitiveServiceRequest<
    TInput = Record<string, unknown>,
    TConstraints = Record<string, unknown>,
    TContext = Record<string, unknown>
> extends CognitiveTrace {
    input: TInput;
    constraints?: TConstraints;
    context?: TContext;
    timeoutMs: number;
    traceMetadata?: Record<string, unknown>;
}

export interface CognitiveServiceResponse<TData = Record<string, unknown>> {
    success: boolean;
    data: TData | null;
    metrics?: CognitiveServiceMetrics;
    warnings: string[];
    error: CognitiveServiceError | null;
    provider: string;
    modelUsed?: string;
    durationMs: number;
    trace: CognitiveTrace;
}

export interface CognitiveHealthResponse {
    status: "ok" | "degraded" | "unavailable" | "disabled";
    service: string;
    version: string;
    timestamp: string;
    checks: Record<string, string | number | boolean | null | undefined>;
}

export interface CognitiveReadinessResponse {
    status: "ready" | "degraded" | "not_ready" | "disabled";
    service: string;
    version: string;
    timestamp: string;
    dependencies: Record<string, string>;
}

export type CognitivePingRequest = CognitiveServiceRequest<{ message: string }>;

export interface CognitivePingResult {
    echo: string;
    acknowledged: boolean;
    service: string;
}

export type CognitivePingResponse = CognitiveServiceResponse<CognitivePingResult>;

export interface CognitiveTaskClassification {
    activityType: string;
    requiredCapabilities: Capability[];
    confidence: number;
    reasoning?: string;
}

export type CognitiveTaskClassificationRequest = CognitiveServiceRequest<{
    query: string;
}>;

export type CognitiveTaskClassificationResponse = CognitiveServiceResponse<CognitiveTaskClassification>;
