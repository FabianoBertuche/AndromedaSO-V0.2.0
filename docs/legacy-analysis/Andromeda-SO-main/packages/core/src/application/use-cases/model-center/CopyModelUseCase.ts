import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";

export interface CopyModelRequest {
    providerId: string;
    source: string;
    destination: string;
}

export class CopyModelUseCase {
    constructor(
        private providerRepository: IProviderRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(request: CopyModelRequest): Promise<void> {
        const provider = await this.providerRepository.findById(request.providerId);
        if (!provider) {
            throw new Error(`Provider with ID ${request.providerId} not found`);
        }

        await this.providerAdapter.copyModel(provider, request.source, request.destination);
    }
}
