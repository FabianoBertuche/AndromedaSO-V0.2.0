import { globalTaskRepository } from "../../infrastructure/repositories/GlobalRepositories";
import { AgentProfileService } from "./application/AgentProfileService";
import { AgentVersioningService } from "./application/AgentVersioningService";
import { AgentPromptAssembler } from "./application/AgentPromptAssembler";
import { AgentRuntimeOrchestrator } from "./application/AgentRuntimeOrchestrator";
import { RuntimeAgentConversationService } from "./application/RuntimeAgentConversationService";
import { createDefaultAgentProfile } from "./domain/agent-profile";
import { FileBackedAgentRegistry } from "./infrastructure/FileBackedAgentRegistry";
import { FileSystemAgentProfileRepository } from "./infrastructure/FileSystemAgentProfileRepository";
import { PrismaAgentProfileRepository } from "./infrastructure/PrismaAgentProfileRepository";
import { PrismaAgentVersionRepository } from "./infrastructure/PrismaAgentVersionRepository";
import { AgentMigrationService } from "./infrastructure/AgentMigrationService";
import { createAgentManagementRouter } from "./interfaces/http/agent-management.routes";
import { getPrismaClient } from "../../infrastructure/database/prisma";

const prisma = getPrismaClient();

export const agentProfileRepository = process.env.DATABASE_URL
    ? new PrismaAgentProfileRepository(prisma)
    : new FileSystemAgentProfileRepository();

export const agentVersionRepository = new PrismaAgentVersionRepository(prisma);
export const agentVersioningService = new AgentVersioningService(agentVersionRepository);
export const agentPromptAssembler = new AgentPromptAssembler();
export const agentProfileService = new AgentProfileService(agentProfileRepository, globalTaskRepository, agentVersioningService);
export const agentRuntimeOrchestrator = new AgentRuntimeOrchestrator(agentProfileService, agentPromptAssembler);
export const globalAgentRegistry = new FileBackedAgentRegistry(agentProfileService, agentPromptAssembler);
export const agentConversationService = new RuntimeAgentConversationService(globalTaskRepository, globalAgentRegistry);
export const agentManagementRouter = createAgentManagementRouter({
    profileService: agentProfileService,
    conversationService: agentConversationService,
});

export async function runAgentMigration(): Promise<void> {
    if (!process.env.DATABASE_URL) {
        console.log("Skipping agent migration: DATABASE_URL not set.");
        return;
    }

    const fsRepo = new FileSystemAgentProfileRepository();
    const dbRepo = new PrismaAgentProfileRepository(prisma);
    const migrationService = new AgentMigrationService(dbRepo);

    const existingAgents = await dbRepo.list();
    if (existingAgents.length > 0) {
        console.log(`Agent migration already completed: ${existingAgents.length} agents in database.`);
        return;
    }

    console.log("Running one-time agent migration from filesystem to database...");
    const result = await migrationService.migrate({ createBackup: true });
    console.log(`Migration complete: ${result.migrated.length} agents migrated, ${result.skipped.length} skipped, ${result.errors.length} errors.`);
}

void bootstrapDefaultAgentProfiles();

async function bootstrapDefaultAgentProfiles() {
    const existing = await agentProfileRepository.list();
    if (existing.length > 0) {
        return;
    }

    const kernel = createDefaultAgentProfile({
        id: "kernel-agent",
        name: "Andromeda Kernel",
        role: "Operational orchestrator",
        description: "Coordinates work across the platform and preserves system coherence.",
        teamId: "team-core",
        category: "orchestration",
        type: "orchestrator",
        defaultModel: "automatic-router",
        isDefault: true,
        specializations: ["planning", "coordination", "coding", "research"],
    });
    kernel.persona.proactivity = 88;
    kernel.persona.feedbackFrequency = 90;
    kernel.safeguards.alwaysProvideIntermediateFeedback = true;

    const executor = createDefaultAgentProfile({
        id: "executor-agent",
        name: "Execution Specialist",
        role: "Technical executor",
        description: "Implements TypeScript and backend changes with strict delivery discipline.",
        teamId: "team-core",
        category: "delivery",
        type: "executor",
        defaultModel: "automatic-router",
        specializations: ["coding", "testing", "websocket", "api"],
    });
    executor.persona.objectivity = 90;
    executor.persona.creativity = 38;
    executor.persona.playbookStrictness = 86;

    const auditor = createDefaultAgentProfile({
        id: "auditor-agent",
        name: "Assurance Auditor",
        role: "Security auditor",
        description: "Reviews risky changes, contracts, and safeguards before approval.",
        teamId: "team-trust",
        category: "audit",
        type: "auditor",
        defaultModel: "automatic-router",
        specializations: ["security", "audit", "review", "compliance"],
    });
    auditor.persona.caution = 92;
    auditor.persona.evidenceRequirements = 90;
    auditor.safeguards.mode = "strict";
    auditor.safeguards.blockOutOfRoleResponses = true;
    auditor.safeguards.correctiveAction = "fallback";

    const brainstormer = createDefaultAgentProfile({
        id: "brainstorm-agent",
        name: "Concept Catalyst",
        role: "Creative brainstormer",
        description: "Explores alternatives, ideation paths, and product concepts.",
        teamId: "team-labs",
        category: "ideation",
        type: "brainstormer",
        defaultModel: "automatic-router",
        specializations: ["creative", "brainstorm", "research", "planning"],
    });
    brainstormer.persona.creativity = 92;
    brainstormer.persona.ambiguityTolerance = 82;
    brainstormer.persona.formality = 42;
    brainstormer.safeguards.mode = "flexible";

    await agentProfileRepository.save(kernel, { summary: "bootstrap default profile" });
    await agentProfileRepository.save(executor, { summary: "bootstrap default profile" });
    await agentProfileRepository.save(auditor, { summary: "bootstrap default profile" });
    await agentProfileRepository.save(brainstormer, { summary: "bootstrap default profile" });
}
