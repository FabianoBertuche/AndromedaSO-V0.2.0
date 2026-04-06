import { Request, Response } from "express";
import { globalBenchmarkRepository } from "../../../../infrastructure/repositories/GlobalRepositories";
import { sendError } from "../../../../shared/http/error-response";
import { runBenchmarkUseCase } from "../../dependencies";

export class BenchmarkController {
    async run(req: Request, res: Response) {
        try {
            const result = await runBenchmarkUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (error: any) {
            return sendError(req, res, 400, "BAD_REQUEST", error.message);
        }
    }

    async list(req: Request, res: Response) {
        try {
            const results = await globalBenchmarkRepository.findByModelId(req.params.modelId);
            return res.json(results);
        } catch (error: any) {
            return sendError(req, res, 500, "INTERNAL_SERVER_ERROR", error.message);
        }
    }
}
