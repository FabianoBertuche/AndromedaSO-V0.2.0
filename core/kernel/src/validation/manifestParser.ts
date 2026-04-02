import { promises as fs } from 'fs';
import { parse } from 'yaml';
import { moduleManifestSchema, ModuleManifest } from '../contracts/moduleManifest.schema';

export async function parseModuleManifestFile(filePath: string): Promise<ModuleManifest> {
  const content = await fs.readFile(filePath, 'utf8');
  const maybeManifest = parse(content);

  return moduleManifestSchema.parse(maybeManifest);
}

export function parseModuleManifestString(content: string): ModuleManifest {
  const maybeManifest = parse(content);

  return moduleManifestSchema.parse(maybeManifest);
}
