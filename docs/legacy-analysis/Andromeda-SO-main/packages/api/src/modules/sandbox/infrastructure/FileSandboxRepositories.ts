import { existsSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
    ApprovalRequest,
    AgentSandboxConfig,
    SandboxArtifact,
    SandboxExecution,
    SandboxProfile,
    createDefaultAgentSandboxConfig,
} from "../domain/types";
import {
    ApprovalRequestRepository,
    AgentSandboxConfigRepository,
    SandboxArtifactRepository,
    SandboxExecutionRepository,
    SandboxProfileRepository,
} from "../domain/ports";

export class FileSandboxProfileRepository implements SandboxProfileRepository {
    constructor(private readonly baseDir = resolveSandboxDir("profiles")) { }

    async list(): Promise<SandboxProfile[]> {
        const files = await this.listJsonFiles();
        return Promise.all(files.map((file) => this.readJsonFile<SandboxProfile>(file)));
    }

    async getById(id: string): Promise<SandboxProfile | null> {
        return this.readById<SandboxProfile>(id);
    }

    async save(profile: SandboxProfile): Promise<SandboxProfile> {
        await fs.mkdir(this.baseDir, { recursive: true });
        await fs.writeFile(this.getFilePath(profile.id), JSON.stringify(profile, null, 2));
        return profile;
    }

    async delete(id: string): Promise<void> {
        const current = await this.getById(id);
        if (current?.isSystem) {
            throw new Error("System sandbox profiles cannot be deleted.");
        }
        await fs.rm(this.getFilePath(id), { force: true });
    }

