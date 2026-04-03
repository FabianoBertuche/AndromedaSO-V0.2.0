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
export declare function persistLifecycleEvent(eventData: {
    moduleId: string;
    stateFrom: string;
    stateTo: string;
    reason?: string;
    context?: unknown;
}): Promise<{
    id: string;
    moduleId: string;
    stateFrom: string;
    stateTo: string;
    timestamp: Date;
    reason: string | null;
    context: unknown;
}[]>;
export declare function persistValidationDecision(decisionData: {
    moduleId: string;
    decision: 'passed' | 'failed';
    reason?: string;
    context?: unknown;
}): Promise<{
    id: string;
    moduleId: string;
    stateFrom: string;
    stateTo: string;
    timestamp: Date;
    reason: string | null;
    context: unknown;
}[]>;
