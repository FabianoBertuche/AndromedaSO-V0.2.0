import { Request, Response } from "express";
import { globalModelRepository, globalProviderRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { sendError } from "../../../../shared/http/error-response";
import { registerProviderUseCase, syncModelsUseCase } from "../../dependencies";

export class ModelCatalogController {
    async list(req: Request, res: Response) {
        try {
            let models = await globalModelRepository.findAll();

            if (models.length === 0) {
                const providerId = await this.ensureDefaultProvider();
                try {
                    await syncModelsUseCase.execute({ providerId });
                    models = await globalModelRepository.findAll();
                } catch {
                    // Keep the catalog empty when the default provider is unavailable.
                }
            }

            return res.json(models);
        } catch (error: any) {
            return sendError(req, res, 500, "INTERNAL_SERVER_ERROR", error.message);
        }
    }

    async get(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const model = await globalModelRepository.findById(id) || await globalModelRepository.findByExternalId(id);

            if (!model) {
                return sendError(req, res, 404, "NOT_FOUND", "Modelo nao encontrado");
            }

            return res.json(model);
        } catch (error: any) {
            return sendError(req, res, 500, "INTERNAL_SERVER_ERROR", error.message);
        }
    }

    private async ensureDefaultProvider(): Promise<string> {
        const providers = await globalProviderRepository.findAll();
        const existing = providers.find(provider => provider.getType() === "ollama");
        if (existing) {
            return existing.getId();
        }

        const provider = await registerProviderUseCase.execute({
            name: "Ollama Local",
            type: "ollama",
            baseUrl: "http://localhost:11434",
            metadata: {
                locality: "local",
            },
        });

        return provider.getId();
    }
}
