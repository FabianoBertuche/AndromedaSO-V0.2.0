import { Response } from "express";
import { ExportAgentUseCase } from "../../application/ExportAgentUseCase";
import { AgentBundleRepository } from "../../repositories/agent-bundle.repository";
import { AgentBundleFile } from "../../domain/types";

export class ExportController {
    constructor(
        private readonly exportUseCase: ExportAgentUseCase,
        private readonly bundleRepository: AgentBundleRepository,
    ) {}

    async exportAgent(req: any, res: Response): Promise<void> {
        try {
            const agentId = req.params.id;
            const tenantId = (req as any).tenant?.id || "default";
            const userId = (req as any).user?.id;

            const options = {
                includesKnowledge: req.body?.includesKnowledge ?? false,
                includesVersions: req.body?.includesVersions ?? true,
            };

            const result = await this.exportUseCase.execute({
                agentId,
                tenantId,
                userId,
                options,
            });

            res.status(201).json(result);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async listBundles(req: any, res: Response): Promise<void> {
        try {
            const agentId = req.params.id;
            const tenantId = (req as any).tenant?.id || "default";

            const bundles = await this.bundleRepository.findByAgentId(agentId, tenantId);

            res.json(bundles.map((b: AgentBundleFile) => ({
                bundleId: b.bundleId,
                checksum: b.checksum,
                exportedAt: b.manifest.exportedAt,
                includesKnowledge: b.manifest.includes.knowledge,
                includesVersions: b.manifest.includes.versions,
            })));
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }

    async downloadBundle(req: any, res: Response): Promise<void> {
        try {
            const bundleId = req.params.bundleId;
            const tenantId = (req as any).tenant?.id || "default";

            const bundle = await this.bundleRepository.findById(bundleId, tenantId);
            if (!bundle) {
                res.status(404).json({ error: "Bundle not found" });
                return;
            }

            const fs = require("fs");
            const path = require("path");

            const filePath = bundle.filePath;
            if (!fs.existsSync(filePath)) {
                res.status(404).json({ error: "Bundle file not found" });
                return;
            }

            const fileName = path.basename(filePath);
            res.download(filePath, fileName);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
}