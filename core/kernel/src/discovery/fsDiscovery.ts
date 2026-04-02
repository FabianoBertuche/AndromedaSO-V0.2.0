import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { parseModuleManifestFile } from '../validation/manifestParser';
import { ModuleManifest } from '../contracts/moduleManifest.schema';

export async function findManifestFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const manifestPaths: string[] = [];

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

export async function discoverModules(rootDir: string): Promise<ModuleManifest[]> {
  const manifestFiles = await findManifestFiles(rootDir);
  const manifests: ModuleManifest[] = [];

  for (const filePath of manifestFiles) {
    const manifest = await parseModuleManifestFile(filePath);
    manifests.push(manifest);
  }

  return manifests;
}
