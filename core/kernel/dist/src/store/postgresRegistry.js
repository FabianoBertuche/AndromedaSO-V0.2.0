import { db } from './db';
import { modulesRegistry, lifecycleEvents } from './schema';
import { eq } from 'drizzle-orm/expressions';
import { randomUUID } from 'crypto';
export async function registerModule(moduleData) {
    return await db.insert(modulesRegistry).values({
        id: randomUUID(),
        moduleId: moduleData.moduleId,
        groupName: moduleData.groupName,
        variantName: moduleData.variantName,
        version: moduleData.version,
        status: moduleData.status,
        capabilities: moduleData.capabilities,
        contracts: moduleData.contracts
    }).returning();
}
export async function getModuleById(moduleId) {
    return await db.select(modulesRegistry).where(eq(modulesRegistry.moduleId, moduleId)).limit(1);
}
export async function persistLifecycleEvent(eventData) {
    return await db.insert(lifecycleEvents).values({
        id: randomUUID(),
        moduleId: eventData.moduleId,
        stateFrom: eventData.stateFrom,
        stateTo: eventData.stateTo,
        reason: eventData.reason,
        context: eventData.context
    }).returning();
}
export async function persistValidationDecision(decisionData) {
    // For now, use lifecycleEvents table with special state
    return await db.insert(lifecycleEvents).values({
        id: randomUUID(),
        moduleId: decisionData.moduleId,
        stateFrom: 'unknown',
        stateTo: `validation_${decisionData.decision}`,
        reason: decisionData.reason,
        context: decisionData.context
    }).returning();
}
//# sourceMappingURL=postgresRegistry.js.map