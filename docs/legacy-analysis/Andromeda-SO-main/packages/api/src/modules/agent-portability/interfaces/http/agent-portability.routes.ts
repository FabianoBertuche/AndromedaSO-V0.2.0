import { Router } from "express";
import { ExportController } from "./ExportController";
import { ImportController } from "./ImportController";
import { ExportAgentUseCase } from "../../application/ExportAgentUseCase";
import { ImportAgentUseCase } from "../../application/ImportAgentUseCase";
import { BundleBuilder } from "../../application/BundleBuilder";
import { BundleValidator } from "../../application/BundleValidator";
import { BundleImporter } from "../../application/BundleImporter";
import { PrismaAgentBundleRepository } from "../../repositories/agent-bundle.repository";
import { PrismaAgentImportJobRepository } from "../../repositories/agent-import-job.repository";
import { agentProfileRepository } from "../../../agent-management/dependencies";
import multer from "multer";
import path from "path";
import { promises as fs } from "fs";

const uploadDir = path.join(process.cwd(), "storage", "uploads");

async function ensureUploadDir() {
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch {
        // Directory exists
    }
}

const upload = multer({
    dest: uploadDir,
    limits: { fileSize: 50 * 1024 * 1024 },
});

const bundleBuilder = new BundleBuilder();
const bundleValidator = new BundleValidator();
const bundleImporter = new BundleImporter();
const bundleRepository = new PrismaAgentBundleRepository();
const importJobRepository = new PrismaAgentImportJobRepository();

const exportUseCase = new ExportAgentUseCase(agentProfileRepository, bundleRepository, bundleBuilder);
const importUseCase = new ImportAgentUseCase(agentProfileRepository, bundleValidator, bundleImporter, importJobRepository);

const exportController = new ExportController(exportUseCase, bundleRepository);
const importController = new ImportController(importUseCase, importJobRepository);

export const agentPortabilityRouter = Router();

agentPortabilityRouter.post("/agents/:id/export", (req, res) => void exportController.exportAgent(req, res));
agentPortabilityRouter.get("/agents/:id/bundles", (req, res) => void exportController.listBundles(req, res));
agentPortabilityRouter.get("/agents/:id/bundles/:bundleId/download", (req, res) => void exportController.downloadBundle(req, res));

agentPortabilityRouter.post("/agents/import", upload.single("file"), (req, res) => void importController.importAgent(req, res));
agentPortabilityRouter.get("/agents/import/:jobId", (req, res) => void importController.getJobStatus(req, res));
agentPortabilityRouter.post("/agents/import/:jobId/resolve", (req, res) => void importController.resolveConflict(req, res));

void ensureUploadDir();

export { bundleBuilder, bundleRepository };