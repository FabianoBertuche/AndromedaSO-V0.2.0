import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { AgentProfile, normalizeAgentProfile } from "../domain/agent-profile";
import { PrismaAgentProfileRepository } from "./PrismaAgentProfileRepository";

export interface MigrationResult {
    totalAgents: number;
    migrated: string[];
    skipped: string[];
    errors: { agentId: string; error: string }[];
}

export interface MigrationOptions {
    sourceDir?: string;
    dryRun?: boolean;
    createBackup?: boolean;
    backupDir?: string;
}

const DEFAULT_SOURCE_DIR = resolveDefaultProfilesDir();

export class AgentMigrationService {
    constructor(
        private readonly targetRepo: PrismaAgentProfileRepository,
        private readonly sourceDir: string = DEFAULT_SOURCE_DIR,
    ) {}

    async migrate(options: MigrationOptions = {}): Promise<MigrationResult> {
        const result: MigrationResult = {
            totalAgents: 0,
            migrated: [],
            skipped: [],
            errors: [],
        };

        const sourceDir = options.sourceDir || this.sourceDir;

        if (!existsSync(sourceDir)) {
            console.log(`Source directory ${sourceDir} does not exist, nothing to migrate.`);
            return result;
        }

        const entries = await fs.readdir(sourceDir, { withFileTypes: true });
        const agentDirs = entries.filter((entry) => entry.isDirectory());

        result.totalAgents = agentDirs.length;

        if (options.createBackup) {
            await this.createBackup(options.backupDir);
        }

        for (const agentDir of agentDirs) {
            const agentId = agentDir.name;

            try {
                const profile = await this.readAgentFromFiles(path.join(sourceDir, agentId));

                if (!profile) {
                    result.skipped.push(agentId);
                    continue;
                }

                const existing = await this.targetRepo.getById(profile.id);
                if (existing) {
                    console.log(`Agent ${agentId} already exists in database, skipping.`);
                    result.skipped.push(agentId);
                    continue;
                }

                if (options.dryRun) {
                    console.log(`[DRY RUN] Would migrate agent: ${agentId}`);
                    result.migrated.push(agentId);
                } else {
                    await this.targetRepo.save(profile, { summary: "migrated from filesystem" });
                    console.log(`Migrated agent: ${agentId}`);
                    result.migrated.push(agentId);
                }
            } catch (error: any) {
                console.error(`Error migrating agent ${agentId}:`, error.message);
                result.errors.push({
                    agentId,
                    error: error.message,
                });
            }
        }

        return result;
    }

    private async readAgentFromFiles(agentDir: string): Promise<AgentProfile | null> {
        const profilePath = path.join(agentDir, "profile.json");

        if (!existsSync(profilePath)) {
            return null;
        }

        try {
            const raw = await fs.readFile(profilePath, "utf8");
            const parsed = JSON.parse(raw) as AgentProfile;

            const markdown = await this.readMarkdownDocuments(agentDir);

            return normalizeAgentProfile({
                ...parsed,
                markdown: {
                    ...parsed.markdown,
                    ...markdown,
                },
            });
        } catch (error) {
            throw error;
        }
    }

    private async readMarkdownDocuments(agentDir: string): Promise<{
        identity: string;
        soul: string;
        rules: string;
        playbook: string;
        context: string;
    }> {
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
        } catch {
            return "";
        }
    }

    private async createBackup(backupDir?: string): Promise<void> {
        const targetBackupDir = backupDir || path.join(this.sourceDir, "..", "agents-backup");

        if (existsSync(targetBackupDir)) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const timestampedBackup = `${targetBackupDir}-${timestamp}`;
            await this.copyDirectory(this.sourceDir, timestampedBackup);
            console.log(`Backup created at: ${timestampedBackup}`);
        } else {
            await this.copyDirectory(this.sourceDir, targetBackupDir);
            console.log(`Backup created at: ${targetBackupDir}`);
        }
    }

    private async copyDirectory(src: string, dest: string): Promise<void> {
        await fs.mkdir(dest, { recursive: true });
        const entries = await fs.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                await this.copyDirectory(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
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