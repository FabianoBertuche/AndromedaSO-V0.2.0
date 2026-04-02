import { z } from 'zod';
export declare const moduleManifestSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    group: z.ZodString;
    variant: z.ZodString;
    version: z.ZodString;
    entrypoint: z.ZodString;
    contracts: z.ZodOptional<z.ZodObject<{
        input: z.ZodString;
        output: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        input: string;
        output: string;
    }, {
        input: string;
        output: string;
    }>>;
    capabilities: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["active", "disabled", "deprecated"]>>>;
    critical: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    dependencies: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "disabled" | "deprecated";
    version: string;
    id: string;
    name: string;
    group: string;
    variant: string;
    entrypoint: string;
    capabilities: string[];
    critical: boolean;
    dependencies: string[];
    contracts?: {
        input: string;
        output: string;
    } | undefined;
}, {
    version: string;
    id: string;
    name: string;
    group: string;
    variant: string;
    entrypoint: string;
    status?: "active" | "disabled" | "deprecated" | undefined;
    contracts?: {
        input: string;
        output: string;
    } | undefined;
    capabilities?: string[] | undefined;
    critical?: boolean | undefined;
    dependencies?: string[] | undefined;
}>;
export type ModuleManifest = z.infer<typeof moduleManifestSchema>;
export declare function validateModuleManifest(manifest: unknown): {
    status: "active" | "disabled" | "deprecated";
    version: string;
    id: string;
    name: string;
    group: string;
    variant: string;
    entrypoint: string;
    capabilities: string[];
    critical: boolean;
    dependencies: string[];
    contracts?: {
        input: string;
        output: string;
    } | undefined;
};
