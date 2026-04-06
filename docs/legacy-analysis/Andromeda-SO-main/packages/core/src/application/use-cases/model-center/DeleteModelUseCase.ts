import { IModelRepository } from "../../../domain/model/IModelRepository";
import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";

export interface DeleteModelRequest {
    providerId: string;
    modelName: string;
}

export class DeleteModelUseCase {
    constructor(
        private providerRepository: IProviderRepository,
        private modelRepository: IModelRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(request: DeleteModelRequest): Promise<void> {
        const provider = await this.providerRepository.findById(request.providerId);
        if (!provider) {
            throw new Error(`Provider with ID ${request.providerId} not found`);
        }

        // 1. Remover do provedor externo
        await this.providerAdapter.deleteModel(provider, request.modelName);

        // 2. Remover do catálogo local
        const model = await this.modelRepository.findByExternalId(request.modelName);
        if (model) {
            await this.modelRepository.delete(model.getId());
        }
    }
}
