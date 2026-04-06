import { Task } from "@andromeda/core";
import { discoverLocalAgentAssets, LocalAgentAssetDiagnostics, LocalAgentAssetItem } from "./LocalAgentAssetDiscovery";

export interface AppliedAgentAssets {
    discoveredAt: string;
    strategyUsed?: string;
    agents: LocalAgentAssetItem[];
    rules: LocalAgentAssetItem[];
    workflows: LocalAgentAssetItem[];
    skills: LocalAgentAssetItem[];
    matchedBy: {
        agent: string[];
        workflow: string[];
        skills: string[];
    };
    resolvedAgent?: {
        id?: string;
        name?: string;
        role?: string;
        version?: string;
        matchedLocalAgent?: LocalAgentAssetItem;
    };
}

export async function buildAppliedAgentAssets(task: Task, strategyUsed?: string): Promise<AppliedAgentAssets> {
    const assets = await discoverLocalAgentAssets();
    return buildAppliedAgentAssetsFromDiagnostics(task, assets, strategyUsed);
}

export function buildAppliedAgentAssetsFromDiagnostics(
    task: Task,
    assets: LocalAgentAssetDiagnostics,
    strategyUsed?: string,
): AppliedAgentAssets {
    const metadata = task.getMetadata();
    const rawRequest = task.getRawRequest();
    const normalizedRequest = normalize(rawRequest);
    const agentCandidates = collectAgentCandidates(metadata);
    const workflowCandidates = collectWorkflowCandidates(rawRequest, metadata);
    const explicitSkillCandidates = collectSkillCandidates(metadata);
    const agents = assets.agents.filter((agent) => agentCandidates.has(normalize(agent.name)));
    const declaredAgentSkills = new Set(
        agents.flatMap((agent) => (agent.skills || []).map((skill) => normalize(skill))),
    );

    const workflows = assets.workflows.filter((workflow) => workflowCandidates.has(normalize(workflow.name)));
    const skills = assets.skills.filter((skill) => {
        const skillName = normalize(skill.name);
        const folderName = normalize(lastSegment(skill.relativePath.replace(/\\/g, "/").replace(/\/SKILL\.md$/i, "")));
        return explicitSkillCandidates.has(skillName)
            || explicitSkillCandidates.has(folderName)
            || declaredAgentSkills.has(skillName)
            || declaredAgentSkills.has(folderName)
            || normalizedRequest.includes(skillName)
            || normalizedRequest.includes(folderName);
    });

    return {
        discoveredAt: new Date().toISOString(),
        strategyUsed,
        agents,
        rules: assets.rules,
        workflows,
        skills,
        matchedBy: {
            agent: Array.from(agentCandidates).sort(),
            workflow: Array.from(workflowCandidates).sort(),
            skills: Array.from(explicitSkillCandidates).sort(),
        },
        resolvedAgent: resolveRuntimeAgent(metadata, assets.agents),
    };
}

function collectAgentCandidates(metadata: Record<string, any>): Set<string> {
    const candidates = new Set<string>();
    const add = (value: unknown) => {
        if (typeof value !== "string") {
            return;
        }

        const normalized = normalize(value);
        if (normalized) {
            candidates.add(normalized);
        }
    };

    add(metadata.targetAgentId);
    add(metadata.agentId);
    add(metadata.personaProfileId);
    add(metadata.agentName);
    add(metadata.resolvedAgent?.id);
    add(metadata.resolvedAgent?.name);

    return candidates;
}

function resolveRuntimeAgent(metadata: Record<string, any>, agents: LocalAgentAssetItem[]) {
    const resolvedAgent = metadata.resolvedAgent;
    if (!resolvedAgent || typeof resolvedAgent !== "object") {
        return undefined;
    }

    const resolvedId = typeof resolvedAgent.id === "string" ? normalize(resolvedAgent.id) : undefined;
    const resolvedName = typeof resolvedAgent.name === "string" ? normalize(resolvedAgent.name) : undefined;
    const matchedLocalAgent = agents.find((agent) => {
        const agentName = normalize(agent.name);
        return agentName === resolvedId || agentName === resolvedName;
    });

    return {
        id: typeof resolvedAgent.id === "string" ? resolvedAgent.id : undefined,
        name: typeof resolvedAgent.name === "string" ? resolvedAgent.name : undefined,
        role: typeof resolvedAgent.role === "string" ? resolvedAgent.role : undefined,
        version: typeof resolvedAgent.version === "string" ? resolvedAgent.version : undefined,
        matchedLocalAgent,
    };
}

function collectWorkflowCandidates(rawRequest: string, metadata: Record<string, any>): Set<string> {
    const candidates = new Set<string>();
    const add = (value: unknown) => {
        if (typeof value !== "string") {
            return;
        }

        const normalized = normalize(value.replace(/^\//, "").replace(/\.md$/i, ""));
        if (normalized) {
            candidates.add(normalized);
        }
    };

    add(metadata.workflow);
    add(metadata.command);
    add(metadata.inferredWorkflow);
    add(metadata.routing?.inferredWorkflow);
    add(metadata.execution?.workflowName);

    const slashMatch = rawRequest.trim().match(/^\/([^\s]+)/);
    if (slashMatch) {
        add(slashMatch[1]);
    }

    return candidates;
}

function collectSkillCandidates(metadata: Record<string, any>): Set<string> {
    const candidates = new Set<string>();
    const add = (value: unknown) => {
        if (typeof value !== "string") {
            return;
        }

        const normalized = normalize(value);
        if (normalized) {
            candidates.add(normalized);
        }
    };

    add(metadata.skill);
    add(metadata.skillName);
    add(metadata.skillId);

    if (Array.isArray(metadata.appliedSkillNames)) {
        for (const value of metadata.appliedSkillNames) {
            add(value);
        }
    }

    return candidates;
}

function normalize(value: string): string {
    return value.trim().toLowerCase();
}

function lastSegment(value: string): string {
    const segments = value.split("/").filter(Boolean);
    return segments[segments.length - 1] || value;
}
