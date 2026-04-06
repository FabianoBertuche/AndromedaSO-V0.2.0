import { Response } from "express";
import { CreateCollectionUseCase } from "../../application/use-cases/CreateCollectionUseCase";
import { AddDocumentUseCase } from "../../application/use-cases/AddDocumentUseCase";
import { IKnowledgeRepository } from "../../../../../../core/src/domain/knowledge/IKnowledgeRepository";
import { RequestWithContext } from "../../../../shared/http/request-context";

export class KnowledgeController {
    constructor(
        private knowledgeRepository: IKnowledgeRepository,
        private createCollectionUseCase: CreateCollectionUseCase,
        private addDocumentUseCase: AddDocumentUseCase
    ) { }

    async createCollection(req: RequestWithContext, res: Response): Promise<void> {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            if (!tenantId) {
                res.status(403).json({ error: "Tenant context required" });
                return;
            }

            const result = await this.createCollectionUseCase.execute({
                ...req.body,
                tenantId,
            });
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async listCollections(req: RequestWithContext, res: Response): Promise<void> {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            if (!tenantId) {
                res.status(403).json({ error: "Tenant context required" });
                return;
            }

            const { scopeType, scopeId } = req.query;
            const result = await this.knowledgeRepository.listCollections(tenantId, {
                scopeType: scopeType as any,
                scopeId: scopeId as string,
            });
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async addDocument(req: RequestWithContext, res: Response): Promise<void> {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            if (!tenantId) {
                res.status(403).json({ error: "Tenant context required" });
                return;
            }

            const { collectionId } = req.params;
            const result = await this.addDocumentUseCase.execute({
                ...req.body,
                collectionId,
                tenantId,
            });
            res.status(201).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message });
        }
    }

    async listDocuments(req: RequestWithContext, res: Response): Promise<void> {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            if (!tenantId) {
                res.status(403).json({ error: "Tenant context required" });
                return;
            }

            const { collectionId } = req.params;
            const result = await this.knowledgeRepository.listDocuments(collectionId, tenantId);
            res.json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async deleteDocument(req: RequestWithContext, res: Response): Promise<void> {
        try {
            const tenantId = req.tenantId || req.user?.tenantId;
            if (!tenantId) {
                res.status(403).json({ error: "Tenant context required" });
                return;
            }

            await this.knowledgeRepository.deleteDocument(req.params.documentId, tenantId);
            res.status(204).send();
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}
