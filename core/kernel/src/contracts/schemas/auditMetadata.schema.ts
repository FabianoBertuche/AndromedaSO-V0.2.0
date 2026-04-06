import { z } from 'zod';

export const auditMetadataSchema = z.object({
  createdBy: z.string().nullable().default(null),
  updatedBy: z.string().nullable().default(null),
  reason: z.string().nullable().default(null)
});
export type AuditMetadata = z.infer<typeof auditMetadataSchema>;