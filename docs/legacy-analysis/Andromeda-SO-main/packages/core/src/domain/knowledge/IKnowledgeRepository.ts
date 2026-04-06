import { KnowledgeCollection, KnowledgeDocument, KnowledgeChunk, KnowledgeScopeType } from "./types";

export interface IKnowledgeRepository {
    // Collections
    createCollection(data: Partial<KnowledgeCollection>, tenantId: string): Promise<KnowledgeCollection>;
    getCollection(id: string, tenantId: string): Promise<KnowledgeCollection | null>;
    listCollections(tenantId: string, filters: { scopeType?: KnowledgeScopeType, scopeId?: string }): Promise<KnowledgeCollection[]>;
    updateCollection(id: string, data: Partial<KnowledgeCollection>, tenantId: string): Promise<KnowledgeCollection>;
    deleteCollection(id: string, tenantId: string): Promise<void>;

    // Documents
    addDocument(collectionId: string, data: Partial<KnowledgeDocument>, tenantId: string): Promise<KnowledgeDocument>;
    getDocument(id: string, tenantId: string): Promise<KnowledgeDocument | null>;
    listDocuments(collectionId: string, tenantId: string): Promise<KnowledgeDocument[]>;
    updateDocument(id: string, data: Partial<KnowledgeDocument>, tenantId: string): Promise<KnowledgeDocument>;
    deleteDocument(id: string, tenantId: string): Promise<void>;

    // Chunks
    storeChunks(documentId: string, chunks: Partial<KnowledgeChunk>[], tenantId: string): Promise<KnowledgeChunk[]>;
    getChunks(documentId: string, tenantId: string): Promise<KnowledgeChunk[]>;
    deleteChunks(documentId: string, tenantId: string): Promise<void>;

    // Search (Basic Metadata search)
    searchDocuments(query: string, tenantId: string, filters: any): Promise<KnowledgeDocument[]>;
}
