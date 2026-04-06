import { IProviderAdapter, Provider } from "@andromeda/core";
import { ILlmRouter } from "../domain/ports";
import { OllamaProviderAdapter } from "../../../infrastructure/adapters/providers/OllamaProviderAdapter";
import { globalProviderRepository } from "../../../infrastructure/repositories/GlobalRepositories";

export class PlannerLlmRouter implements ILlmRouter {
    private readonly providerAdapter: IProviderAdapter;

    constructor(providerAdapter?: IProviderAdapter) {
        this.providerAdapter = providerAdapter || new OllamaProviderAdapter();
    }

    async complete(input: { prompt: string; capability: string; tenantId: string; agentId: string; }): Promise<{ content: string; }> {
        const provider = await this.ensureDefaultProvider();
        const models = await this.providerAdapter.listModels(provider);
        const modelName = models.find((model) => typeof model.externalModelId === "string")?.externalModelId || "llama3.2";
        const response = await this.providerAdapter.chat(provider, {
            model: modelName,
            messages: [
                { role: "system", content: "You are a planning system. Return valid JSON only." },
                { role: "user", content: input.prompt },
            ],
            stream: false,
            think: false,
        });

        return {
            content: response.message?.content || response.response || "",
        };
    }

    private async ensureDefaultProvider(): Promise<Provider> {
        const providers = await globalProviderRepository.findAll();
        const existing = providers.find((provider) => provider.getType() === "ollama") || providers[0];
        if (existing) {
            return existing;
        }

        const provider = new Provider({
            name: "Ollama Local",
            type: "ollama",
            baseUrl: "http://localhost:11434",
            enabled: true,
            metadata: { locality: "local" },
        });
        await globalProviderRepository.save(provider);
        return provider;
    }
}
