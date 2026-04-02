import { describe, it, expect } from 'vitest';
import { detectCircularDependencies } from '../../../src/validation/dependencyValidator';

describe('dependency validator', () => {
  it('detects cycles', () => {
    const manifests = [
      { id: 'a', dependencies: ['b'] },
      { id: 'b', dependencies: ['c'] },
      { id: 'c', dependencies: ['a'] }
    ] as any;

    expect(detectCircularDependencies(manifests)).toBe(true);
  });

  it('returns false with no cycles', () => {
    const manifests = [
      { id: 'a', dependencies: ['b'] },
      { id: 'b', dependencies: ['c'] },
      { id: 'c', dependencies: [] }
    ] as any;

    expect(detectCircularDependencies(manifests)).toBe(false);
  });
});
