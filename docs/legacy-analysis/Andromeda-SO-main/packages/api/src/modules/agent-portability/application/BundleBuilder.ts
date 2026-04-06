import archiver from "archiver";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { AgentProfile } from "../../agent-management/domain/agent-profile";
import { AgentBundleFile, BundleManifest, BundleOptions } from "../domain/types";

const SUPPORTED_SCHEMA_VERSION = "1.0";

export class BundleBuilder {
    private readonly storageDir: string;

    constructor(storageDir = "./storage/bundles") {
        this.storageDir = storageDir;
    }

    async build(
        agent: AgentProfile,
        options: BundleOptions = {},
        versions?: unknown[],
        knowledgeCollections?: unknown[]
    ): Promise<AgentBundleFile> {
        await this.ensureStorageDir();

        const bundleId = `${agent.id}-${Date.now()}`;
        const fileName = `${bundleId}.andromeda-agent`;
        const filePath = path.join(this.storageDir, fileName);

        const manifest = this.buildManifest(agent, options);

        await this.createBundle(filePath, agent, manifest, options, versions, knowledgeCollections);
        const checksum = await this.computeChecksum(filePath);

        return {
            bundleId,
            filePath,
            checksum,
            manifest,
        };
    }

    private buildManifest(agent: AgentProfile, options: BundleOptions): BundleManifest {
        return {
            schemaVersion: SUPPORTED_SCHEMA_VERSION,
            exportedAt: new Date().toISOString(),
            agent: {
                id: agent.id,
                slug: agent.id,
                name: agent.identity.name,
                role: agent.identity.role,
                description: agent.description,
                version: agent.version,
                locale: "pt-BR",
                teamId: agent.teamId,
                category: agent.category,
                type: agent.type,
                defaultModel: agent.defaultModel,
                identity: JSON.parse(JSON.stringify(agent.identity)),
                soul: JSON.parse(JSON.stringify(agent.soul)),
                rules: JSON.parse(JSON.stringify(agent.rules)),
                playbook: JSON.parse(JSON.stringify(agent.playbook)),
                context: JSON.parse(JSON.stringify(agent.context)),
                persona: JSON.parse(JSON.stringify(agent.persona)),
                safeguards: JSON.parse(JSON.stringify(agent.safeguards)),
            },
            includes: {
                knowledge: options.includesKnowledge ?? false,
                versions: options.includesVersions ?? true,
                performance: options.includesPerformance ?? false,
            },
        };
    }

    private async createBundle(
        filePath: string,
        agent: AgentProfile,
        manifest: BundleManifest,
        options: BundleOptions,
        versions?: unknown[],
        knowledgeCollections?: unknown[]
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const archive = archiver("zip", { zlib: { level: 9 } });
            const output = require("fs").createWriteStream(filePath);

            output.on("close", () => resolve());
            archive.on("error", (err) => reject(err));

            archive.pipe(output);

            archive.append(JSON.stringify(manifest, null, 2), { name: "manifest.json" });

            archive.append(agent.markdown.identity, { name: "profile/identity.md" });
            archive.append(agent.markdown.soul, { name: "profile/soul.md" });
            archive.append(agent.markdown.rules, { name: "profile/rules.md" });
            archive.append(agent.markdown.playbook, { name: "profile/playbook.md" });
            archive.append(agent.markdown.context, { name: "profile/context.md" });

            const config = {
                defaultModel: agent.defaultModel,
                teamId: agent.teamId,
                category: agent.category,
                type: agent.type,
                isDefault: agent.isDefault,
            };
            archive.append(JSON.stringify(config, null, 2), { name: "config.json" });

            archive.append(JSON.stringify(agent.safeguards, null, 2), { name: "safeguards.json" });

            if (versions && options.includesVersions !== false) {
                archive.append(JSON.stringify(versions, null, 2), { name: "versions/history.json" });
            }

            if (knowledgeCollections && options.includesKnowledge) {
                archive.append(JSON.stringify(knowledgeCollections, null, 2), {
                    name: "knowledge/collections.json",
                });
            }

            archive.finalize();
        });
    }

    private async computeChecksum(filePath: string): Promise<string> {
        const content = await fs.readFile(filePath);
        return createHash("sha256").update(content).digest("hex");
    }

    private async ensureStorageDir(): Promise<void> {
        try {
            await fs.mkdir(this.storageDir, { recursive: true });
        } catch {
            // Directory already exists
        }
    }
}