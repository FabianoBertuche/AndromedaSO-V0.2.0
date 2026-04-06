import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
    AgentProfile,
    AgentProfileHistoryEntry,
    bumpSemanticVersion,
    createHistoryEntry,
    normalizeAgentProfile,
} from "../domain/agent-profile";

export interface SaveAgentProfileOptions {
    summary?: string;
}

export interface AgentProfileRepository {
    list(): Promise<AgentProfile[]>;
    getById(id: string): Promise<AgentProfile | null>;
    save(profile: AgentProfile, options?: SaveAgentProfileOptions): Promise<AgentProfile>;
    delete(id: string): Promise<void>;
    listHistory(id: string): Promise<AgentProfileHistoryEntry[]>;
    restore(id: string, version: string): Promise<AgentProfile>;
}

export class FileSystemAgentProfileRepository implements AgentProfileRepository {
    constructor(private readonly baseDir = resolveDefaultProfilesDir()) { }

    async list(): Promise<AgentProfile[]> {
        await this.ensureBaseDir();

        const entries = await fs.readdir(this.baseDir, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        });

        const profiles = await Promise.all(
            entries
                .filter((entry) => entry.isDirectory())
                .map((entry) => this.getById(entry.name))
        );

        return profiles
            .filter((profile): profile is AgentProfile => Boolean(profile))
            .sort((left, right) => {
                if (left.isDefault !== right.isDefault) {
                    return left.isDefault ? -1 : 1;
                }
                return left.identity.name.localeCompare(right.identity.name);
            });
    }

    async getById(id: string): Promise<AgentProfile | null> {
        const profilePath = this.getProfileDocumentPath(id);

        try {
            const raw = await fs.readFile(profilePath, "utf8");
            const parsed = JSON.parse(raw) as AgentProfile;
            const markdown = await this.readMarkdownDocuments(id);

            return normalizeAgentProfile({
                ...parsed,
                markdown: {
                    ...parsed.markdown,
                    ...markdown,
                },
            });
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    async save(profile: AgentProfile, options: SaveAgentProfileOptions = {}): Promise<AgentProfile> {
        await this.ensureBaseDir();
        const normalized = normalizeAgentProfile(profile);
        const current = await this.getById(normalized.id);

        if (current) {
            await this.writeHistorySnapshot(current, options.summary || "profile updated");
        }

        await this.writeCurrentProfile(normalized);
        return normalized;
    }

    async delete(id: string): Promise<void> {
        await fs.rm(this.getAgentDir(id), { recursive: true, force: true });
    }

    async listHistory(id: string): Promise<AgentProfileHistoryEntry[]> {
        const historyDir = this.getHistoryDir(id);

        try {
            const files = await fs.readdir(historyDir);
            const entries = await Promise.all(
                files
                    .filter((file) => file.endsWith(".json"))
                    .map(async (file) => {
                        const raw = await fs.readFile(path.join(historyDir, file), "utf8");
                        return JSON.parse(raw) as AgentProfileHistoryEntry;
                    })
            );

            return entries.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }

    async restore(id: string, version: string): Promise<AgentProfile> {
        const history = await this.listHistory(id);
        const current = await this.getById(id);
        const source = history.find((entry) => entry.version === version)?.profile
            || (current?.version === version ? current : null);

        if (!source) {
            throw new Error(`Version ${version} not found for agent ${id}`);
        }

        const nextVersion = current ? bumpSemanticVersion(current.version) : bumpSemanticVersion(source.version);
        const restored: AgentProfile = normalizeAgentProfile({
            ...source,
            version: nextVersion,
            updatedAt: new Date().toISOString(),
        });

        if (current) {
            await this.writeHistorySnapshot(current, `restored from ${version}`, version);
        }

        await this.writeCurrentProfile(restored);
        return restored;
    }

    private async readMarkdownDocuments(id: string) {
        const agentDir = this.getAgentDir(id);
        return {
            identity: await this.readText(path.join(agentDir, "identity.md")),
            soul: await this.readText(path.join(agentDir, "soul.md")),
            rules: await this.readText(path.join(agentDir, "rules.md")),
            playbook: await this.readText(path.join(agentDir, "playbook.md")),
            context: await this.readText(path.join(agentDir, "context.md")),
        };
    }

    private async readText(filePath: string): Promise<string> {
        try {
            return await fs.readFile(filePath, "utf8");
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return "";
            }
            throw error;
        }
    }

    private async writeCurrentProfile(profile: AgentProfile): Promise<void> {
        const agentDir = this.getAgentDir(profile.id);
        await fs.mkdir(agentDir, { recursive: true });
        await fs.mkdir(this.getHistoryDir(profile.id), { recursive: true });

        await fs.writeFile(
            this.getProfileDocumentPath(profile.id),
            JSON.stringify(profile, null, 2),
        );
        await fs.writeFile(path.join(agentDir, "identity.md"), profile.markdown.identity);
        await fs.writeFile(path.join(agentDir, "soul.md"), profile.markdown.soul);
        await fs.writeFile(path.join(agentDir, "rules.md"), profile.markdown.rules);
        await fs.writeFile(path.join(agentDir, "playbook.md"), profile.markdown.playbook);
        await fs.writeFile(path.join(agentDir, "context.md"), profile.markdown.context);
    }

    private async writeHistorySnapshot(profile: AgentProfile, summary: string, restoredFromVersion?: string): Promise<void> {
        await fs.mkdir(this.getHistoryDir(profile.id), { recursive: true });
        const snapshot = createHistoryEntry(profile, summary, restoredFromVersion);
        const filePath = path.join(this.getHistoryDir(profile.id), `${profile.version}.json`);
        await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2));
    }

    private async ensureBaseDir(): Promise<void> {
        await fs.mkdir(this.baseDir, { recursive: true });
    }

    private getAgentDir(id: string): string {
        return path.join(this.baseDir, id);
    }

    private getProfileDocumentPath(id: string): string {
        return path.join(this.getAgentDir(id), "profile.json");
    }

    private getHistoryDir(id: string): string {
        return path.join(this.getAgentDir(id), "history");
    }
}

function resolveDefaultProfilesDir(): string {
    const envDir = process.env.ANDROMEDA_AGENT_PROFILE_DIR;
    if (envDir) {
        return envDir;
    }

    const candidates = [
        path.resolve(process.cwd(), "config/agents"),
        path.resolve(process.cwd(), "packages/api/config/agents"),
    ];

    return candidates.find((candidate) => existsSync(candidate)) || candidates[0];
}
