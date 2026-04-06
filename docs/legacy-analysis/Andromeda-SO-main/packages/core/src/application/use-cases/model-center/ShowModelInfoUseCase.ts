import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";

export interface ShowModelInfoRequest {
    providerId: string;
    modelName: string;
}

export class ShowModelInfoUseCase {
    constructor(
        private providerRepository: IProviderRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(request: ShowModelInfoRequest): Promise<any> {
        const provider = await this.providerRepository.findById(request.providerId);
        if (!provider) {
            throw new Error(`Provider with ID ${request.providerId} not found`);
        }

        return this.providerAdapter.showModelInfo(provider, request.modelName);
    }
}
