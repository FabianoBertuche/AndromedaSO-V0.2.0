export declare const modulesRegistry: import("drizzle-orm-pg").PgTableWithColumns<{
    name: "modules_registry";
    columns: {
        id: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        moduleId: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        groupName: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        variantName: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        version: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        status: import("drizzle-orm-pg").PgText<{
            data: string;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        capabilities: import("drizzle-orm-pg").PgColumn<{
            data: any;
            driverParam: any;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        contracts: import("drizzle-orm-pg").PgColumn<{
            data: any;
            driverParam: any;
            hasDefault: false;
            notNull: true;
            tableName: "modules_registry";
        }>;
        createdAt: import("drizzle-orm-pg").PgColumn<{
            data: Date;
            driverParam: string;
            hasDefault: true;
            notNull: true;
            tableName: "modules_registry";
        }>;
        updatedAt: import("drizzle-orm-pg").PgColumn<{
            data: Date;
            driverParam: string;
            hasDefault: true;
            notNull: true;
            tableName: "modules_registry";
        }>;
    };
}>;
export declare const lifecycleEvents: import("drizzle-orm-pg").PgTableWithColumns<{
    name: "lifecycle_events";
    columns: {
        id: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "lifecycle_events";
        }>;
        moduleId: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "lifecycle_events";
        }>;
        stateFrom: import("drizzle-orm-pg").PgText<{
            data: string;
            hasDefault: false;
            notNull: true;
            tableName: "lifecycle_events";
        }>;
        stateTo: import("drizzle-orm-pg").PgText<{
            data: string;
            hasDefault: false;
            notNull: true;
            tableName: "lifecycle_events";
        }>;
        timestamp: import("drizzle-orm-pg").PgColumn<{
            data: Date;
            driverParam: string;
            hasDefault: true;
            notNull: true;
            tableName: "lifecycle_events";
        }>;
        reason: import("drizzle-orm-pg").PgText<{
            hasDefault: false;
            notNull: false;
            data: string;
            tableName: "lifecycle_events";
        }>;
        context: import("drizzle-orm-pg").PgColumn<{
            notNull: false;
            hasDefault: false;
            data: unknown;
            driverParam: unknown;
            tableName: "lifecycle_events";
        }>;
    };
}>;
