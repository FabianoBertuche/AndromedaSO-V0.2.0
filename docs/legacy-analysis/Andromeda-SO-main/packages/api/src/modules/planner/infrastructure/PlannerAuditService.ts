import { randomUUID } from "node:crypto";
import { IAuditService } from "../domain/ports";

export class PlannerAuditService implements IAuditService {
    constructor(private readonly prisma: any) { }

    async log(action: string, resourceId: string, requestedBy: string, metadata?: Record<string, unknown>): Promise<void> {
        await this.prisma.auditLog.create({
            data: {
                id: randomUUID(),
                tenantId: typeof metadata?.tenantId === "string" ? metadata.tenantId : "default",
                userId: requestedBy,
                action,
                resource: "execution_plan",
                resourceId,
                metadata: metadata || {},
            },
        });
    }
}
