import { db } from './db';
import { modulesRegistry } from './schema';
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
//# sourceMappingURL=postgresRegistry.js.map