import { ModelCatalogItem } from "./ModelCatalogItem";

export interface IModelRepository {
    save(model: ModelCatalogItem): Promise<void>;
    findById(id: string): Promise<ModelCatalogItem | null>;
    findByProvider(providerId: string): Promise<ModelCatalogItem[]>;
    findByExternalId(externalId: string): Promise<ModelCatalogItem | null>;
    findAll(): Promise<ModelCatalogItem[]>;
    delete(id: string): Promise<void>;
}
