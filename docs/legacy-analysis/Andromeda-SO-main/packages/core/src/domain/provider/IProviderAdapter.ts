import { Provider } from "./Provider";
import { ModelCatalogItemProps } from "../model/ModelCatalogItem";

export interface ProviderHealth {
    status: "ok" | "error" | "warning" | "unknown";
    message?: string;
}

export interface IProviderAdapter {
    healthCheck(provider: Provider): Promise<ProviderHealth>;
    listModels(provider: Provider): Promise<Partial<ModelCatalogItemProps>[]>;
    pullModel(provider: Provider, modelName: string, onProgress?: (progress: any) => void): Promise<void>;
    pushModel(provider: Provider, modelName: string, onProgress?: (progress: any) => void): Promise<void>;
    createModel(provider: Provider, name: string, modelfile: string, onProgress?: (progress: any) => void): Promise<void>;
    deleteModel(provider: Provider, modelName: string): Promise<void>;
    copyModel(provider: Provider, source: string, destination: string): Promise<void>;
    showModelInfo(provider: Provider, modelName: string): Promise<any>;
    listRunningModels(provider: Provider): Promise<any[]>;
    generate(provider: Provider, params: any): Promise<any>;
    chat(provider: Provider, params: any): Promise<any>;
    embed(provider: Provider, params: any): Promise<any>;
    getVersion(provider: Provider): Promise<string>;
}
