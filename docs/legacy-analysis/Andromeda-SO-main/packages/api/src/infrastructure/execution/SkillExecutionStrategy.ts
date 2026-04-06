import { Task, ExecutionStrategy, ExecutionResult, SkillRegistry } from "@andromeda/core";
import { SandboxedSkillExecutor } from "../skills/SandboxedSkillExecutor";
import { isExecutableSkill } from "../skills/SkillMetadata";

export class SkillExecutionStrategy implements ExecutionStrategy {
    constructor(
        private readonly skillRegistry: SkillRegistry,
        private readonly executeSkillUseCase: SandboxedSkillExecutor
    ) { }

    async execute(task: Task): Promise<ExecutionResult> {
        try {
            // Busca a skill baseada na task
            const skills = (await this.skillRegistry.searchByCapability(task.getRawRequest())).filter(isExecutableSkill);
            if (skills.length === 0) {
                return { success: false, data: null, strategyUsed: this.getIdentifier(), error: "Nenhuma skill encontrada" };
            }

            const skill = skills[0]; // Pega a primeira correspondência no MVP

            // Simulação simples de extração de parâmetros do raw request
            // No futuro, isso seria feito por um parser ou LLM Structurer
            const input = task.getMetadata()?.input || {};

            const result = await this.executeSkillUseCase.execute(skill, input, {
                taskId: task.getId(),
                metadata: task.getMetadata(),
            });

            return {
                success: true,
                data: result,
                strategyUsed: this.getIdentifier(),
            };
        } catch (error: any) {
            return {
                success: false,
                data: null,
                strategyUsed: this.getIdentifier(),
                error: error.message,
            };
        }
    }

    getIdentifier(): string {
        return "skill-strategy-v0";
    }
}
