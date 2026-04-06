import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { IModelRepository } from "../../../domain/model/IModelRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";
import { ModelCatalogItem } from "../../../domain/model/ModelCatalogItem";

export interface SyncModelsInputDTO {
    providerId: string;
}

export class SyncModelsUseCase {
    constructor(
        private providerRepository: IProviderRepository,
        private modelRepository: IModelRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(input: SyncModelsInputDTO): Promise<ModelCatalogItem[]> {
        const provider = await this.providerRepository.findById(input.providerId);
        if (!provider) {
            throw new Error(`Provider with ID ${input.providerId} not found`);
        }

        const discoveredModels = await this.providerAdapter.listModels(provider);
        const syncedModels: ModelCatalogItem[] = [];
        const existingModels = await this.modelRepository.findByProvider(provider.getId());

        for (const data of discoveredModels) {
            const existing = existingModels.find(model => model.getExternalModelId() === data.externalModelId);

            if (existing) {
                existing.mergeCatalogData({
                    displayName: data.displayName,
                    locality: data.locality,
                    family: data.family,
                    parameterSize: data.parameterSize,
                    quantization: data.quantization,
                    contextWindow: data.contextWindow,
                    capabilities: data.capabilities,
                    pricing: data.pricing,
                    metrics: data.metrics,
                    scores: data.scores,
                    recommendation: data.recommendation,
                });
                await this.modelRepository.save(existing);
                syncedModels.push(existing);
                continue;
            }

            const newModel = new ModelCatalogItem({
                providerId: provider.getId(),
                externalModelId: data.externalModelId!,
                displayName: data.displayName || data.externalModelId!,
                locality: data.locality || "cloud",
                family: data.family,
                parameterSize: data.parameterSize,
                quantization: data.quantization,
                contextWindow: data.contextWindow,
                capabilities: data.capabilities || [],
                enabled: true,
                health: "ok",
                pricing: data.pricing,
                metrics: data.metrics,
                scores: data.scores,
                recommendation: data.recommendation,
            });

            await this.modelRepository.save(newModel);
            syncedModels.push(newModel);
        }

        return syncedModels;
    }
}
