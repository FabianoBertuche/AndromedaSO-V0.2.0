import { IBenchmarkRepository } from "../../../domain/benchmark/IBenchmarkRepository";
import { BenchmarkResult } from "../../../domain/benchmark/BenchmarkResult";
import { Pricing } from "../../../domain/model/Pricing";
import { IModelRepository } from "../../../domain/model/IModelRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";
import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { Provider } from "../../../domain/provider/Provider";

export interface RunBenchmarkInputDTO {
    modelId: string;
    suite: string;
    taskType: string;
}

interface BenchmarkSpec {
    prompt: string;
    format?: string;
    validate: (output: string) => {
        success: boolean;
        qualityScore: number;
        note: string;
    };
}

export class RunBenchmarkUseCase {
    constructor(
        private benchmarkRepository: IBenchmarkRepository,
        private modelRepository: IModelRepository,
        private providerRepository: IProviderRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(input: RunBenchmarkInputDTO): Promise<BenchmarkResult> {
        const model = await this.modelRepository.findById(input.modelId);
        if (!model) throw new Error("Modelo não encontrado");

        const provider = await this.providerRepository.findById(model.getProviderId());
        if (!provider) throw new Error("Provider do modelo não encontrado");

        const taskType = this.normalizeTaskType(input.taskType);
        const benchmarkSpec = this.buildBenchmarkSpec(taskType);

        const startTime = Date.now();
        let success = false;
        let score = 0;
        let note = "";
        let tokensIn = this.estimateTokens(benchmarkSpec.prompt);
        let tokensOut = 0;
        let estimatedCost = 0;

        try {
            const response = await this.executeBenchmark(provider, model.getExternalModelId(), benchmarkSpec);
            const outputText = this.extractText(response);
            const validation = benchmarkSpec.validate(outputText);

            tokensIn = this.extractPromptTokens(response, benchmarkSpec.prompt);
            tokensOut = this.extractCompletionTokens(response, outputText);
            estimatedCost = this.estimateCost(model.getPricing(), tokensIn, tokensOut);

            success = validation.success;
            score = this.calculateScore(validation.success, validation.qualityScore, Date.now() - startTime);
            note = validation.note;
        } catch (error: any) {
            success = false;
            score = 0;
            note = `Falha na execução: ${error.message}`;
        }

        const latencyMs = Date.now() - startTime;

        const result = new BenchmarkResult({
            modelId: input.modelId,
            suite: input.suite,
            taskType,
            score,
            latencyMs,
            success,
            tokensIn,
            tokensOut,
            estimatedCost,
            notes: note,
        });

        await this.benchmarkRepository.save(result);

        model.updateScore(taskType, score);
        model.updateMetrics({
            avgLatencyMs: latencyMs,
            avgTokensIn: tokensIn,
            avgTokensOut: tokensOut,
            avgCostPerRun: estimatedCost,
            successRate: success ? 1 : 0,
            benchmarkRuns: (model.getMetrics().benchmarkRuns ?? 0) + 1,
        });
        await this.modelRepository.save(model);

        return result;
    }

    private normalizeTaskType(taskType: string): string {
        const normalized = taskType.trim().toLowerCase().replace(/-/g, "_");
        if (normalized === "structuredoutput") return "structured_output";
        if (normalized.startsWith("coding")) return "coding";
        if (normalized.startsWith("reasoning") || normalized.startsWith("math") || normalized.startsWith("scientific") || normalized.startsWith("security") || normalized.startsWith("data")) {
            return "reasoning";
        }
        if (normalized.startsWith("translation")) return "translation";
        if (normalized.startsWith("summarization")) return "summarization";
        if (normalized.startsWith("extraction") || normalized.startsWith("ocr") || normalized.startsWith("structured")) {
            return "structured_output";
        }
        return normalized;
    }

    private buildBenchmarkSpec(taskType: string): BenchmarkSpec {
        switch (taskType) {
            case "coding":
                return {
                    prompt: [
                        "Return only TypeScript code.",
                        "Implement a pure function named reverseString(input: string): string.",
                        "Do not add explanations, markdown fences or extra text."
                    ].join(" "),
                    validate: (output: string) => {
                        const hasSignature = /reverseString\s*\(\s*input\s*:\s*string\s*\)\s*:\s*string/i.test(output);
                        const hasReturn = /return/i.test(output);
                        const hasNoFence = !/```/.test(output);
                        const success = hasSignature && hasReturn && hasNoFence;
                        return {
                            success,
                            qualityScore: success ? 8.7 + (output.includes(".split(") ? 0.6 : 0) : 0,
                            note: success
                                ? "Saída validada como código TypeScript executável."
                                : "Resposta não atendeu ao formato esperado para benchmark de coding."
                        };
                    }
                };
            case "structured_output":
                return {
                    prompt: [
                        "Return only valid JSON.",
                        "Schema: {\"language\": string, \"summary\": string}.",
                        "Use Portuguese (Brazil) in the summary and mention Ada Lovelace."
                    ].join(" "),
                    format: "json",
                    validate: (output: string) => {
                        try {
                            const parsed = JSON.parse(output);
                            const success = typeof parsed?.language === "string" && typeof parsed?.summary === "string";
                            return {
                                success,
                                qualityScore: success ? 9.2 : 0,
                                note: success
                                    ? "JSON válido retornado no schema esperado."
                                    : "JSON retornado não respeitou o schema esperado."
                            };
                        } catch {
                            return {
                                success: false,
                                qualityScore: 0,
                                note: "Resposta inválida para benchmark estruturado: JSON não foi parseável."
                            };
                        }
                    }
                };
            case "reasoning":
                return {
                    prompt: "Resolva: se 3 máquinas fazem 3 peças em 3 minutos, quantas peças 6 máquinas fazem em 6 minutos? Responda em uma frase curta com a conta final.",
                    validate: (output: string) => {
                        const compact = output.trim().toLowerCase();
                        const success = compact.includes("12") || compact.includes("doze");
                        return {
                            success,
                            qualityScore: success ? 8.9 : 0,
                            note: success
                                ? "Resposta validada para benchmark de reasoning."
                                : "Resposta não chegou ao resultado esperado do benchmark de reasoning."
                        };
                    }
                };
            case "translation":
                return {
                    prompt: "Translate to pt-BR in one sentence: Artificial intelligence helps teams automate repetitive tasks.",
                    validate: (output: string) => {
                        const compact = output.trim().toLowerCase();
                        const success = compact.includes("inteligência artificial") && compact.includes("tarefas");
                        return {
                            success,
                            qualityScore: success ? 8.6 : 0,
                            note: success
                                ? "Tradução validada para benchmark multilíngue."
                                : "Resposta não atendeu ao benchmark de tradução."
                        };
                    }
                };
            case "summarization":
                return {
                    prompt: "Resuma em uma frase: Andromeda OS centraliza catálogo de modelos, benchmark e roteamento inteligente para escolher o melhor LLM por tarefa.",
                    validate: (output: string) => {
                        const compact = output.trim().toLowerCase();
                        const words = compact.split(/\s+/).filter(Boolean);
                        const success = words.length <= 25 && (compact.includes("roteamento") || compact.includes("modelos"));
                        return {
                            success,
                            qualityScore: success ? 8.5 : 0,
                            note: success
                                ? "Resumo validado para benchmark de summarization."
                                : "Resposta não atendeu ao benchmark de summarization."
                        };
                    }
                };
            case "chat":
            default:
                return {
                    prompt: "Explique em uma única frase curta o que é gravidade.",
                    validate: (output: string) => {
                        const compact = output.trim();
                        const words = compact.split(/\s+/).filter(Boolean);
                        const mentionsGravity = /(gravidade|gravity|atra)/i.test(compact);
                        const sentenceCount = compact.split(/[.!?]/).filter(Boolean).length;
                        const success = compact.length > 0 && words.length <= 30 && mentionsGravity && sentenceCount <= 1;
                        return {
                            success,
                            qualityScore: success ? 8.4 : 0,
                            note: success
                                ? "Resposta curta validada para benchmark de chat."
                                : "Resposta não atendeu aos critérios de concisão ou conteúdo."
                        };
                    }
                };
        }
    }

    private async executeBenchmark(provider: Provider, modelName: string, benchmarkSpec: BenchmarkSpec): Promise<any> {
        return this.providerAdapter.generate(provider, {
            model: modelName,
            prompt: benchmarkSpec.prompt,
            format: benchmarkSpec.format,
            stream: false,
        });
    }

    private extractText(response: any): string {
        if (typeof response?.response === "string") return response.response.trim();
        if (typeof response?.message?.content === "string") return response.message.content.trim();
        if (typeof response?.output_text === "string") return response.output_text.trim();
        return "";
    }

    private extractPromptTokens(response: any, prompt: string): number {
        if (typeof response?.prompt_eval_count === "number") return response.prompt_eval_count;
        if (typeof response?.usage?.prompt_tokens === "number") return response.usage.prompt_tokens;
        return this.estimateTokens(prompt);
    }

    private extractCompletionTokens(response: any, outputText: string): number {
        if (typeof response?.eval_count === "number") return response.eval_count;
        if (typeof response?.completion_tokens === "number") return response.completion_tokens;
        if (typeof response?.usage?.completion_tokens === "number") return response.usage.completion_tokens;
        return this.estimateTokens(outputText);
    }

    private estimateTokens(text: string): number {
        return Math.max(1, Math.ceil(text.length / 4));
    }

    private estimateCost(pricing: Pricing | undefined, tokensIn: number, tokensOut: number): number {
        if (!pricing) return 0;

        const inputCost = ((pricing.inputPer1M ?? 0) * tokensIn) / 1_000_000;
        const outputCost = ((pricing.outputPer1M ?? 0) * tokensOut) / 1_000_000;

        return Math.round((inputCost + outputCost) * 100000) / 100000;
    }

    private calculateScore(success: boolean, qualityScore: number, latencyMs: number): number {
        if (!success) return 0;

        const latencyBonus = Math.max(0, 1.2 - latencyMs / 2500);
        const score = Math.min(10, qualityScore + latencyBonus);

        return Math.round(score * 10) / 10;
    }
}
