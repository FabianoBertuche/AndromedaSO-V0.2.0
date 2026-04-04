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
export declare const providers: import("drizzle-orm-pg").PgTableWithColumns<{
    name: "providers";
    columns: {
        id: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            tableName: "providers";
        }>;
        name: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "providers";
        }>;
        type: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "providers";
        }>;
        displayName: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "providers";
        }>;
        apiBase: import("drizzle-orm-pg").PgColumn<{
            notNull: false;
            hasDefault: false;
            data: string;
            driverParam: string;
            tableName: "providers";
        }>;
        baseUrl: import("drizzle-orm-pg").PgColumn<{
            notNull: false;
            hasDefault: false;
            data: string;
            driverParam: string;
            tableName: "providers";
        }>;
        apiKeyEnc: import("drizzle-orm-pg").PgText<{
            hasDefault: false;
            notNull: false;
            data: string;
            tableName: "providers";
        }>;
        health: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            tableName: "providers";
        }>;
        selectedModelIds: import("drizzle-orm-pg").PgColumn<{
            data: any;
            driverParam: any;
            notNull: true;
            hasDefault: true;
            tableName: "providers";
        }>;
        createdAt: import("drizzle-orm-pg").PgColumn<{
            data: Date;
            driverParam: string;
            hasDefault: true;
            notNull: true;
            tableName: "providers";
        }>;
    };
}>;
export declare const modelCatalogItems: import("drizzle-orm-pg").PgTableWithColumns<{
    name: "model_catalog_items";
    columns: {
        id: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            tableName: "model_catalog_items";
        }>;
        providerId: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "model_catalog_items";
        }>;
        modelId: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "model_catalog_items";
        }>;
        displayName: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "model_catalog_items";
        }>;
        capabilities: import("drizzle-orm-pg").PgColumn<{
            data: any;
            driverParam: any;
            notNull: true;
            hasDefault: true;
            tableName: "model_catalog_items";
        }>;
        score: import("drizzle-orm-pg").PgColumn<{
            data: number;
            driverParam: string | number;
            notNull: true;
            hasDefault: true;
            tableName: "model_catalog_items";
        }>;
        latencyMs: import("drizzle-orm-pg").PgColumn<{
            data: number;
            driverParam: number | string;
            notNull: true;
            hasDefault: true;
            tableName: "model_catalog_items";
        }>;
        costUsd: import("drizzle-orm-pg").PgColumn<{
            notNull: false;
            hasDefault: false;
            data: number;
            driverParam: string | number;
            tableName: "model_catalog_items";
        }>;
        priceLabel: import("drizzle-orm-pg").PgColumn<{
            notNull: false;
            hasDefault: false;
            data: string;
            driverParam: string;
            tableName: "model_catalog_items";
        }>;
        contextWindow: import("drizzle-orm-pg").PgColumn<{
            notNull: false;
            hasDefault: false;
            data: string;
            driverParam: string;
            tableName: "model_catalog_items";
        }>;
        createdAt: import("drizzle-orm-pg").PgColumn<{
            data: Date;
            driverParam: string;
            hasDefault: true;
            notNull: true;
            tableName: "model_catalog_items";
        }>;
    };
}>;
export declare const modelBenchmarkResults: import("drizzle-orm-pg").PgTableWithColumns<{
    name: "model_benchmark_results";
    columns: {
        id: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            tableName: "model_benchmark_results";
        }>;
        modelId: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "model_benchmark_results";
        }>;
        taskType: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            tableName: "model_benchmark_results";
        }>;
        score: import("drizzle-orm-pg").PgColumn<{
            data: number;
            driverParam: string | number;
            hasDefault: false;
            notNull: true;
            tableName: "model_benchmark_results";
        }>;
        latencyMs: import("drizzle-orm-pg").PgColumn<{
            data: number;
            driverParam: number | string;
            hasDefault: false;
            notNull: true;
            tableName: "model_benchmark_results";
        }>;
        tokensIn: import("drizzle-orm-pg").PgColumn<{
            data: number;
            driverParam: number | string;
            notNull: true;
            hasDefault: true;
            tableName: "model_benchmark_results";
        }>;
        tokensOut: import("drizzle-orm-pg").PgColumn<{
            data: number;
            driverParam: number | string;
            notNull: true;
            hasDefault: true;
            tableName: "model_benchmark_results";
        }>;
        costUsd: import("drizzle-orm-pg").PgColumn<{
            notNull: false;
            hasDefault: false;
            data: number;
            driverParam: string | number;
            tableName: "model_benchmark_results";
        }>;
        success: import("drizzle-orm-pg").PgColumn<{
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            tableName: "model_benchmark_results";
        }>;
        simulated: import("drizzle-orm-pg").PgColumn<{
            data: boolean;
            driverParam: boolean;
            notNull: true;
            hasDefault: true;
            tableName: "model_benchmark_results";
        }>;
        executedAt: import("drizzle-orm-pg").PgColumn<{
            data: Date;
            driverParam: string;
            hasDefault: true;
            notNull: true;
            tableName: "model_benchmark_results";
        }>;
    };
}>;
export declare const routingDecisions: import("drizzle-orm-pg").PgTableWithColumns<{
    name: "routing_decisions";
    columns: {
        id: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            tableName: "routing_decisions";
        }>;
        taskType: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "routing_decisions";
        }>;
        selectedModel: import("drizzle-orm-pg").PgColumn<{
            data: string;
            driverParam: string;
            hasDefault: false;
            notNull: true;
            tableName: "routing_decisions";
        }>;
        score: import("drizzle-orm-pg").PgColumn<{
            data: number;
            driverParam: string | number;
            hasDefault: false;
            notNull: true;
            tableName: "routing_decisions";
        }>;
        createdAt: import("drizzle-orm-pg").PgColumn<{
            data: Date;
            driverParam: string;
            hasDefault: true;
            notNull: true;
            tableName: "routing_decisions";
        }>;
    };
}>;
