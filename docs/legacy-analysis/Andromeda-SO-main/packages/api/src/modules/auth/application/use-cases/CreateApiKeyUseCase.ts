import crypto from 'crypto';
import { IApiKeyRepository } from '../../domain/ports';

export class CreateApiKeyUseCase {
    constructor(private apiKeyRepository: IApiKeyRepository) { }

    async execute(name: string, userId: string, tenantId: string) {
        const rawKey = `andromeda_${crypto.randomBytes(32).toString('hex')}`;
        const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

        await this.apiKeyRepository.create({
            name,
            userId,
            tenantId,
            keyHash,
        });

        return {
            success: true,
            data: {
                apiKey: rawKey, // Exibido apenas uma vez na criação
            },
        };
    }
}
