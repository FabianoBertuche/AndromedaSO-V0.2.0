import { pgTable, uuid, text, varchar, jsonb, timestamp, uniqueIndex } from 'drizzle-orm-pg';
export const modulesRegistry = pgTable('modules_registry', {
    id: uuid('id').primaryKey(),
    moduleId: varchar('module_id', { length: 255 }).notNull(),
    groupName: varchar('group_name', { length: 255 }).notNull(),
    variantName: varchar('variant_name', { length: 255 }).notNull(),
    version: varchar('version', { length: 50 }).notNull(),
    status: text('status').notNull(),
    capabilities: jsonb('capabilities').notNull(),
    contracts: jsonb('contracts').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
    moduleIdUnique: uniqueIndex('modules_registry_module_id_idx').on(table.moduleId)
}));
export const lifecycleEvents = pgTable('lifecycle_events', {
    id: uuid('id').primaryKey(),
    moduleId: varchar('module_id', { length: 255 }).notNull(),
    stateFrom: text('state_from').notNull(),
    stateTo: text('state_to').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    reason: text('reason'),
    context: jsonb('context')
});
//# sourceMappingURL=schema.js.map