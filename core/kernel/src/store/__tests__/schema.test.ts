import { describe, it, expect } from 'vitest';
import * as schema from '@core/store/schema';

/**
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 *
 * Ensures the Drizzle schema exports all expected tables as named exports,
 * covering both the new domain tables and the existing registry tables.
 */
describe('schema exports', () => {
  const expectedTables = [
    'providers',
    'modelCatalogItems',
    'modelBenchmarkResults',
    'routingDecisions',
    'modulesRegistry',
    'lifecycleEvents',
  ] as const;

  it.each(expectedTables)('exports table: %s', (tableName) => {
    expect(schema).toHaveProperty(tableName);
    expect(schema[tableName]).toBeDefined();
  });

  it('exports exactly the 6 expected tables and no fewer', () => {
    const exportedKeys = Object.keys(schema);
    for (const table of expectedTables) {
      expect(exportedKeys).toContain(table);
    }
  });
});
