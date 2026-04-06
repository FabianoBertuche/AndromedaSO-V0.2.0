import { createHash } from "crypto";
import { createReadStream, promises as fs } from "fs";
import { tmpdir } from "os";
import path from "path";
import unzipper from "unzipper";

const SUPPORTED_SCHEMA_VERSIONS = ["1.0"];
const REQUIRED_FILES = ["manifest.json", "profile/identity.md", "config.json"];

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    manifest?: BundleManifestData;
    tempDir?: string;
}

export interface BundleManifestData {
    schemaVersion: string;
    exportedAt: string;
    agent: {
        id: string;
        slug: string;
        name: string;
        version: string;
        locale?: string;
    };
    includes: {
        knowledge: boolean;
        versions: boolean;
        performance: boolean;
    };
}

export class BundleValidator {
    async validate(filePath: string, declaredChecksum?: string): Promise<ValidationResult> {
        const errors: string[] = [];

        try {
            if (declaredChecksum) {
                const actualChecksum = await this.computeChecksum(filePath);
                if (actualChecksum !== declaredChecksum) {
                    errors.push(`Checksum mismatch: expected ${declaredChecksum}, got ${actualChecksum}`);
                    return { valid: false, errors };
                }
            }

            const tempDir = path.join(tmpdir(), `bundle-${Date.now()}`);
            await fs.mkdir(tempDir, { recursive: true });

            await this.extractZip(filePath, tempDir);

            const contents = await this.listDirectory(tempDir);

            for (const requiredFile of REQUIRED_FILES) {
                if (!contents.includes(requiredFile)) {
                    errors.push(`Missing required file: ${requiredFile}`);
                }
            }

            let manifest: BundleManifestData | undefined;

            if (contents.includes("manifest.json")) {
                try {
                    const manifestPath = path.join(tempDir, "manifest.json");
                    const manifestContent = await fs.readFile(manifestPath, "utf-8");
                    manifest = JSON.parse(manifestContent) as BundleManifestData;

                    if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schemaVersion)) {
                        errors.push(`Unsupported schema version: ${manifest.schemaVersion}. Supported versions: ${SUPPORTED_SCHEMA_VERSIONS.join(", ")}`);
                    }
                } catch (error) {
                    errors.push("Invalid manifest.json format");
                }
            } else {
                errors.push("Missing manifest.json");
            }

            if (errors.length > 0) {
                await this.cleanup(tempDir);
                return { valid: false, errors };
            }

            return { valid: true, errors: [], manifest, tempDir };
        } catch (error: any) {
            return { valid: false, errors: [`Validation error: ${error.message}`] };
        }
    }

    async computeChecksum(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const hash = createHash("sha256");
            const stream = createReadStream(filePath);
            stream.on("data", (chunk) => hash.update(chunk));
            stream.on("end", () => resolve(hash.digest("hex")));
            stream.on("error", reject);
        });
    }

    private async extractZip(filePath: string, targetDir: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const stream = createReadStream(filePath);
            const extractor = require("unzipper").Extract({ path: targetDir });
            stream.pipe(extractor)
                .on("close", resolve)
                .on("error", reject);
        });
    }

    private async listDirectory(dir: string, baseDir = dir): Promise<string[]> {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        const files: string[] = [];

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const subFiles = await this.listDirectory(fullPath, baseDir);
                files.push(...subFiles);
            } else {
                files.push(path.relative(baseDir, fullPath).replace(/\\/g, "/"));
            }
        }

        return files;
    }

    async cleanup(tempDir: string): Promise<void> {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    }
}