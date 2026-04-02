import { z } from 'zod';
export declare const moduleContractSchema: z.ZodObject<{
    input: z.ZodString;
    output: z.ZodString;
    version: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    input: string;
    output: string;
    version?: string | undefined;
}, {
    input: string;
    output: string;
    version?: string | undefined;
}>;
export type ModuleContract = z.infer<typeof moduleContractSchema>;
export declare function validateModuleContract(contract: unknown): {
    input: string;
    output: string;
    version?: string | undefined;
};
export declare function moduleContractIsCompatible(existing: ModuleContract, candidate: ModuleContract): boolean;
