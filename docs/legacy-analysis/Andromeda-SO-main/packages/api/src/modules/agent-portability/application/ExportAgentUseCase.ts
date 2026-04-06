import { AgentProfile } from "../../agent-management/domain/agent-profile";
import { AgentProfileRepository } from "../../agent-management/infrastructure/FileSystemAgentProfileRepository";
import { BundleBuilder } from "./BundleBuilder";
import { AgentBundleRepository } from "../repositories/agent-bundle.repository";
import { BundleOptions, AgentBundleFile } from "../domain/types";

export interface ExportAgentInput {
    agentId: string;
    tenantId: string;
    userId?: string;
    options?: BundleOptions;
}

export interface ExportAgentOutput {
    bundleId: string;
    downloadUrl: string;
    checksum: string;
    exportedAt: string;
}

export class ExportAgentUseCase {
    constructor(
        private readonly agentProfileRepository: AgentProfileRepository,
        private readonly bundleRepository: AgentBundleRepository,
        private readonly bundleBuilder: BundleBuilder,
    ) {}

    async execute(input: ExportAgentInput): Promise<ExportAgentOutput> {
        const agent = await this.agentProfileRepository.getById(input.agentId);
        if (!agent) {
            throw new Error(`Agent ${input.agentId} not found`);
        }

        const versions: unknown[] = [];
        if (input.options?.includesVersions !== false) {
            try {
                const history = await this.agentProfileRepository.listHistory(input.agentId);
                versions.push(...history);
            } catch {
                // Versions are optional
            }
        }

        let knowledgeCollections: unknown[] | undefined;
        if (input.options?.includesKnowledge) {
            knowledgeCollections = [];
        }

        const bundleFile = await this.bundleBuilder.build(agent, input.options, versions, knowledgeCollections);

        const bundleRecord = await this.bundleRepository.create({
            agentId: input.agentId,
            tenantId: input.tenantId,
            version: agent.version,
            schemaVersion: "1.0",
            checksum: bundleFile.checksum,
            filePath: bundleFile.filePath,
            includesKnowledge: input.options?.includesKnowledge ?? false,
            includesVersions: input.options?.includesVersions ?? true,
            exportedBy: input.userId,
        });

        const downloadUrl = `/v1/agents/${input.agentId}/bundles/${bundleRecord.id}/download`;

        return {
            bundleId: bundleRecord.id,
            downloadUrl,
            checksum: bundleFile.checksum,
            exportedAt: bundleFile.manifest.exportedAt,
        };
    }
}