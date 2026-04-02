import { z } from 'zod';

const semverRegExp = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

export const moduleManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  group: z.string().min(1),
  variant: z.string().min(1),
  version: z.string().regex(semverRegExp),
  entrypoint: z.string().min(1),
  contracts: z.object({
    input: z.string().min(1),
    output: z.string().min(1)
  }).optional(),
  capabilities: z.array(z.string().min(1)).optional().default([]),
  status: z.enum(['active', 'disabled', 'deprecated']).optional().default('active'),
  critical: z.boolean().optional().default(false),
  dependencies: z.array(z.string().min(1)).optional().default([])
});

export type ModuleManifest = z.infer<typeof moduleManifestSchema>;

export function validateModuleManifest(manifest: unknown) {
  return moduleManifestSchema.parse(manifest);
}
