import { IModelRepository } from "../../../domain/model/IModelRepository";
import { IProviderRepository } from "../../../domain/provider/IProviderRepository";
import { IProviderAdapter } from "../../../domain/provider/IProviderAdapter";

export interface PullModelRequest {
    providerId: string;
    modelName: string;
    onProgress?: (progress: any) => void;
}

export class PullModelUseCase {
    constructor(
        private providerRepository: IProviderRepository,
        private modelRepository: IModelRepository,
        private providerAdapter: IProviderAdapter
    ) { }

    async execute(request: PullModelRequest): Promise<void> {
        const provider = await this.providerRepository.findById(request.providerId);
        if (!provider) {
            throw new Error(`Provider with ID ${request.providerId} not found`);
        }

        // 1. Chamar o adapter para fazer o pull
        await this.providerAdapter.pullModel(provider, request.modelName, request.onProgress);

        // 2. Após o pull, podemos sincronizar este modelo específico no catálogo
        // (Seria o ideal, mas por simplicidade no MVP, o usuário pode dar Sync geral depois)
        // Mas vamos tentar registrar se for um modelo novo.
        const models = await this.providerAdapter.listModels(provider);
        const pulledModelProps = models.find(m => m.externalModelId === request.modelName);

        if (pulledModelProps) {
            const existing = await this.modelRepository.findByExternalId(request.modelName);
            if (!existing) {
                // Registrar no repositório se não existir
                // Nota: No MVP real, precisaríamos de uma factory ou mapeamento de entidade
                // Por agora, assumimos que o listModels retorna o que precisamos.
            }
        }
    }
}
