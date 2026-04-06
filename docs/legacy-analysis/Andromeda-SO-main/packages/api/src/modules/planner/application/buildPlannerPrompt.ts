import { PlannerAgentSummary } from "../domain/ports";

export function buildPlannerPrompt(goal: string, agents: PlannerAgentSummary[]): string {
    const agentsWithCapabilities = agents
        .map((agent) => `- ${agent.id}: ${agent.name} | capabilities: ${agent.capabilities.join(", ") || "general"}`)
        .join("\n");

    return [
        "Voce e um PlannerAgent do Andromeda OS.",
        "Decomponha a tarefa abaixo em etapas atomicas e retorne SOMENTE JSON valido.",
        "",
        `Tarefa: ${goal}`,
        `Agentes disponiveis:\n${agentsWithCapabilities}`,
        "",
        "Retorne exatamente neste formato:",
        "{",
        '  "title": "string",',
        '  "description": "string",',
        '  "requiresApproval": boolean,',
        '  "steps": [',
        "    {",
        '      "stepIndex": number,',
        '      "title": "string",',
        '      "description": "string",',
        '      "agentId": "string",',
        '      "skillId": "string | null",',
        '      "dependsOn": ["stepIndex_anterior"],',
        '      "canRunParallel": boolean,',
        '      "requiresApproval": boolean,',
        '      "continuationInstructions": "string",',
        '      "expectedOutputFormat": "string"',
        "    }",
        "  ]",
        "}",
        "",
        "Regras:",
        "- Maximo 10 etapas por plano",
        "- Cada etapa atribuida a UM agente",
        "- dependsOn so referencia stepIndex anteriores (sem ciclos)",
        "- Etapas sem dependencias podem ter canRunParallel: true",
        "- requiresApproval: true apenas em acoes destrutivas ou irreversiveis",
    ].join("\n");
}
