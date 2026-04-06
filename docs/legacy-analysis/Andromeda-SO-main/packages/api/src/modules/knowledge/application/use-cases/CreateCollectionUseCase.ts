import { IKnowledgeRepository } from "../../../../../../core/src/domain/knowledge/IKnowledgeRepository";
import { KnowledgeCollection, KnowledgeScopeType, KnowledgeSourceType, KnowledgeStatus } from "../../../../../../core/src/domain/knowledge/types";

export interface CreateCollectionDTO {
    name: string;
    description?: string;
    scopeType: KnowledgeScopeType;
    scopeId: string;
    sourceType: KnowledgeSourceType;
    metadata?: Record<string, any>;
    tenantId: string;
}

export class CreateCollectionUseCase {
    constructor(private knowledgeRepository: IKnowledgeRepository) { }

    async execute(dto: CreateCollectionDTO): Promise<KnowledgeCollection> {
        const collectionData: Partial<KnowledgeCollection> = {
            name: dto.name,
            description: dto.description,
            scopeType: dto.scopeType,
            scopeId: dto.scopeId,
            sourceType: dto.sourceType,
            status: KnowledgeStatus.COMPLETED, // Collections are usually just containers, so they are "completed" on creation
            metadata: dto.metadata || {},
        };

        return await this.knowledgeRepository.createCollection(collectionData, dto.tenantId);
    }
}
