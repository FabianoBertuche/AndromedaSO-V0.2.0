import { describe, it, expect } from 'vitest';
import { validateModuleContract, moduleContractIsCompatible } from '../../../src/contracts/moduleContract.schema';
describe('module contract schema', () => {
    it('validates a correct contract', () => {
        const contract = {
            input: './input.schema.ts',
            output: './output.schema.ts',
            version: '1.2.3'
        };
        const result = validateModuleContract(contract);
        expect(result).toEqual(contract);
    });
    it('rejects contract with missing input/output', () => {
        const contract = { input: './input.schema.ts' };
        expect(() => validateModuleContract(contract)).toThrow();
    });
    it('considers same major version compatible', () => {
        expect(moduleContractIsCompatible({ input: 'a', output: 'b', version: '2.1.0' }, { input: 'a', output: 'b', version: '2.5.0' })).toBe(true);
    });
    it('considers different major version incompatible', () => {
        expect(moduleContractIsCompatible({ input: 'a', output: 'b', version: '1.0.0' }, { input: 'a', output: 'b', version: '2.0.0' })).toBe(false);
    });
});
//# sourceMappingURL=moduleContract.spec.js.map