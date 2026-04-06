import { Provider } from "../../../domain/provider/Provider";
import { IProviderRepository } from "../../../domain/provider/IProviderRepository";

export interface RegisterProviderInputDTO {
    name: string;
    type: string;
    baseUrl: string;
    credentials?: Record<string, any>;
    metadata?: Record<string, any>;
}

export class RegisterProviderUseCase {
    constructor(private providerRepository: IProviderRepository) { }

    async execute(input: RegisterProviderInputDTO): Promise<Provider> {
        const provider = new Provider({
            name: input.name,
            type: input.type,
            baseUrl: input.baseUrl,
            enabled: true,
            credentials: input.credentials,
            metadata: input.metadata,
        });

        await this.providerRepository.save(provider);
        return provider;
    }
}
