import { z } from 'zod';
const semverRegExp = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;
export const moduleContractSchema = z.object({
    input: z.string().min(1),
    output: z.string().min(1),
    version: z.string().regex(semverRegExp).optional()
});
export function validateModuleContract(contract) {
    return moduleContractSchema.parse(contract);
}
export function moduleContractIsCompatible(existing, candidate) {
    if (!existing.version || !candidate.version) {
        return true;
    }
    const parseSemver = (v) => {
        const [core] = v.split(/[+-]/); // ignore prerelease/build tags
        const [major, minor, patch] = core.split('.').map((n) => Number(n));
        return { major, minor, patch };
    };
    const a = parseSemver(existing.version);
    const b = parseSemver(candidate.version);
    return a.major === b.major;
}
//# sourceMappingURL=moduleContract.schema.js.map