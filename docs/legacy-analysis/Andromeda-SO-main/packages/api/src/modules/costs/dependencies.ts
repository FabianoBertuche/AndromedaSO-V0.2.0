import { getPrismaClient } from "../../infrastructure/database/prisma";
import { ExportCostsCsvUseCase } from "./application/use-cases/ExportCostsCsvUseCase";
import { GetCostsByAgentUseCase } from "./application/use-cases/GetCostsByAgentUseCase";
import { GetCostsSummaryUseCase } from "./application/use-cases/GetCostsSummaryUseCase";
import { PrismaCostsRepository } from "./infrastructure/PrismaCostsRepository";
import { CostsController } from "./interfaces/http/CostsController";
import { createCostsRouter } from "./interfaces/http/costs.routes";

const prisma = getPrismaClient();

export const costsRepository = new PrismaCostsRepository(prisma);
export const getCostsSummaryUseCase = new GetCostsSummaryUseCase(costsRepository);
export const getCostsByAgentUseCase = new GetCostsByAgentUseCase(costsRepository);
export const exportCostsCsvUseCase = new ExportCostsCsvUseCase(costsRepository);

const costsController = new CostsController(
    getCostsSummaryUseCase,
    getCostsByAgentUseCase,
    exportCostsCsvUseCase,
);

export const costsRouter = createCostsRouter(costsController);
