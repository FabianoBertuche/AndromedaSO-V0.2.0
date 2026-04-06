import { hasPrismaDatabaseUrl, getPrismaClient } from "../../infrastructure/database/prisma";
import { MemoryService } from "./application/MemoryService";
import { createDefaultMemoryPolicies } from "./domain/defaults";
import { InMemoryMemoryRepositoryBundle } from "./infrastructure/InMemoryMemoryRepository";
import { PrismaMemoryRepositoryBundle } from "./infrastructure/MemoryRepository";
import { createMemoryRouter } from "./interfaces/http/memory.routes";

const usePrismaMemory = process.env.ANDROMEDA_MEMORY_STORAGE === "prisma" || hasPrismaDatabaseUrl();
const prismaClient = usePrismaMemory ? getPrismaClient() : undefined;

const repositories = usePrismaMemory && prismaClient
    ? new PrismaMemoryRepositoryBundle(prismaClient)
    : new InMemoryMemoryRepositoryBundle();

export const memoryService = new MemoryService(repositories);
export const memoryRouter = createMemoryRouter(memoryService);

void bootstrapMemory();

async function bootstrapMemory() {
    if (repositories instanceof InMemoryMemoryRepositoryBundle) {
        for (const policy of createDefaultMemoryPolicies()) {
            await repositories.upsertPolicy(policy);
        }
        return;
    }

    await memoryService.ensureDefaultPolicies();
}
