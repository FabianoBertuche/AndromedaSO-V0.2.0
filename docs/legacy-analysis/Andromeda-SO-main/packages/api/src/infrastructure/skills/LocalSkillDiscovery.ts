import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { Skill, SkillType } from "@andromeda/core";
import { readFrontmatter, resolveDefaultAgentRootDir } from "../agent-assets/LocalAgentAssetDiscovery";

export async function discoverLocalSkills(baseDir = resolveDefaultSkillsDir()): Promise<Skill[]> {
    if (!baseDir || !existsSync(baseDir)) {
        return [];
    }

    const skillFiles = await collectSkillFiles(baseDir);
    const skills = await Promise.all(skillFiles.map((filePath) => loadSkill(filePath, baseDir)));

    return skills.filter((skill): skill is Skill => skill !== null);
}

export function resolveDefaultSkillsDir(): string {
    const envDir = process.env.ANDROMEDA_SKILLS_DIR;
    if (envDir) {
        return envDir;
    }

    return path.join(resolveDefaultAgentRootDir(), "skills");
}

async function collectSkillFiles(dirPath: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            return collectSkillFiles(entryPath);
        }

        return entry.isFile() && entry.name === "SKILL.md" ? [entryPath] : [];
    }));

    return nested.flat();
}

async function loadSkill(filePath: string, baseDir: string): Promise<Skill | null> {
    const metadata = await readFrontmatter(filePath);
    const relativeDir = normalizeId(path.relative(baseDir, path.dirname(filePath)));
    const name = metadata.name || path.basename(path.dirname(filePath));
    const description = metadata.description || `Local skill loaded from ${relativeDir}`;

    if (!name) {
        return null;
    }

    return new Skill({
        id: `local-skill:${relativeDir}`,
        name,
        description,
        type: SkillType.TOOL,
        schema: {
            source: "local-agent-skill",
            sourceKind: "skill",
            executionMode: "instructional",
            classification: "instructional",
            filePath,
            folder: relativeDir,
        },
    });
}

function normalizeId(value: string): string {
    return value.replace(/\\/g, "/");
}
