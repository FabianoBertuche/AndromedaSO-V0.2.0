## 1. Fix Provider Creation Logic

- [ ] 1.1 Update `createProvider` in `providerOrchestratorService.ts` to check for duplicate by (name, type) combination
- [ ] 1.2 Add type comparison in the existing provider check
- [ ] 1.3 Verify fix by running TypeScript compiler

## 2. Fix TypeScript Errors in Test File

- [ ] 2.1 Add missing `state` property to `validModuleArbitrary` in `lifecycleOrchestrator.test.ts`
- [ ] 2.2 Fix version string arbitrary (remove unsupported `pattern` constraint)
- [ ] 2.3 Add missing `state` property to all `invalidModuleArbitrary` definitions
- [ ] 2.4 Run TypeScript compiler to verify all 7 errors are resolved

## 3. Verify Implementation

- [ ] 3.1 Run `npx tsc --noEmit` in `core/kernel` to confirm zero TypeScript errors
- [ ] 3.2 Run existing integration tests to ensure no regressions
