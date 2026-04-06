import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";

export interface CreateModelRequest {
    providerId: string;
    name: string;
    modelfile: string;
    onProgress?: (progress: any) => void;
}

export class CreateModelUseCase {
    constructor(
        private providerRepository: IProviderRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(request: CreateModelRequest): Promise<void> {
        const provider = await this.providerRepository.findById(request.providerId);
        if (!provider) {
            throw new Error(`Provider with ID ${request.providerId} not found`);
        }

        await this.providerAdapter.createModel(provider, request.name, request.modelfile, request.onProgress);
    }
}
