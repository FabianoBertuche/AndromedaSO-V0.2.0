import { Provider, IProviderRepository } from "@andromeda/core";

export class InMemoryProviderRepository implements IProviderRepository {
    private providers: Map<string, any> = new Map();

    async save(provider: Provider): Promise<void> {
        this.providers.set(provider.getId(), provider.toJSON());
    }

    async findById(id: string): Promise<Provider | null> {
        const data = this.providers.get(id);
        if (!data) return null;
        return new Provider(data);
    }

    async findAll(): Promise<Provider[]> {
        return Array.from(this.providers.values()).map(data => new Provider(data));
    }

    async delete(id: string): Promise<void> {
        this.providers.delete(id);
    }
}
