import { ExecuteSkill, Skill, SkillType } from "@andromeda/core";
import { SandboxService } from "../../modules/sandbox/application/SandboxService";

export interface SkillExecutionContext {
    taskId?: string;
    agentId?: string;
    metadata?: Record<string, unknown>;
}

export class SandboxedSkillExecutor {
    constructor(
        private readonly sandboxService: SandboxService,
        private readonly fallbackExecutor = new ExecuteSkill(),
    ) { }

    async execute(skill: Skill, input: any, context: SkillExecutionContext = {}): Promise<any> {
        const skillCode = skill.getCode();
        if (skill.getType() !== SkillType.SCRIPT || !skillCode) {
            return this.fallbackExecutor.execute(skill, input);
        }

        const execution = await this.sandboxService.startExecution({
            agentId: context.agentId || "skill-runtime",
            capability: "skill",
            command: [process.execPath, "-e", buildNodeScript()],
            taskId: context.taskId,
            skillId: skill.getId(),
            temporaryOverrides: {
                filesystem: {
                    workingDirectory: process.cwd(),
                    allowedReadPaths: [process.cwd()],
                    allowedWritePaths: [],
                },
                environment: {
                    envVars: {
                        ANDROMEDA_SKILL_INPUT: JSON.stringify(input ?? {}),
                        ANDROMEDA_SKILL_CONTEXT: JSON.stringify(context.metadata ?? {}),
                        ANDROMEDA_SKILL_CODE: skillCode,
                    },
                },
            },
        });

        const parsed = parseExecutionOutput(execution.execution.stdout || "");

        return {
            status: execution.execution.status,
            skillId: skill.getId(),
            executionId: execution.execution.id,
            output: parsed?.result ?? execution.execution.stdout ?? "",
            stdout: execution.execution.stdout ?? "",
            stderr: execution.execution.stderr ?? "",
            artifacts: execution.artifacts,
            approvalRequest: execution.approvalRequest || null,
        };
    }
}

function buildNodeScript(): string {
    return `
(async () => {
  const input = JSON.parse(process.env.ANDROMEDA_SKILL_INPUT || "{}");
  const context = JSON.parse(process.env.ANDROMEDA_SKILL_CONTEXT || "{}");
  const code = process.env.ANDROMEDA_SKILL_CODE || "";
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const runner = new AsyncFunction("input", "context", "result", \`
"use strict";
\${code}
return typeof result === "undefined" ? null : result;
\`);
  const result = await runner(input, context, undefined);
  const payload = JSON.stringify({
    result,
  });
  process.stdout.write("\\n__ANDROMEDA_SKILL_RESULT__=" + payload + "\\n");
})().catch((error) => {
  console.error(error && error.stack ? error.stack : error.message);
  process.exit(1);
});
`;
}

function parseExecutionOutput(output: string): { result: unknown } | null {
    const marker = "__ANDROMEDA_SKILL_RESULT__=";
    const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const markerLine = [...lines].reverse().find((line) => line.startsWith(marker));
    if (!markerLine) {
        return null;
    }

    try {
        return JSON.parse(markerLine.slice(marker.length)) as { result: unknown };
    } catch {
        return null;
    }
}
