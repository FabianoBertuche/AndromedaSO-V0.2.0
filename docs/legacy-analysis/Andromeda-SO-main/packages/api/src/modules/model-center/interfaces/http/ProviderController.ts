import { Request, Response } from "express";
import {
    copyModelUseCase,
    createModelUseCase,
    deleteModelUseCase,
    listRunningModelsUseCase,
    pullModelUseCase,
    registerProviderUseCase,
    showModelInfoUseCase,
    syncModelsUseCase,
} from "../../dependencies";
import { globalProviderRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { sendError } from "../../../../shared/http/error-response";

export class ProviderController {
    async register(req: Request, res: Response) {
        try {
            const provider = await registerProviderUseCase.execute(req.body);
            return res.status(201).json(provider);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async list(req: Request, res: Response) {
        try {
            const providers = await globalProviderRepository.findAll();
            return res.json(providers);
        } catch (error: any) {
            return sendError(req, res, 500, "INTERNAL_SERVER_ERROR", error.message);
        }
    }

    async syncModels(req: Request, res: Response) {
        try {
            const providerId = await this.ensureProviderId(req.params.id);
            const models = await syncModelsUseCase.execute({ providerId });
            return res.json(models);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async pullModel(req: Request, res: Response) {
        try {
            const providerId = await this.ensureProviderId(req.params.id);
            const { modelName } = req.body;

            await pullModelUseCase.execute({
                providerId,
                modelName,
            });

            return res.json({ message: `Model ${modelName} pulled successfully` });
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async deleteModel(req: Request, res: Response) {
        try {
            const providerId = await this.ensureProviderId(req.params.id);
            const { modelName } = req.params;
            await deleteModelUseCase.execute({ providerId, modelName });
            return res.status(204).send();
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async listRunningModels(req: Request, res: Response) {
        try {
            const providerId = await this.ensureProviderId(req.params.id);
            const models = await listRunningModelsUseCase.execute({ providerId });
            return res.json(models);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async showModelInfo(req: Request, res: Response) {
        try {
            const providerId = await this.ensureProviderId(req.params.id);
            const { modelName } = req.params;
            const info = await showModelInfoUseCase.execute({ providerId, modelName });
            return res.json(info);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async createModel(req: Request, res: Response) {
        try {
            const providerId = await this.ensureProviderId(req.params.id);
            const { name, modelfile } = req.body;
            await createModelUseCase.execute({ providerId, name, modelfile });
            return res.status(201).json({ message: `Model ${name} created successfully` });
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async copyModel(req: Request, res: Response) {
        try {
            const providerId = await this.ensureProviderId(req.params.id);
            const { source, destination } = req.body;
            await copyModelUseCase.execute({ providerId, source, destination });
            return res.json({ message: `Model copied from ${source} to ${destination}` });
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    private async ensureProviderId(id: string): Promise<string> {
        const providers = await globalProviderRepository.findAll();
        if (id === "ollama-local-id" && providers.length === 0) {
            await registerProviderUseCase.execute({
                name: "Ollama Local",
                type: "ollama",
                baseUrl: "http://localhost:11434",
                metadata: {
                    locality: "local",
                },
            });

            const nextProviders = await globalProviderRepository.findAll();
            return nextProviders[0].getId();
        }

        if (id === "ollama-local-id") {
            const localProvider = providers.find(provider => this.isLocalProvider(provider.getBaseUrl(), provider.getMetadata()));
            if (localProvider) {
                return localProvider.getId();
            }
        }

        return id;
    }

    private isLocalProvider(baseUrl: string, metadata?: Record<string, any>): boolean {
        if (metadata?.locality === "local") {
            return true;
        }

        try {
            const host = new URL(baseUrl).hostname.toLowerCase();
            return ["localhost", "127.0.0.1", "::1"].includes(host);
        } catch {
            return false;
        }
    }
}
