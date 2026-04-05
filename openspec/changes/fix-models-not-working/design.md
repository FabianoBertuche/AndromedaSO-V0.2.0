## Context

The backend API's POST /api/providers endpoint incorrectly prevents creating multiple providers of different types. When a user tries to add a new AI provider (e.g., Ollama, Azure OpenAI), the endpoint returns "Provider already exists" even when no provider of that type exists.

**Current Behavior:**
- `ProviderOrchestratorService.createProvider()` at line 87 only checks `findByName(normalizedName)`
- If any provider exists with the same normalized name, it throws "Provider already exists"
- This prevents having multiple providers of different types (e.g., "openai" type provider and "ollama" type provider can coexist)

**Root Cause:**
The duplicate check is too strict. It should check for duplicate by (name, type) combination, not just name.

**Additional Issue:**
TypeScript errors in `lifecycleOrchestrator.test.ts` need resolution (7 errors related to fast-check arbitrary definitions).

## Goals / Non-Goals

**Goals:**
- Fix POST /api/providers to correctly allow multiple providers of different types
- Fix TypeScript errors in `lifecycleOrchestrator.test.ts`
- Maintain backward compatibility (existing API contracts unchanged)

**Non-Goals:**
- No database schema changes
- No new features or capabilities
- Not addressing React Query/browser cache issues (marked as optional in proposal)

## Decisions

### Decision 1: Fix provider duplicate check logic

**Choice:** Check for duplicate by (name, type) combination instead of just name.

**Rationale:** 
- A user should be able to have multiple providers, e.g., "my-ollama" (type: ollama) and "my-openai" (type: openai)
- Only providers with the exact same name AND type should be considered duplicates
- The `ProviderRepository` interface needs a new method `findByNameAndType` or we need to filter locally

**Implementation approach:**
```typescript
// In ProviderOrchestratorService.createProvider():
const existingByName = await this.repository.findByName(normalizedName);
if (existingByName && existingByName.type === config.type) {
  throw new Error('Provider already exists');
}
```

This ensures:
- Same name + same type → duplicate (throw error)
- Same name + different type → allowed (different provider)
- Different name + same/different type → allowed

**Alternative considered:** Create a new `findByNameAndType` repository method
- Rejected: Filtering locally is simpler and maintains repository interface consistency

### Decision 2: TypeScript errors in test file

**Choice:** Add missing `state` property to fast-check arbitrary definitions and use valid semver strings directly.

**Rationale:**
- The `ModuleRegistryRecord` type requires a `state` property
- The `pattern` constraint in fast-check `fc.string()` is not supported in current TypeScript types
- Use `fc.constantFrom` with valid semver strings instead

**Fix:**
```typescript
const validModuleArbitrary: fc.Arbitrary<ModuleRegistryRecord> = fc.record({
  // ... existing fields
  state: fc.constantFrom('discovered', 'registered', 'validated', 'loaded', 'running', 'stopped', 'error'),
  // For version, use: fc.string({ minLength: 5 }) with manual validation filter
});
```

## Risks / Trade-offs

[Risk] None identified - this is a straightforward bug fix with clear implementation path.

## Migration Plan

1. **Deploy:** Direct deployment - no migration needed (no schema changes)
2. **Rollback:** Revert to previous `createProvider` implementation if issues arise
3. **Testing:** Run existing integration tests to verify fix doesn't break anything

## Open Questions

None - implementation path is clear from the bug description.
