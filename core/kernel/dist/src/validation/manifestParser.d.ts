import { ModuleManifest } from '../contracts/moduleManifest.schema';
export declare function parseModuleManifestFile(filePath: string): Promise<ModuleManifest>;
export declare function parseModuleManifestString(content: string): ModuleManifest;
