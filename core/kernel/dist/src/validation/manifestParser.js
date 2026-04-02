import { promises as fs } from 'fs';
import { parse } from 'yaml';
import { moduleManifestSchema } from '../contracts/moduleManifest.schema';
export async function parseModuleManifestFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const maybeManifest = parse(content);
    return moduleManifestSchema.parse(maybeManifest);
}
export function parseModuleManifestString(content) {
    const maybeManifest = parse(content);
    return moduleManifestSchema.parse(maybeManifest);
}
//# sourceMappingURL=manifestParser.js.map