import { PrismaClient } from "@prisma/client";
import { IKnowledgeRepository } from "../../../../../../core/src/domain/knowledge/IKnowledgeRepository";
import {
    KnowledgeCollection,
    KnowledgeDocument,
    KnowledgeChunk,
    KnowledgeScopeType,
    KnowledgeSourceType,
    KnowledgeStatus
} from "../../../../../../core/src/domain/knowledge/types";

export class PrismaKnowledgeRepository implements IKnowledgeRepository {
    constructor(private prisma: PrismaClient) { }

    // Collections
    async createCollection(data: Partial<KnowledgeCollection>, tenantId: string): Promise<KnowledgeCollection> {
        const collection = await this.prisma.knowledgeCollection.create({
            data: {
                name: data.name!,
                description: data.description,
                scopeType: data.scopeType as any,
                scopeId: data.scopeId!,
                sourceType: data.sourceType as any,
                status: data.status as any,
                metadata: data.metadata || {},
                tenantId: tenantId,
            },
        });
        return this.mapToCollection(collection);
    }

    async getCollection(id: string, tenantId: string): Promise<KnowledgeCollection | null> {
        const collection = await this.prisma.knowledgeCollection.findUnique({
            where: { id, tenantId },
        });
        return collection ? this.mapToCollection(collection) : null;
    }

    async listCollections(tenantId: string, filters: { scopeType?: KnowledgeScopeType, scopeId?: string }): Promise<KnowledgeCollection[]> {
        const collections = await this.prisma.knowledgeCollection.findMany({
            where: {
                tenantId: tenantId,
                scopeType: filters.scopeType as any,
                scopeId: filters.scopeId,
            },
        });
        return collections.map(c => this.mapToCollection(c));
    }

    async updateCollection(id: string, data: Partial<KnowledgeCollection>, tenantId: string): Promise<KnowledgeCollection> {
        const collection = await this.prisma.knowledgeCollection.update({
            where: { id, tenantId },
            data: {
                name: data.name,
                description: data.description,
                status: data.status as any,
                metadata: data.metadata,
            },
        });
        return this.mapToCollection(collection);
    }

    async deleteCollection(id: string, tenantId: string): Promise<void> {
        await this.prisma.knowledgeCollection.delete({
            where: { id, tenantId },
        });
    }

    // Documents
    async addDocument(collectionId: string, data: Partial<KnowledgeDocument>, tenantId: string): Promise<KnowledgeDocument> {
        // Verifica se a coleção pertence ao tenant
        const collection = await this.prisma.knowledgeCollection.findUnique({
            where: { id: collectionId, tenantId }
        });
        if (!collection) throw new Error('Collection not found or access denied');

        const document = await this.prisma.knowledgeDocument.create({
            data: {
                collectionId,
                title: data.title!,
                sourceType: data.sourceType as any,
                sourcePath: data.sourcePath,
                mimeType: data.mimeType,
                rawText: data.rawText,
                checksum: data.checksum,
                status: data.status as any,
                metadata: data.metadata || {},
            },
        });
        return this.mapToDocument(document);
    }

    async getDocument(id: string, tenantId: string): Promise<KnowledgeDocument | null> {
        const document = await this.prisma.knowledgeDocument.findFirst({
            where: {
                id,
                collection: { tenantId }
            },
        });
        return document ? this.mapToDocument(document) : null;
    }

    async listDocuments(collectionId: string, tenantId: string): Promise<KnowledgeDocument[]> {
        const documents = await this.prisma.knowledgeDocument.findMany({
            where: {
                collectionId,
                collection: { tenantId }
            },
        });
        return documents.map(d => this.mapToDocument(d));
    }

    async updateDocument(id: string, data: Partial<KnowledgeDocument>, tenantId: string): Promise<KnowledgeDocument> {
        const document = await this.prisma.knowledgeDocument.update({
            where: {
                id,
                collection: { tenantId }
            },
            data: {
                title: data.title,
                status: data.status as any,
                metadata: data.metadata,
            },
        });
        return this.mapToDocument(document);
    }

    async deleteDocument(id: string, tenantId: string): Promise<void> {
        await this.prisma.knowledgeDocument.delete({
            where: {
                id,
                collection: { tenantId }
            },
        });
    }

    // Chunks
    async storeChunks(documentId: string, chunks: Partial<KnowledgeChunk>[], tenantId: string): Promise<KnowledgeChunk[]> {
        // Validação de Tenant via documento -> coleção
        const doc = await this.prisma.knowledgeDocument.findFirst({
            where: { id: documentId, collection: { tenantId } }
        });
        if (!doc) throw new Error('Document not found or access denied');

        const createdChunks = await Promise.all(
            chunks.map(chunk =>
                this.prisma.knowledgeChunk.create({
                    data: {
                        documentId,
                        ordinal: chunk.ordinal!,
                        content: chunk.content!,
                        tokenEstimate: chunk.tokenEstimate,
                        embeddingRef: chunk.embeddingRef,
                        metadata: chunk.metadata || {},
                    }
                })
            )
        );
        return createdChunks.map(c => this.mapToChunk(c));
    }

    async getChunks(documentId: string, tenantId: string): Promise<KnowledgeChunk[]> {
        const chunks = await this.prisma.knowledgeChunk.findMany({
            where: {
                documentId,
                document: { collection: { tenantId } }
            },
            orderBy: { ordinal: 'asc' },
        });
        return chunks.map(c => this.mapToChunk(c));
    }

    async deleteChunks(documentId: string, tenantId: string): Promise<void> {
        await this.prisma.knowledgeChunk.deleteMany({
            where: {
                documentId,
                document: { collection: { tenantId } }
            },
        });
    }

    async searchDocuments(query: string, tenantId: string, filters: any): Promise<KnowledgeDocument[]> {
        const documents = await this.prisma.knowledgeDocument.findMany({
            where: {
                collection: { tenantId },
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { rawText: { contains: query, mode: 'insensitive' } },
                ],
                ...filters,
            },
        });
        return documents.map(d => this.mapToDocument(d));
    }

    private mapToCollection(p: any): KnowledgeCollection {
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            scopeType: p.scopeType as KnowledgeScopeType,
            scopeId: p.scopeId,
            sourceType: p.sourceType as KnowledgeSourceType,
            status: p.status as KnowledgeStatus,
            metadata: p.metadata as Record<string, any>,
            tenantId: p.tenantId,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }

    private mapToDocument(p: any): KnowledgeDocument {
        return {
            id: p.id,
            collectionId: p.collectionId,
            title: p.title,
            sourceType: p.sourceType as KnowledgeSourceType,
            sourcePath: p.sourcePath,
            mimeType: p.mimeType,
            rawText: p.rawText,
            checksum: p.checksum,
            status: p.status as KnowledgeStatus,
            metadata: p.metadata as Record<string, any>,
            tenantId: p.tenantId || (p.collection ? p.collection.tenantId : 'default'),
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
        };
    }

    private mapToChunk(p: any): KnowledgeChunk {
        return {
            id: p.id,
            documentId: p.documentId,
            ordinal: p.ordinal,
            content: p.content,
            tokenEstimate: p.tokenEstimate,
            embeddingRef: p.embeddingRef,
            metadata: p.metadata as Record<string, any>,
            tenantId: p.tenantId,
            createdAt: p.createdAt,
        };
    }
}
