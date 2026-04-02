import { readdir } from 'fs/promises';
import { join } from 'path';
import { parseModuleManifestFile } from '../validation/manifestParser';
export async function findManifestFiles(dir) {
    const entries = await readdir(dir, { withFileTypes: true });
    const manifestPaths = [];
    for (const entry of entries) {
        const entryPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            manifestPaths.push(...(await findManifestFiles(entryPath)));
            continue;
        }
        if (entry.isFile() && entry.name.toLowerCase() === 'module.manifest.yaml') {
            manifestPaths.push(entryPath);
        }
    }
    return manifestPaths;
}
export async function discoverModules(rootDir) {
    const manifestFiles = await findManifestFiles(rootDir);
    const manifests = [];
    for (const filePath of manifestFiles) {
        const manifest = await parseModuleManifestFile(filePath);
        manifests.push(manifest);
    }
    return manifests;
}
//# sourceMappingURL=fsDiscovery.js.map