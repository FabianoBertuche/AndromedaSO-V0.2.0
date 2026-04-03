import { readdir } from 'fs/promises';
import { join } from 'path';
import pino from 'pino';
import { parseModuleManifestFile } from '../validation/manifestParser';
const logger = pino({ name: 'fsDiscovery' });
export async function findManifestFiles(dir) {
    logger.info({ dir }, 'Starting manifest file discovery');
    const entries = await readdir(dir, { withFileTypes: true });
    const manifestPaths = [];
    for (const entry of entries) {
        const entryPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            manifestPaths.push(...(await findManifestFiles(entryPath)));
            continue;
        }
        if (entry.isFile() && entry.name.toLowerCase() === 'module.manifest.yaml') {
            logger.debug({ filePath: entryPath }, 'Found manifest file');
            manifestPaths.push(entryPath);
        }
    }
    logger.info({ count: manifestPaths.length, dir }, 'Completed manifest file discovery');
    return manifestPaths;
}
export async function discoverModules(rootDir) {
    logger.info({ rootDir }, 'Starting module discovery');
    const manifestFiles = await findManifestFiles(rootDir);
    const manifests = [];
    for (const filePath of manifestFiles) {
        try {
            const manifest = await parseModuleManifestFile(filePath);
            manifests.push(manifest);
            logger.info({ moduleId: manifest.id, filePath }, 'Parsed module manifest');
        }
        catch (err) {
            logger.error({ filePath, error: err.message }, 'Failed to parse manifest file');
        }
    }
    logger.info({ count: manifests.length, rootDir }, 'Completed module discovery');
    return manifests;
}
//# sourceMappingURL=fsDiscovery.js.map