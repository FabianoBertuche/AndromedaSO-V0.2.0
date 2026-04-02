import { ModuleManifest } from '../contracts/moduleManifest.schema';
export declare function findManifestFiles(dir: string): Promise<string[]>;
export declare function discoverModules(rootDir: string): Promise<ModuleManifest[]>;