    private async listJsonFiles(): Promise<string[]> {
        await fs.mkdir(this.baseDir, { recursive: true });
        const entries = await fs.readdir(this.baseDir, { withFileTypes: true }).catch(() => []);
        return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => path.join(this.baseDir, entry.name));
    }

    private async readById<T>(id: string): Promise<T | null> {
        try {
            return await this.readJsonFile<T>(this.getFilePath(id));
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    private async readJsonFile<T>(filePath: string): Promise<T> {
        const raw = await fs.readFile(filePath, "utf8");
        return JSON.parse(raw) as T;
    }

    private getFilePath(id: string): string {
        return path.join(this.baseDir, `${id}.json`);
    }
}

export class FileAgentSandboxConfigRepository implements AgentSandboxConfigRepository {
    constructor(private readonly baseDir = resolveSandboxDir("agent-configs")) { }

    async getByAgentId(agentId: string): Promise<AgentSandboxConfig> {
        const existing = await this.readByAgentId(agentId);
        if (existing) {
            return existing;
        }

        const config = createDefaultAgentSandboxConfig(agentId);
        await this.save(config);
        return config;
    }

    async save(config: AgentSandboxConfig): Promise<AgentSandboxConfig> {
        await fs.mkdir(this.baseDir, { recursive: true });
        await fs.writeFile(this.getFilePath(config.agentId), JSON.stringify(config, null, 2));
        return config;
    }

    async list(): Promise<AgentSandboxConfig[]> {
        const files = await this.listJsonFiles();
        return Promise.all(files.map((file) => this.readJsonFile<AgentSandboxConfig>(file)));
    }

    private async readByAgentId(agentId: string): Promise<AgentSandboxConfig | null> {
        try {
            return await this.readJsonFile<AgentSandboxConfig>(this.getFilePath(agentId));
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    private async listJsonFiles(): Promise<string[]> {
        await fs.mkdir(this.baseDir, { recursive: true });
        const entries = await fs.readdir(this.baseDir, { withFileTypes: true }).catch(() => []);
        return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => path.join(this.baseDir, entry.name));
    }

    private async readJsonFile<T>(filePath: string): Promise<T> {
        const raw = await fs.readFile(filePath, "utf8");
        return JSON.parse(raw) as T;
    }

    private getFilePath(agentId: string): string {
        return path.join(this.baseDir, `${agentId}.json`);
    }
}

export class FileSandboxExecutionRepository implements SandboxExecutionRepository {
    constructor(private readonly baseDir = resolveSandboxDir("executions")) { }

    async list(): Promise<SandboxExecution[]> {
        const files = await this.listJsonFiles();
        return Promise.all(files.map((file) => this.readJsonFile<SandboxExecution>(file)));
    }

    async getById(id: string): Promise<SandboxExecution | null> {
        try {
            return await this.readJsonFile<SandboxExecution>(this.getFilePath(id));
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    async save(execution: SandboxExecution): Promise<SandboxExecution> {
        await fs.mkdir(this.baseDir, { recursive: true });
        await fs.writeFile(this.getFilePath(execution.id), JSON.stringify(execution, null, 2));
        return execution;
    }

    private async listJsonFiles(): Promise<string[]> {
        await fs.mkdir(this.baseDir, { recursive: true });
        const entries = await fs.readdir(this.baseDir, { withFileTypes: true }).catch(() => []);
        return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => path.join(this.baseDir, entry.name));
    }

    private async readJsonFile<T>(filePath: string): Promise<T> {
        const raw = await fs.readFile(filePath, "utf8");
        return JSON.parse(raw) as T;
    }

    private getFilePath(id: string): string {
        return path.join(this.baseDir, `${id}.json`);
    }
}

export class FileSandboxArtifactRepository implements SandboxArtifactRepository {
    constructor(private readonly baseDir = resolveSandboxDir("artifacts")) { }

    async listByExecutionId(executionId: string): Promise<SandboxArtifact[]> {
        const filePath = this.getFilePath(executionId);
        try {
            const raw = await fs.readFile(filePath, "utf8");
            return JSON.parse(raw) as SandboxArtifact[];
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }

    async saveByExecutionId(executionId: string, artifacts: SandboxArtifact[]): Promise<void> {
        await fs.mkdir(this.baseDir, { recursive: true });
        await fs.writeFile(this.getFilePath(executionId), JSON.stringify(artifacts, null, 2));
    }

    private getFilePath(executionId: string): string {
        return path.join(this.baseDir, `${executionId}.json`);
    }
}

export class FileApprovalRequestRepository implements ApprovalRequestRepository {
    constructor(private readonly baseDir = resolveSandboxDir("approvals")) { }

    async list(): Promise<ApprovalRequest[]> {
        const files = await this.listJsonFiles();
        return Promise.all(files.map((file) => this.readJsonFile<ApprovalRequest>(file)));
    }

    async getById(id: string): Promise<ApprovalRequest | null> {
        try {
            return await this.readJsonFile<ApprovalRequest>(this.getFilePath(id));
        } catch (error: any) {
            if (error?.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }

    async save(request: ApprovalRequest): Promise<ApprovalRequest> {
        await fs.mkdir(this.baseDir, { recursive: true });
        await fs.writeFile(this.getFilePath(request.id), JSON.stringify(request, null, 2));
        return request;
    }

    async delete(id: string): Promise<void> {
        await fs.rm(this.getFilePath(id), { force: true });
    }

    private async listJsonFiles(): Promise<string[]> {
        await fs.mkdir(this.baseDir, { recursive: true });
        const entries = await fs.readdir(this.baseDir, { withFileTypes: true }).catch(() => []);
        return entries.filter((entry) => entry.isFile() && entry.name.endsWith(".json")).map((entry) => path.join(this.baseDir, entry.name));
    }

    private async readJsonFile<T>(filePath: string): Promise<T> {
        const raw = await fs.readFile(filePath, "utf8");
        return JSON.parse(raw) as T;
    }

    private getFilePath(id: string): string {
        return path.join(this.baseDir, `${id}.json`);
    }
}

function resolveSandboxDir(segment: string): string {
    const envDir = process.env.ANDROMEDA_SANDBOX_DIR;
    const candidates = envDir
        ? [path.resolve(envDir, segment)]
        : [
            path.resolve(process.cwd(), "config/sandbox", segment),
            path.resolve(process.cwd(), "packages/api/config/sandbox", segment),
        ];

    return candidates.find((candidate) => existsSync(path.dirname(candidate)) || existsSync(candidate)) || candidates[0];
}
