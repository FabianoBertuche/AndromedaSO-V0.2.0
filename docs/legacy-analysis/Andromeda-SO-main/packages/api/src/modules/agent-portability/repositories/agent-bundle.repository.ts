import { getPrismaClient } from "../../../infrastructure/database/prisma";
import { AgentBundleFile, BundleManifest } from "../domain/types";

export interface AgentBundleRepository {
    create(data: {
        agentId: string;
        tenantId: string;
        version: string;
        schemaVersion: string;
        checksum: string;
        filePath: string;
        includesKnowledge: boolean;
        includesVersions: boolean;
        exportedBy?: string;
    }): Promise<{ id: string }>;
    
    findByAgentId(agentId: string, tenantId: string): Promise<AgentBundleFile[]>;
    
    findById(bundleId: string, tenantId: string): Promise<AgentBundleFile | null>;
    
    delete(bundleId: string, tenantId: string): Promise<void>;
}

export class PrismaAgentBundleRepository implements AgentBundleRepository {
    constructor(private readonly prisma: any = getPrismaClient()) {}

    async create(data: {
        agentId: string;
        tenantId: string;
        version: string;
        schemaVersion: string;
        checksum: string;
        filePath: string;
        includesKnowledge: boolean;
        includesVersions: boolean;
        exportedBy?: string;
    }): Promise<{ id: string }> {
        const bundle = await this.prisma.agentBundle.create({
            data: {
                agentId: data.agentId,
                tenantId: data.tenantId,
                version: data.version,
                schemaVersion: data.schemaVersion,
                checksum: data.checksum,
                filePath: data.filePath,
                includesKnowledge: data.includesKnowledge,
                includesVersions: data.includesVersions,
                exportedBy: data.exportedBy,
            },
        });

        return { id: bundle.id };
    }

    async findByAgentId(agentId: string, tenantId: string): Promise<AgentBundleFile[]> {
        const bundles = await this.prisma.agentBundle.findMany({
            where: {
                agentId,
                tenantId,
                deletedAt: null,
            },
            orderBy: {
                exportedAt: "desc",
            },
        });

        return bundles.map((bundle: any) => this.mapToBundleFile(bundle));
    }

    async findById(bundleId: string, tenantId: string): Promise<AgentBundleFile | null> {
        const bundle = await this.prisma.agentBundle.findFirst({
            where: {
                id: bundleId,
                tenantId,
                deletedAt: null,
            },
        });

        return bundle ? this.mapToBundleFile(bundle) : null;
    }

    async delete(bundleId: string, tenantId: string): Promise<void> {
        await this.prisma.agentBundle.update({
            where: { id: bundleId },
            data: { deletedAt: new Date() },
        });
    }

    private mapToBundleFile(bundle: any): AgentBundleFile {
        return {
            bundleId: bundle.id,
            filePath: bundle.filePath,
            checksum: bundle.checksum,
            manifest: bundle.manifest as BundleManifest ?? {
                schemaVersion: bundle.schemaVersion,
                exportedAt: bundle.exportedAt.toISOString(),
                agent: {
                    id: bundle.agentId,
                    slug: bundle.agentId,
                    name: "",
                    role: "",
                    description: "",
                    version: bundle.version,
                    locale: "pt-BR",
                    teamId: bundle.tenantId,
                    category: "general",
                    type: "specialist",
                    defaultModel: "automatic-router",
                    identity: {},
                    soul: {},
                    rules: {},
                    playbook: {},
                    context: {},
                    persona: {},
                    safeguards: {},
                },
                includes: {
                    knowledge: bundle.includesKnowledge,
                    versions: bundle.includesVersions,
                    performance: false,
                },
            },
        };
    }
}