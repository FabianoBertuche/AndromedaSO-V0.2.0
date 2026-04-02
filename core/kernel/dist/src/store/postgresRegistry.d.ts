export declare function registerModule(moduleData: {
    moduleId: string;
    groupName: string;
    variantName: string;
    version: string;
    status: string;
    capabilities: unknown;
    contracts: unknown;
}): Promise<{
    id: string;
    moduleId: string;
    groupName: string;
    variantName: string;
    version: string;
    status: string;
    capabilities: any;
    contracts: any;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getModuleById(moduleId: string): Promise<{
    id: string;
    moduleId: string;
    groupName: string;
    variantName: string;
    version: string;
    status: string;
    capabilities: any;
    contracts: any;
    createdAt: Date;
    updatedAt: Date;
}[]>;
