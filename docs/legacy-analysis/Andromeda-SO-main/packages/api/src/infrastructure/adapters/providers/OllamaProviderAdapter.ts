import { Capability, IProviderAdapter, ModelCatalogItemProps, Pricing, Provider, ProviderHealth } from "@andromeda/core";
import { FileModelPricingRegistry } from "../../../modules/model-center/infrastructure/FileModelPricingRegistry";
import { CircuitBreakerFactory } from "../../resilience/CircuitBreakerFactory";
import { circuitBreakerRegistry } from "../../resilience/circuit-breaker.registry";
import CircuitBreaker from "opossum";

type JsonRecord = Record<string, unknown>;

export class OllamaProviderAdapter implements IProviderAdapter {
    constructor(
        private readonly pricingRegistry: FileModelPricingRegistry = new FileModelPricingRegistry()
    ) { }

    async healthCheck(provider: Provider): Promise<ProviderHealth> {
        try {
            const response = await this.getBreaker(provider).fire(() => fetch(`${this.getBaseUrl(provider)}/api/version`, {
                headers: this.buildHeaders(provider),
            }));


            if (response.ok) {
                return { status: "ok" };
            }

            return {
                status: "error",
                message: `Ollama returned ${response.status}`,
            };
        } catch (error: any) {
            return { status: "error", message: error.message };
        }
    }

