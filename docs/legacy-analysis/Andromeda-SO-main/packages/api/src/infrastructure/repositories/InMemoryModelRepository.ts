import { ModelCatalogItem, IModelRepository } from "@andromeda/core";

export class InMemoryModelRepository implements IModelRepository {
    private models: Map<string, any> = new Map();

    async save(model: ModelCatalogItem): Promise<void> {
        this.models.set(model.getId(), model.toJSON());
    }

    async findById(id: string): Promise<ModelCatalogItem | null> {
        const data = this.models.get(id);
        if (!data) return null;
        return new ModelCatalogItem(data);
    }

    async findByProvider(providerId: string): Promise<ModelCatalogItem[]> {
        return Array.from(this.models.values())
            .filter(data => data.providerId === providerId)
            .map(data => new ModelCatalogItem(data));
    }

    async findByExternalId(externalId: string): Promise<ModelCatalogItem | null> {
        const data = Array.from(this.models.values()).find(d => d.externalModelId === externalId);
        if (!data) return null;
        return new ModelCatalogItem(data);
    }

    async findAll(): Promise<ModelCatalogItem[]> {
        return Array.from(this.models.values()).map(data => new ModelCatalogItem(data));
    }

    async delete(id: string): Promise<void> {
        this.models.delete(id);
    }
}
