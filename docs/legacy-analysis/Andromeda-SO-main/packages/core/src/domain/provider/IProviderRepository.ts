import { Provider } from "./Provider";

export interface IProviderRepository {
    save(provider: Provider): Promise<void>;
    findById(id: string): Promise<Provider | null>;
    findAll(): Promise<Provider[]>;
    delete(id: string): Promise<void>;
}
