import { Task } from "@andromeda/core";
import { AgentConformanceReport, AgentExecutionPrecheck, AgentProfile } from "../domain/agent-profile";
import { AgentPromptAssembler, AgentPromptAssembly } from "./AgentPromptAssembler";
import { AgentProfileService } from "./AgentProfileService";
import { AgentSafeguardService } from "./AgentSafeguardService";
import { BehaviorEvaluationService } from "./BehaviorEvaluationService";
import { MemoryService } from "../../memory/application/MemoryService";

export interface PreparedAgentExecution {
    profile: AgentProfile;
    assembly: AgentPromptAssembly;
    precheck: AgentExecutionPrecheck;
}

export class AgentRuntimeOrchestrator {
    constructor(
        private readonly profileService: AgentProfileService,
        private readonly promptAssembler = new AgentPromptAssembler(),
        private readonly safeguardService = new AgentSafeguardService(),
        private readonly behaviorEvaluationService = new BehaviorEvaluationService(),
        private readonly memoryService?: MemoryService,
    ) { }

    async prepareExecution(task: Task): Promise<PreparedAgentExecution> {
        const metadata = task.getMetadata();
        const profile = await this.profileService.getActiveProfile(asOptionalString(metadata.targetAgentId));
        const memoryContext = this.memoryService
            ? await this.memoryService.attachMemoryToExecutionContext({
                taskId: task.getId(),
                agentId: asOptionalString(metadata.targetAgentId),
                sessionId: asOptionalString(metadata.sessionId) || task.getSessionId(),
                projectId: asOptionalString(metadata.targetProjectId),
                userId: asOptionalString(metadata.userId),
                teamId: asOptionalString(metadata.targetTeamId),
                interactionMode: asOptionalString(metadata.interactionMode) || "chat",
                prompt: task.getRawRequest(),
                limit: 6,
            })
            : { entries: [], blocks: [] };
        const assembly = this.promptAssembler.build(profile, {
            userPrompt: task.getRawRequest(),
            sessionId: asOptionalString(metadata.sessionId) || task.getSessionId(),
            interactionMode: asOptionalString(metadata.interactionMode) || "chat",
            memoryBlocks: memoryContext.blocks,
        });
        const precheck = this.safeguardService.evaluateBeforeExecution(profile, task.getRawRequest());

        return {
            profile,
            assembly,
            precheck,
        };
    }

    buildBlockedResponse(prepared: PreparedAgentExecution) {
        const fallbackContent = prepared.precheck.fallbackContent
            || this.safeguardService.buildCorrectiveResponse(prepared.profile, "", "fallback");

        const audit: AgentConformanceReport = {
            ...this.behaviorEvaluationService.evaluate({
                profile: prepared.profile,
                userPrompt: "",
                responseText: fallbackContent,
                selectedModel: "safeguard:fallback",
                behaviorSnapshot: prepared.assembly.behaviorSnapshot,
                precheck: prepared.precheck,
            }),
            status: "blocked",
            actionTaken: "fallback:block_out_of_role",
        };

        return {
            content: fallbackContent,
            audit,
            agent: {
                id: prepared.profile.id,
                name: prepared.profile.identity.name,
                role: prepared.profile.identity.role,
                version: prepared.profile.version,
            },
        };
    }

    finalizeExecution(input: {
        task: Task;
        prepared: PreparedAgentExecution;
        responseText: string;
        modelName: string;
    }) {
        const { prepared, responseText, modelName } = input;

        const audit = this.behaviorEvaluationService.evaluate({
            profile: prepared.profile,
            userPrompt: input.task.getRawRequest(),
            responseText,
            selectedModel: modelName,
            behaviorSnapshot: prepared.assembly.behaviorSnapshot,
            precheck: prepared.precheck,
        });

        let finalContent = responseText;
        if (audit.overallConformanceScore < prepared.profile.safeguards.minOverallConformance) {
            finalContent = this.safeguardService.buildCorrectiveResponse(
                prepared.profile,
                responseText,
                prepared.profile.safeguards.correctiveAction,
            );

            if (prepared.profile.safeguards.correctiveAction === "fallback" || prepared.profile.safeguards.correctiveAction === "block") {
                audit.status = "blocked";
            }
            audit.actionTaken = prepared.profile.safeguards.correctiveAction;
        }

        return {
            content: finalContent,
            audit,
            agent: {
                id: prepared.profile.id,
                name: prepared.profile.identity.name,
                role: prepared.profile.identity.role,
                version: prepared.profile.version,
            },
        };
    }
}

function asOptionalString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}
