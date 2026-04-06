import { AgentRegistry, ExecutionResult, ExecutionStrategy, IProviderAdapter, Provider, Task } from "@andromeda/core";
import { CognitiveRoutingSignalService } from "../../modules/cognitive/application/CognitiveRoutingSignalService";
import { cognitiveRoutingSignalService } from "../../modules/cognitive/dependencies";
import { AgentRuntimeOrchestrator } from "../../modules/agent-management/application/AgentRuntimeOrchestrator";
import { agentRuntimeOrchestrator } from "../../modules/agent-management/dependencies";
import { MemoryService } from "../../modules/memory/application/MemoryService";
import { memoryService } from "../../modules/memory/dependencies";
import { routeTaskUseCase } from "../../modules/model-center/dependencies";
import { OllamaProviderAdapter } from "../adapters/providers/OllamaProviderAdapter";
import { globalModelRepository, globalProviderRepository } from "../repositories/GlobalRepositories";
import { checkBudgetBeforeExecutionUseCase, recordSpendUseCase } from "../../modules/budget/dependencies";
import { Pricing } from "@andromeda/core";

export class LLMExecutionStrategy implements ExecutionStrategy {
    private readonly ollamaAdapter: IProviderAdapter;

    constructor(
        private readonly agentRegistry: AgentRegistry,
        private readonly routingSignalService: CognitiveRoutingSignalService = cognitiveRoutingSignalService,
        providerAdapter?: IProviderAdapter,
        private readonly runtimeOrchestrator: AgentRuntimeOrchestrator = agentRuntimeOrchestrator,
        private readonly memoryLayer: MemoryService = memoryService,
    ) {
        this.ollamaAdapter = providerAdapter || new OllamaProviderAdapter();
    }

    async execute(task: Task): Promise<ExecutionResult> {
        const executionStartedAt = new Date();
        try {
            const prepared = await this.runtimeOrchestrator.prepareExecution(task);
            if (!prepared.precheck.allowed) {
                const blocked = this.runtimeOrchestrator.buildBlockedResponse(prepared);
                return {
                    success: true,
                    data: {
                        content: blocked.content,
                        model: "safeguard:fallback",
                        agent: blocked.agent,
                        audit: blocked.audit,
                        behaviorSnapshot: prepared.assembly.behaviorSnapshot,
                    },
                    strategyUsed: this.getIdentifier(),
                };
            }

            const { modelName, provider, pricing } = await this.resolveTarget(task);
            const metadata = task.getMetadata();
            const tenantId = this.resolveTenantId(metadata);
            const budgetedAgentId = this.resolveBudgetAgentId(metadata);
            const estimatedPromptTokens = this.estimateTokens(`${prepared.assembly.systemPrompt}\n${task.getRawRequest()}`);
            const estimatedCompletionTokens = this.estimateTokens(task.getRawRequest()) + 300;
            const estimatedCostUsd = this.estimateCost(pricing, estimatedPromptTokens, estimatedCompletionTokens);

            await this.safeCheckBudget({
                tenantId,
                agentId: budgetedAgentId,
                estimatedCostUsd,
            });

            const response = await this.ollamaAdapter.chat(provider, {
                model: modelName,
                messages: [
                    { role: "system", content: prepared.assembly.systemPrompt },
                    { role: "user", content: task.getRawRequest() },
                ],
                stream: false,
                think: false,
            });
            const finalized = this.runtimeOrchestrator.finalizeExecution({
                task,
                prepared,
                responseText: response.message?.content || response.response || "Sem resposta do modelo.",
                modelName,
            });
            const resultData = {
                content: finalized.content,
                model: modelName,
                agent: finalized.agent,
                audit: finalized.audit,
                behaviorSnapshot: prepared.assembly.behaviorSnapshot,
                usage: response.usage || {
                    prompt_tokens: response.prompt_eval_count,
                    completion_tokens: response.eval_count,
                },
            };
            const promptTokens = this.readPromptTokens(resultData.usage, prepared.assembly.systemPrompt, task.getRawRequest());
            const completionTokens = this.readCompletionTokens(resultData.usage, finalized.content);
            const totalTokens = this.readTotalTokens(resultData.usage, promptTokens, completionTokens);
            const actualCostUsd = this.estimateCost(pricing, promptTokens, completionTokens);

            task.setResult(resultData);
            task.setAuditParecer(finalized.audit);
            await this.safeRecordSpend({
                tenantId,
                taskId: task.getId(),
                agentId: finalized.agent?.id || budgetedAgentId,
                sessionId: task.getSessionId() || metadata.sessionId,
                capability: typeof metadata.activityType === "string"
                    ? metadata.activityType
                    : typeof metadata.interactionMode === "string"
                        ? metadata.interactionMode
                        : undefined,
                status: "completed",
                model: modelName,
                provider: provider.getType(),
                promptTokens,
                completionTokens,
                totalTokens,
                latencyMs: Date.now() - executionStartedAt.getTime(),
                costUsd: actualCostUsd,
                conformanceScore: this.normalizeConformanceScore(finalized.audit?.overallConformanceScore),
                executionStartedAt,
                executionCompletedAt: new Date(),
                resultSnapshot: {
                    content: finalized.content,
                    audit: finalized.audit,
                },
                metadata: {
                    requestId: task.getRequestId(),
                    correlationId: task.getCorrelationId(),
                },
            });
            await this.memoryLayer.registerExecutionMemory(task).catch((error) => {
                console.warn("[memory.execution.record.failed]", {
                    taskId: task.getId(),
                    error: error instanceof Error ? error.message : "unknown_error",
                });
            });

            return {
                success: true,
                data: resultData,
                strategyUsed: this.getIdentifier(),
            };
        } catch (error: any) {
            const metadata = task.getMetadata();
            await this.safeRecordSpend({
                tenantId: this.resolveTenantId(metadata),
                taskId: task.getId(),
                agentId: this.resolveBudgetAgentId(metadata),
                sessionId: task.getSessionId() || metadata.sessionId,
                capability: typeof metadata.activityType === "string" ? metadata.activityType : undefined,
                status: "failed",
                model: undefined,
                provider: undefined,
                latencyMs: Date.now() - executionStartedAt.getTime(),
                costUsd: 0,
                executionStartedAt,
                executionCompletedAt: new Date(),
                metadata: {
                    error: error.message,
                    requestId: task.getRequestId(),
                    correlationId: task.getCorrelationId(),
                },
            });
            return {
                success: false,
                data: null,
                strategyUsed: this.getIdentifier(),
                error: error.message,
            };
        }
    }

