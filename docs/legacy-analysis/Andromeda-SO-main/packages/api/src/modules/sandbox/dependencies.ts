import { createSystemSandboxProfiles } from "./domain/presets";
import { hasPrismaDatabaseUrl, getPrismaClient } from "../../infrastructure/database/prisma";
import {
    FileAgentSandboxConfigRepository,
    FileApprovalRequestRepository,
    FileSandboxArtifactRepository,
    FileSandboxExecutionRepository,
    FileSandboxProfileRepository,
} from "./infrastructure/FileSandboxRepositories";
import {
    PrismaAgentSandboxConfigRepository,
    PrismaApprovalRequestRepository,
    PrismaSandboxArtifactRepository,
    PrismaSandboxExecutionRepository,
    PrismaSandboxProfileRepository,
    ensureSystemSandboxProfiles,
} from "./infrastructure/PrismaSandboxRepositories";
import { ProcessSandboxRunner } from "./infrastructure/ProcessSandboxRunner";
import { SandboxService } from "./application/SandboxService";
import { createSandboxRouter } from "./interfaces/http/sandbox.routes";

const usePrismaSandbox = process.env.ANDROMEDA_SANDBOX_STORAGE === "prisma" || hasPrismaDatabaseUrl();
const prismaClient = usePrismaSandbox ? getPrismaClient() : undefined;

export const sandboxProfileRepository = usePrismaSandbox && prismaClient
    ? new PrismaSandboxProfileRepository(prismaClient)
    : new FileSandboxProfileRepository();
export const agentSandboxConfigRepository = usePrismaSandbox && prismaClient
    ? new PrismaAgentSandboxConfigRepository(prismaClient)
    : new FileAgentSandboxConfigRepository();
export const sandboxExecutionRepository = usePrismaSandbox && prismaClient
    ? new PrismaSandboxExecutionRepository(prismaClient)
    : new FileSandboxExecutionRepository();
export const sandboxArtifactRepository = usePrismaSandbox && prismaClient
    ? new PrismaSandboxArtifactRepository(prismaClient)
    : new FileSandboxArtifactRepository();
export const approvalRequestRepository = usePrismaSandbox && prismaClient
    ? new PrismaApprovalRequestRepository(prismaClient)
    : new FileApprovalRequestRepository();
export const sandboxRunner = new ProcessSandboxRunner();

export const sandboxService = new SandboxService(
    sandboxProfileRepository,
    agentSandboxConfigRepository,
    sandboxExecutionRepository,
    sandboxArtifactRepository,
    approvalRequestRepository,
    undefined,
    undefined,
    undefined,
    undefined,
    sandboxRunner,
);

export const sandboxRouter = createSandboxRouter(sandboxService);

void bootstrapSandboxProfiles();

async function bootstrapSandboxProfiles() {
    if (usePrismaSandbox) {
        await ensureSystemSandboxProfiles(sandboxProfileRepository, createSystemSandboxProfiles());
        return;
    }

    const existing = await sandboxProfileRepository.list();
    if (existing.length > 0) {
        return;
    }

    for (const profile of createSystemSandboxProfiles()) {
        await sandboxProfileRepository.save(profile);
    }
}
