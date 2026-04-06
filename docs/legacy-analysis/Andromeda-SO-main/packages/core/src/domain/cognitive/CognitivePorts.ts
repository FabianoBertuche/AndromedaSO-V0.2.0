import {
    CognitiveHealthResponse,
    CognitivePingRequest,
    CognitivePingResponse,
    CognitiveReadinessResponse,
    CognitiveServiceRequest,
    CognitiveServiceResponse,
    CognitiveTaskClassificationRequest,
    CognitiveTaskClassificationResponse,
} from "./CognitiveContracts";

export interface CognitiveHealthPort {
    health(): Promise<CognitiveHealthResponse>;
    readiness(): Promise<CognitiveReadinessResponse>;
    ping(request: CognitivePingRequest): Promise<CognitivePingResponse>;
}

export interface CognitiveSignalPort {
    classifyTask(request: CognitiveTaskClassificationRequest): Promise<CognitiveTaskClassificationResponse>;
}

export interface RagServicePort {
    retrieve(
        request: CognitiveServiceRequest<{ query: string }>
    ): Promise<CognitiveServiceResponse<{ documents: unknown[] }>>;
}

export interface MemoryIntelligencePort {
    consolidate(
        request: CognitiveServiceRequest<{ entries: unknown[] }>
    ): Promise<CognitiveServiceResponse<{ memories: unknown[] }>>;
}

export interface EvaluationServicePort {
    evaluate(
        request: CognitiveServiceRequest<{ prompt: string; response: string }>
    ): Promise<CognitiveServiceResponse<{ score: number; rationale?: string }>>;
}

export interface BenchmarkServicePort {
    benchmark(
        request: CognitiveServiceRequest<{ suite: string; candidateId: string }>
    ): Promise<CognitiveServiceResponse<{ score: number; notes?: string[] }>>;
}

export interface PlanningServicePort {
    plan(
        request: CognitiveServiceRequest<{ objective: string }>
    ): Promise<CognitiveServiceResponse<{ steps: string[] }>>;
}

export interface DocumentAnalysisPort {
    analyze(
        request: CognitiveServiceRequest<{ content: string }>
    ): Promise<CognitiveServiceResponse<{ entities?: unknown[]; summary?: string }>>;
}
