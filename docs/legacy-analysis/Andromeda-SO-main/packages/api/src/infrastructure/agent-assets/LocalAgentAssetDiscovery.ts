import fs from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

export interface LocalAgentAssetItem {
    id: string;
    name: string;
    description: string;
    filePath: string;
    relativePath: string;
    category: "skill" | "rule" | "workflow" | "agent";
    skills?: string[];
}

export interface LocalAgentAssetDiagnostics {
    rootDir: string;
    directories: {
        skills: string;
        rules: string;
        workflows: string;
        agents: string;
    };
    totals: {
        skills: number;
        rules: number;
        workflows: number;
        agents: number;
    };
    skills: LocalAgentAssetItem[];
    rules: LocalAgentAssetItem[];
    workflows: LocalAgentAssetItem[];
    agents: LocalAgentAssetItem[];
    warnings: string[];
}

export async function discoverLocalAgentAssets(rootDir = resolveDefaultAgentRootDir()): Promise<LocalAgentAssetDiagnostics> {
    const directories = {
        skills: path.join(rootDir, "skills"),
        rules: path.join(rootDir, "rules"),
        workflows: path.join(rootDir, "workflows"),
        agents: path.join(rootDir, "agents"),
    };

    const [skills, rules, workflows, agents] = await Promise.all([
        discoverAssetsInDirectory(directories.skills, "SKILL.md", "skill"),
        discoverAssetsInDirectory(directories.rules, ".md", "rule"),
        discoverAssetsInDirectory(directories.workflows, ".md", "workflow"),
        discoverAssetsInDirectory(directories.agents, ".md", "agent"),
    ]);

    return {
        rootDir,
        directories,
        totals: {
            skills: skills.length,
            rules: rules.length,
            workflows: workflows.length,
            agents: agents.length,
        },
        skills,
        rules,
        workflows,
        agents,
        warnings: buildWarnings(skills, rules, workflows, agents, directories),
    };
}

export function resolveDefaultAgentRootDir(): string {
    const envDir = process.env.ANDROMEDA_AGENT_DIR;
    if (envDir) {
        return envDir;
    }

    const cwd = process.cwd();
    const candidates: string[] = [];
    let currentDir = cwd;

    while (true) {
        candidates.push(path.join(currentDir, ".agent"));
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
            break;
        }
        currentDir = parentDir;
    }

    return candidates.find((candidate) => existsSync(candidate)) || candidates[0];
}

export async function readFrontmatter(filePath: string): Promise<Record<string, string>> {
    const content = await fs.readFile(filePath, "utf8");
    return parseFrontmatter(content);
}

async function discoverAssetsInDirectory(
    dirPath: string,
    matcher: string,
    category: LocalAgentAssetItem["category"],
): Promise<LocalAgentAssetItem[]> {
    if (!existsSync(dirPath)) {
        return [];
    }

    const filePaths = await collectFiles(dirPath, matcher);
    const items = await Promise.all(filePaths.map((filePath) => toAssetItem(dirPath, filePath, category)));
    return items.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

async function collectFiles(dirPath: string, matcher: string): Promise<string[]> {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nested = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
            return collectFiles(entryPath, matcher);
        }

        if (!entry.isFile()) {
            return [];
        }

        if (matcher === ".md") {
            return entry.name.endsWith(".md") ? [entryPath] : [];
        }

        return entry.name === matcher ? [entryPath] : [];
    }));

    return nested.flat();
}

async function toAssetItem(
    baseDir: string,
    filePath: string,
    category: LocalAgentAssetItem["category"],
): Promise<LocalAgentAssetItem> {
    const metadata = await readFrontmatter(filePath);
    const relativePath = normalizePath(path.relative(baseDir, filePath));
    const fileName = path.basename(filePath, path.extname(filePath));
    const parentName = path.basename(path.dirname(filePath));

    const name = metadata.name
        || (category === "skill" && fileName === "SKILL" ? parentName : fileName);

    return {
        id: `${category}:${normalizePath(path.relative(baseDir, path.dirname(filePath)))}`,
        name,
        description: metadata.description || `${category} asset at ${relativePath}`,
        filePath,
        relativePath,
        category,
        skills: parseList(metadata.skills),
    };
}

function buildWarnings(
    skills: LocalAgentAssetItem[],
    rules: LocalAgentAssetItem[],
    workflows: LocalAgentAssetItem[],
    agents: LocalAgentAssetItem[],
    directories: { skills: string; rules: string; workflows: string; agents: string },
): string[] {
    const warnings: string[] = [];

    if (!existsSync(directories.skills)) {
        warnings.push(`Missing skills directory: ${directories.skills}`);
    }
    if (!existsSync(directories.rules)) {
        warnings.push(`Missing rules directory: ${directories.rules}`);
    }
    if (!existsSync(directories.workflows)) {
        warnings.push(`Missing workflows directory: ${directories.workflows}`);
    }
    if (!existsSync(directories.agents)) {
        warnings.push(`Missing agents directory: ${directories.agents}`);
    }

    const duplicateSkillNames = findDuplicateNames(skills);
    for (const name of duplicateSkillNames) {
        warnings.push(`Duplicate skill name detected: ${name}`);
    }

    const duplicateWorkflowNames = findDuplicateNames(workflows);
    for (const name of duplicateWorkflowNames) {
        warnings.push(`Duplicate workflow name detected: ${name}`);
    }

    const duplicateAgentNames = findDuplicateNames(agents);
    for (const name of duplicateAgentNames) {
        warnings.push(`Duplicate agent name detected: ${name}`);
    }

    if (rules.length === 0) {
        warnings.push("No local rules discovered under .agent/rules");
    }

    return warnings;
}

function parseList(value?: string): string[] | undefined {
    if (!value) {
        return undefined;
    }

    const items = value.split(",").map((item) => item.trim()).filter(Boolean);
    return items.length > 0 ? items : undefined;
}

function findDuplicateNames(items: LocalAgentAssetItem[]): string[] {
    const counts = new Map<string, number>();
    for (const item of items) {
        counts.set(item.name, (counts.get(item.name) || 0) + 1);
    }

    return Array.from(counts.entries())
        .filter(([, count]) => count > 1)
        .map(([name]) => name)
        .sort();
}

function parseFrontmatter(content: string): Record<string, string> {
    const lines = content.split(/\r?\n/);
    if (lines[0]?.trim() !== "---") {
        return {};
    }

    const metadata: Record<string, string> = {};

    for (let index = 1; index < lines.length; index += 1) {
        const line = lines[index]?.trim() || "";
        if (line === "---") {
            break;
        }

        const separatorIndex = line.indexOf(":");
        if (separatorIndex <= 0) {
            continue;
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim().replace(/^['\"]|['\"]$/g, "");
        if (key && value) {
            metadata[key] = value;
        }
    }

    return metadata;
}

function normalizePath(value: string): string {
    return value.replace(/\\/g, "/");
}
