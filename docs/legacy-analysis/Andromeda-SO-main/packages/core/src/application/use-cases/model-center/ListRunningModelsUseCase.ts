import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";

export interface ListRunningModelsRequest {
    providerId: string;
}

export class ListRunningModelsUseCase {
    constructor(
        private providerRepository: IProviderRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(request: ListRunningModelsRequest): Promise<any[]> {
        const provider = await this.providerRepository.findById(request.providerId);
        if (!provider) {
            throw new Error(`Provider with ID ${request.providerId} not found`);
        }

        return this.providerAdapter.listRunningModels(provider);
    }
}
