import { z } from 'zod';

// Core Plugin Interface Schema
// Defines how plugins can extend the core kernel functionality

export const corePluginInterfaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  type: z.enum(['validator', 'lifecycle', 'registry', 'discovery']),
  entrypoint: z.string(),
  contracts: z.object({
    extension: z.string() // Path to extension contract
  }),
  capabilities: z.array(z.string()),
  dependencies: z.array(z.string())
});

export type CorePluginInterface = z.infer<typeof corePluginInterfaceSchema>;

// Plugin registration function
export interface PluginRegistrar {
  register(plugin: CorePluginInterface): Promise<void>;
  unregister(id: string): Promise<void>;
  list(): CorePluginInterface[];
}

// Extension points
export interface ExtensionPoints {
  validators: Map<string, (data: unknown) => boolean>;
  lifecycleHooks: Map<string, (moduleId: string, event: string) => Promise<void>>;
  registryExtensions: Map<string, (module: unknown) => Promise<void>>;
  discoveryExtensions: Map<string, (path: string) => Promise<unknown[]>>;
}