    getIdentifier(): string {
        return "llm-agent-strategy-v1";
    }

    private async resolveTarget(task: Task): Promise<{ modelName: string; provider: Provider; pricing?: Pricing }> {
        const metadata = task.getMetadata();
        const explicitModelId = typeof metadata.modelId === "string" && metadata.modelId.trim().length > 0
            ? metadata.modelId.trim()
            : undefined;

        if (explicitModelId) {
            const explicitModel = await globalModelRepository.findById(explicitModelId)
                || await globalModelRepository.findByExternalId(explicitModelId);

            if (explicitModel) {
                const provider = await globalProviderRepository.findById(explicitModel.getProviderId()) || await this.ensureDefaultProvider();
                return {
                    modelName: explicitModel.getExternalModelId(),
                    provider,
                    pricing: explicitModel.getPricing(),
                };
            }

            return {
                modelName: explicitModelId,
                provider: await this.ensureDefaultProvider(),
                pricing: undefined,
            };
        }

            const routedTarget = await this.tryRouteTask(task);
        if (routedTarget) {
            return routedTarget;
        }

        const targetAgentId = typeof metadata.targetAgentId === "string" && metadata.targetAgentId.trim().length > 0
            ? metadata.targetAgentId.trim()
            : undefined;

        if (targetAgentId) {
            const selectedAgent = await this.agentRegistry.findById(targetAgentId);
            if (selectedAgent && selectedAgent.getModel() && selectedAgent.getModel() !== "automatic-router") {
                return {
                    modelName: selectedAgent.getModel(),
                    provider: await this.ensureDefaultProvider(),
                    pricing: undefined,
                };
            }
        }

        const provider = await this.ensureDefaultProvider();
        const discoveredModels = await this.ollamaAdapter.listModels(provider);
        const firstDiscoveredModel = discoveredModels.find(model => typeof model.externalModelId === "string")?.externalModelId;

        if (firstDiscoveredModel) {
            return {
                modelName: firstDiscoveredModel,
                provider,
                pricing: undefined,
            };
        }

        const agent = await this.agentRegistry.getDefaultAgent();
        return {
            modelName: agent.getModel(),
            provider,
            pricing: undefined,
        };
    }

