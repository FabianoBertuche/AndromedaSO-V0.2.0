import { Skill, SkillType } from "@andromeda/core";
import { LocalAgentAssetDiagnostics } from "../agent-assets/LocalAgentAssetDiscovery";

type SkillSchema = Record<string, unknown>;

export function isExecutableSkill(skill: Skill): boolean {
    const executionMode = readSchemaValue(skill, "executionMode");

    if (executionMode === "instructional") {
        return false;
    }

    if (executionMode === "executable") {
        return true;
    }

    if (skill.getType() === SkillType.SCRIPT) {
        return Boolean(skill.getCode());
    }

    return skill.getType() === SkillType.API;
}

export function classifySkill(skill: Skill): "instructional" | "executable" {
    return isExecutableSkill(skill) ? "executable" : "instructional";
}

export function buildSkillDiagnostics(skills: Skill[], assets?: LocalAgentAssetDiagnostics) {
    const executable = skills.filter(isExecutableSkill);
    const instructional = skills.filter((skill) => !isExecutableSkill(skill));
    const items = skills.map(toDiagnosticItem);

    return {
        totals: {
            discovered: skills.length,
            executable: executable.length,
            instructional: instructional.length,
        },
        bySource: summarizeBySource(items),
        executable: executable.map(toDiagnosticItem),
        instructional: instructional.map(toDiagnosticItem),
        workspace: assets ? {
            rootDir: assets.rootDir,
            totals: assets.totals,
            directories: assets.directories,
            agents: assets.agents,
            rules: assets.rules,
            workflows: assets.workflows,
            warnings: dedupeWarnings([
                ...assets.warnings,
                ...buildSkillWarnings(skills, assets),
            ]),
        } : undefined,
    };
}

function toDiagnosticItem(skill: Skill) {
    const schema = skill.getSchema() as SkillSchema;

    return {
        id: skill.getId(),
        name: skill.getName(),
        description: skill.getDescription(),
        type: skill.getType(),
        classification: classifySkill(skill),
        source: readSchemaValue(skill, "source") || "unknown",
        sourceKind: readSchemaValue(skill, "sourceKind") || "manual",
        folder: readSchemaValue(skill, "folder"),
        filePath: typeof schema.filePath === "string" ? schema.filePath : undefined,
    };
}

function summarizeBySource(items: Array<ReturnType<typeof toDiagnosticItem>>) {
    const counts = new Map<string, number>();
    for (const item of items) {
        counts.set(item.source, (counts.get(item.source) || 0) + 1);
    }

    return Array.from(counts.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((left, right) => left.source.localeCompare(right.source));
}

function buildSkillWarnings(skills: Skill[], assets: LocalAgentAssetDiagnostics): string[] {
    const warnings: string[] = [];
    const knownInstructionalPaths = new Set(assets.skills.map((item) => item.filePath));

    for (const skill of skills) {
        const filePath = readSchemaValue(skill, "filePath");
        const source = readSchemaValue(skill, "source");

        if (source === "local-agent-skill" && filePath && !knownInstructionalPaths.has(filePath)) {
            warnings.push(`Local skill registered from unknown file path: ${filePath}`);
        }

        if (isExecutableSkill(skill) && skill.getType() === SkillType.SCRIPT && !skill.getCode()) {
            warnings.push(`Executable script skill without code: ${skill.getId()}`);
        }
    }

    return warnings;
}

function dedupeWarnings(warnings: string[]): string[] {
    return Array.from(new Set(warnings)).sort();
}

function readSchemaValue(skill: Skill, key: string): string | undefined {
    const schema = skill.getSchema() as SkillSchema;
    return typeof schema[key] === "string" ? schema[key] : undefined;
}