    async listModels(provider: Provider): Promise<Partial<ModelCatalogItemProps>[]> {
        const response = await this.getBreaker(provider).fire(() => fetch(`${this.getBaseUrl(provider)}/api/tags`, {
            headers: this.buildHeaders(provider),
        }));


        if (!response.ok) {
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { models?: Array<Record<string, any>> };
        const locality = this.resolveLocality(provider);
        const discoveredModels = data.models || [];

        return Promise.all(discoveredModels.map(async model => {
            const pricing = locality === "cloud"
                ? await this.resolveCloudPricing(model.name)
                : this.createLocalPricing();

            return {
                externalModelId: model.name,
                displayName: model.name,
                locality,
                family: model.details?.family,
                parameterSize: model.details?.parameter_size,
                quantization: model.details?.quantization_level,
                capabilities: this.inferCapabilities(model.name),
                pricing,
            };
        }));
    }

    async pullModel(provider: Provider, modelName: string, onProgress?: (p: any) => void): Promise<void> {
        await this.postStream(provider, "/api/pull", { name: modelName }, onProgress);
    }

    async pushModel(provider: Provider, modelName: string, onProgress?: (p: any) => void): Promise<void> {
        await this.postStream(provider, "/api/push", { name: modelName }, onProgress);
    }

    async createModel(provider: Provider, name: string, modelfile: string, onProgress?: (p: any) => void): Promise<void> {
        await this.postStream(provider, "/api/create", { name, modelfile }, onProgress);
    }

    async deleteModel(provider: Provider, modelName: string): Promise<void> {
        await this.postJson(provider, "/api/delete", {
            method: "DELETE",
            name: modelName,
        });
    }

    async copyModel(provider: Provider, source: string, destination: string): Promise<void> {
        await this.postJson(provider, "/api/copy", {
            method: "POST",
            source,
            destination,
        });
    }

    async showModelInfo(provider: Provider, modelName: string): Promise<any> {
        return this.postJson(provider, "/api/show", {
            method: "POST",
            name: modelName,
        });
    }

    async listRunningModels(provider: Provider): Promise<any[]> {
        const response = await this.getBreaker(provider).fire(() => fetch(`${this.getBaseUrl(provider)}/api/ps`, {
            headers: this.buildHeaders(provider),
        }));


        if (!response.ok) {
            throw new Error(`PS failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { models?: any[] };
        return data.models || [];
    }

    async generate(provider: Provider, params: any): Promise<any> {
        return this.postJson(provider, "/api/generate", {
            method: "POST",
            ...params,
        });
    }

    async chat(provider: Provider, params: any): Promise<any> {
        return this.postJson(provider, "/api/chat", {
            method: "POST",
            ...params,
        });
    }

    async embed(provider: Provider, params: any): Promise<any> {
        return this.postJson(provider, "/api/embed", {
            method: "POST",
            ...params,
        });
    }

    async getVersion(provider: Provider): Promise<string> {
        const response = await this.getBreaker(provider).fire(() => fetch(`${this.getBaseUrl(provider)}/api/version`, {
            headers: this.buildHeaders(provider),
        }));


        if (!response.ok) {
            throw new Error(`Version check failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json() as { version?: string };
        return data.version || "unknown";
    }

    private inferCapabilities(name: string): Capability[] {
        const capabilities: Capability[] = [Capability.CHAT];
        const normalizedName = name.toLowerCase();

        if (normalizedName.includes("coder") || normalizedName.includes("code")) capabilities.push(Capability.CODING);
        if (
            normalizedName.includes("math") ||
            normalizedName.includes("reason") ||
            normalizedName.includes("deepseek-r") ||
            normalizedName.includes("thought")
        ) capabilities.push(Capability.REASONING);
        if (normalizedName.includes("instruct")) capabilities.push(Capability.CHAT, Capability.ANALYSIS);
        if (
            normalizedName.includes("vision") ||
            normalizedName.includes("vl") ||
            normalizedName.includes("llava") ||
            normalizedName.includes("moondream")
        ) capabilities.push(Capability.VISION);
        if (
            normalizedName.includes("llama3") ||
            normalizedName.includes("mistral") ||
            normalizedName.includes("qwen") ||
            normalizedName.includes("command-r")
        ) {
            capabilities.push(Capability.TOOLS, Capability.FUNCTION_CALLING);
        }
        if (
            normalizedName.includes("llama3") ||
            normalizedName.includes("mistral") ||
            normalizedName.includes("qwen")
        ) {
            capabilities.push(Capability.STRUCTURED_OUTPUT);
        }

        return [...new Set(capabilities)];
    }

    private async postJson(provider: Provider, path: string, body: JsonRecord): Promise<any> {
        const { method = "POST", ...payload } = body;
        const response = await this.getBreaker(provider).fire(() => fetch(`${this.getBaseUrl(provider)}${path}`, {
            method: String(method),
            headers: this.buildHeaders(provider),
            body: JSON.stringify(payload),
        }));


        if (!response.ok) {
            throw new Error(`${path} failed: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return null;
        }

        return response.json();
    }

    private async postStream(provider: Provider, path: string, body: JsonRecord, onProgress?: (p: any) => void): Promise<void> {
        const response = await this.getBreaker(provider).fire(() => fetch(`${this.getBaseUrl(provider)}${path}`, {
            method: "POST",
            headers: this.buildHeaders(provider),
            body: JSON.stringify(body),
        }));


        if (!response.ok) {
            throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) return;

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                onProgress?.(JSON.parse(trimmed));
            }
        }

        if (buffer.trim()) {
            onProgress?.(JSON.parse(buffer));
        }
    }

    private buildHeaders(provider: Provider): HeadersInit {
        const credentials = provider.getCredentials() || {};
        const metadata = provider.getMetadata() || {};
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Accept: "application/json",
        };

        const token = this.pickString(credentials.apiKey, credentials.bearerToken, metadata.apiKey);
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const extraHeaders = [credentials.headers, metadata.headers].find(value => typeof value === "object" && value !== null) as Record<string, string> | undefined;
        if (extraHeaders) {
            Object.assign(headers, extraHeaders);
        }

        return headers;
    }

    private getBaseUrl(provider: Provider): string {
        return (provider.getBaseUrl() || "http://localhost:11434").replace(/\/+$/, "");
    }

    private resolveLocality(provider: Provider): "local" | "cloud" {
        const metadata = provider.getMetadata();
        if (metadata?.locality === "local" || metadata?.locality === "cloud") {
            return metadata.locality;
        }

        try {
            const host = new URL(this.getBaseUrl(provider)).hostname.toLowerCase();
            return ["localhost", "127.0.0.1", "::1"].includes(host) ? "local" : "cloud";
        } catch {
            return "local";
        }
    }

    private async resolveCloudPricing(modelId: string): Promise<Pricing> {
        const pricing = await this.pricingRegistry.findByModelId(modelId);
        if (pricing) {
            return pricing;
        }

        return {
            currency: "USD",
            source: "unknown",
        };
    }

    private createLocalPricing(): Pricing {
        return {
            inputPer1M: 0,
            outputPer1M: 0,
            currency: "USD",
            source: "estimated",
        };
    }

    private pickString(...values: unknown[]): string | undefined {
        return values.find(value => typeof value === "string" && value.trim().length > 0) as string | undefined;
    }

    private getBreaker(provider: Provider): CircuitBreaker<[() => Promise<Response>], Response> {
        const name = `provider-${provider.getId()}`;
        let breaker = circuitBreakerRegistry.get(name);
        if (!breaker) {
            breaker = CircuitBreakerFactory.create<[() => Promise<Response>], Response>(name, async (action: () => Promise<Response>) => {
                return action();
            });
            circuitBreakerRegistry.register(name, breaker);
        }
        return breaker as CircuitBreaker<[() => Promise<Response>], Response>;
    }
}