    private async tryRouteTask(task: Task): Promise<{ modelName: string; provider: Provider; pricing?: Pricing } | null> {
        try {
            const routing = await this.routingSignalService.resolve(task);
            const inferredWorkflow = inferWorkflowName(routing.activityType);
            task.mergeMetadata({
                activityType: routing.activityType,
                inferredWorkflow,
                routing: {
                    source: routing.source,
                    activityType: routing.activityType,
                    requiredCapabilities: routing.requiredCapabilities,
                    confidence: routing.confidence,
                    warnings: routing.warnings,
                    inferredWorkflow,
                },
                execution: {
                    ...(task.getMetadata().execution || {}),
                    workflowName: inferredWorkflow,
                },
            });
            console.info("[routing.signal.selected]", {
                taskId: task.getId(),
                source: routing.source,
                activityType: routing.activityType,
                warnings: routing.warnings,
            });

            const decision = await routeTaskUseCase.execute({
                taskId: task.getId(),
                activityType: routing.activityType,
                requiredCapabilities: routing.requiredCapabilities,
            });

            const model = await globalModelRepository.findById(decision.getChosenModelId());
            if (!model) {
                return null;
            }

            const provider = await globalProviderRepository.findById(model.getProviderId()) || await this.ensureDefaultProvider();
            return {
                modelName: model.getExternalModelId(),
                provider,
                pricing: model.getPricing(),
            };
        } catch (error) {
            console.warn("[routing.model-center.fallback]", {
                taskId: task.getId(),
                error: error instanceof Error ? error.message : "unknown_error",
            });
            return null;
        }
    }

    private async ensureDefaultProvider(): Promise<Provider> {
        const providers = await globalProviderRepository.findAll();
        const existing = providers.find(provider => provider.getType() === "ollama") || providers[0];
        if (existing) {
            return existing;
        }

        const provider = new Provider({
            name: "Ollama Local",
            type: "ollama",
            baseUrl: "http://localhost:11434",
            enabled: true,
            metadata: {
                locality: "local",
            }
        });

        await globalProviderRepository.save(provider);
        return provider;
    }

    private resolveTenantId(metadata: Record<string, any>): string {
        return typeof metadata.tenantId === "string" && metadata.tenantId.trim().length > 0
            ? metadata.tenantId.trim()
            : "default";
    }

    private resolveBudgetAgentId(metadata: Record<string, any>): string | undefined {
        if (typeof metadata.targetAgentId === "string" && metadata.targetAgentId.trim().length > 0) {
            return metadata.targetAgentId.trim();
        }

        if (typeof metadata.personaProfileId === "string" && metadata.personaProfileId.trim().length > 0) {
            return metadata.personaProfileId.trim();
        }

        return undefined;
    }

    private estimateTokens(text: string): number {
        return Math.max(1, Math.ceil(text.length / 4));
    }

    private estimateCost(pricing: Pricing | undefined, promptTokens: number, completionTokens: number): number {
        if (!pricing) {
            return 0;
        }

        const inputCost = ((pricing.inputPer1M ?? 0) * promptTokens) / 1_000_000;
        const outputCost = ((pricing.outputPer1M ?? 0) * completionTokens) / 1_000_000;
        return Math.round((inputCost + outputCost) * 100000) / 100000;
    }

    private readPromptTokens(usage: any, systemPrompt: string, request: string): number {
        if (typeof usage?.prompt_tokens === "number") return usage.prompt_tokens;
        return this.estimateTokens(`${systemPrompt}\n${request}`);
    }

    private readCompletionTokens(usage: any, responseText: string): number {
        if (typeof usage?.completion_tokens === "number") return usage.completion_tokens;
        return this.estimateTokens(responseText);
    }

    private readTotalTokens(usage: any, promptTokens: number, completionTokens: number): number {
        if (typeof usage?.total_tokens === "number") return usage.total_tokens;
        return promptTokens + completionTokens;
    }

    private normalizeConformanceScore(value: unknown): number | undefined {
        if (typeof value !== "number" || Number.isNaN(value)) {
            return undefined;
        }
        if (value > 1) {
            return Math.max(0, Math.min(1, value / 100));
        }
        return Math.max(0, Math.min(1, value));
    }

    private async safeCheckBudget(input: { tenantId: string; agentId?: string; estimatedCostUsd: number }): Promise<void> {
        try {
            await checkBudgetBeforeExecutionUseCase.execute(input);
        } catch (error) {
            if (error instanceof Error && error.name === "BudgetExceededError") {
                throw error;
            }

            console.warn("[budget.precheck.skipped]", {
                tenantId: input.tenantId,
                agentId: input.agentId,
                error: error instanceof Error ? error.message : "unknown_error",
            });
        }
    }

    private async safeRecordSpend(input: any): Promise<void> {
        try {
            await recordSpendUseCase.execute(input);
        } catch (error) {
            console.warn("[budget.record-spend.skipped]", {
                taskId: input.taskId,
                agentId: input.agentId,
                error: error instanceof Error ? error.message : "unknown_error",
            });
        }
    }
}

function inferWorkflowName(activityType?: string): string | undefined {
    switch (activityType) {
        case "coding.debug":
            return "debug";
        case "coding.architecture":
            return "plan";
        case "coding.generate":
            return "create";
        case "chat.summarization":
            return "status";
        default:
            return undefined;
    }
}
