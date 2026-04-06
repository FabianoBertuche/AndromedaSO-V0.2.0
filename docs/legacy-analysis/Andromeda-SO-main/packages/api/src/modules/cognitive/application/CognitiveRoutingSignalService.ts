import {
    Capability,
    CognitiveSignalPort,
    CognitiveTaskClassification,
    CognitiveTaskClassificationRequest,
    Task,
} from "@andromeda/core";
import { CognitiveServiceConfig } from "../infrastructure/cognitive-service.config";

export interface RoutingSignalResolution extends CognitiveTaskClassification {
    source: "heuristic" | "cognitive";
    warnings: string[];
}

export class CognitiveRoutingSignalService {
    constructor(
        private readonly signalPort: CognitiveSignalPort,
        private readonly config: Pick<CognitiveServiceConfig, "enabled" | "timeoutMs">,
    ) { }

    async resolve(task: Task): Promise<RoutingSignalResolution> {
        const fallback = classifyWithHeuristics(task.getRawRequest());

        if (!this.config.enabled) {
            return {
                ...fallback,
                source: "heuristic",
                warnings: [],
            };
        }

        const request = this.buildRequest(task);

        try {
            const response = await this.signalPort.classifyTask(request);
            const classification = response.data;

            if (!response.success || !classification) {
                return {
                    ...fallback,
                    source: "heuristic",
                    warnings: response.warnings,
                };
            }

            const requiredCapabilities = classification.requiredCapabilities
                .filter((capability): capability is Capability => Object.values(Capability).includes(capability));

            if (!classification.activityType || requiredCapabilities.length === 0) {
                return {
                    ...fallback,
                    source: "heuristic",
                    warnings: ["Cognitive classification returned an incomplete capability set."],
                };
            }

            console.info("[cognitive.routing.signal]", {
                taskId: task.getId(),
                requestId: response.trace.requestId,
                correlationId: response.trace.correlationId,
                activityType: classification.activityType,
                source: "cognitive",
            });

            return {
                activityType: classification.activityType,
                requiredCapabilities,
                confidence: classification.confidence,
                reasoning: classification.reasoning,
                source: "cognitive",
                warnings: response.warnings,
            };
        } catch (error) {
            console.warn("[cognitive.routing.fallback]", {
                taskId: task.getId(),
                error: error instanceof Error ? error.message : "unknown_error",
            });

            return {
                ...fallback,
                source: "heuristic",
                warnings: [error instanceof Error ? error.message : "unknown_error"],
            };
        }
    }

    private buildRequest(task: Task): CognitiveTaskClassificationRequest {
        const metadata = task.getMetadata();
        const requestId = selectString(task.getRequestId(), metadata.requestId) || `req_${task.getId()}`;
        const correlationId = selectString(task.getCorrelationId(), metadata.correlationId) || requestId;
        const sessionId = selectString(task.getSessionId(), metadata.sessionId);
        const agentId = selectString(metadata.agentId);
        const sourceChannel = selectString(task.getSourceChannel(), metadata.sourceChannel) || "system";

        return {
            requestId,
            correlationId,
            taskId: task.getId(),
            sessionId,
            agentId,
            input: {
                query: task.getRawRequest(),
            },
            constraints: {
                latencyBudgetMs: this.config.timeoutMs,
                maxTokens: 128,
            },
            context: {
                project: "andromeda",
                channel: sourceChannel,
            },
            timeoutMs: this.config.timeoutMs,
            traceMetadata: {
                modelId: selectString(metadata.modelId),
                sourceChannel,
            },
        };
    }
}

function classifyWithHeuristics(rawRequest: string): CognitiveTaskClassification {
    const normalized = rawRequest.toLowerCase();

    if (/(debug|stack trace|erro|fix bug|corrigir)/i.test(normalized)) {
        return { activityType: "coding.debug", requiredCapabilities: [Capability.CODING], confidence: 0.65 };
    }
    if (/(arquitetura|architecture|refactor|design system)/i.test(normalized)) {
        return { activityType: "coding.architecture", requiredCapabilities: [Capability.CODING], confidence: 0.62 };
    }
    if (/(traduz|translate|translation)/i.test(normalized)) {
        return { activityType: "translation", requiredCapabilities: [Capability.CHAT], confidence: 0.58 };
    }
    if (/(resum|summary|summarize)/i.test(normalized)) {
        return { activityType: "chat.summarization", requiredCapabilities: [Capability.SUMMARIZATION], confidence: 0.63 };
    }
    if (/(rag|retrieval|embedding|vector)/i.test(normalized)) {
        return { activityType: "rag.retrieval", requiredCapabilities: [Capability.RAG], confidence: 0.66 };
    }
    if (/(imagem|image|vision|foto|screenshot)/i.test(normalized)) {
        return { activityType: "vision.general", requiredCapabilities: [Capability.VISION], confidence: 0.6 };
    }
    if (/(audio|speech|transcri|stt|tts)/i.test(normalized)) {
        return { activityType: "audio.stt", requiredCapabilities: [Capability.AUDIO], confidence: 0.6 };
    }
    if (/(código|code|function|typescript|python|javascript)/i.test(normalized)) {
        return { activityType: "coding.generate", requiredCapabilities: [Capability.CODING], confidence: 0.64 };
    }

    return { activityType: "chat.general", requiredCapabilities: [Capability.CHAT], confidence: 0.55 };
}

function selectString(...values: unknown[]): string | undefined {
    for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }

    return undefined;
}
