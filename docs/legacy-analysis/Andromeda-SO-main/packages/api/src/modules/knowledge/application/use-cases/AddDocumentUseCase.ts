import { IKnowledgeRepository } from "../../../../../../core/src/domain/knowledge/IKnowledgeRepository";
import { KnowledgeDocument, KnowledgeSourceType, KnowledgeStatus } from "../../../../../../core/src/domain/knowledge/types";
import { KnowledgeLanguageService } from "./KnowledgeLanguageService";

export interface AddDocumentDTO {
    collectionId: string;
    title: string;
    sourceType: KnowledgeSourceType;
    sourcePath?: string;
    mimeType?: string;
    rawText?: string;
    metadata?: Record<string, any>;
    tenantId: string;
    detectLanguage?: boolean;
}

export class AddDocumentUseCase {
    constructor(
        private knowledgeRepository: IKnowledgeRepository,
        private languageService?: KnowledgeLanguageService,
    ) { }

    async execute(dto: AddDocumentDTO): Promise<KnowledgeDocument> {
        const documentData: Partial<KnowledgeDocument> = {
            collectionId: dto.collectionId,
            title: dto.title,
            sourceType: dto.sourceType,
            sourcePath: dto.sourcePath,
            mimeType: dto.mimeType,
            rawText: dto.rawText,
            status: KnowledgeStatus.PENDING,
            metadata: dto.metadata || {},
        };

        const document = await this.knowledgeRepository.addDocument(dto.collectionId, documentData, dto.tenantId);

        if (dto.detectLanguage !== false && this.languageService && document.rawText) {
            void this.languageService.detectAndStore(document.id);
        }

        return document;
    }
}
