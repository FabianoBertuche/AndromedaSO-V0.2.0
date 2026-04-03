# Implementation Plan Phase 9 - Zero-Shot Ready

## Fase 1: Config Thresholds (T045) 30min
packages/api/src/config/safety.ts (NOVO)
```ts
export const SAFETY_CONFIG = {
  STORM_THRESHOLD: parseInt(process.env.STORM_THRESHOLD || '5'),
  STARTUP_MAX_MS: parseInt(process.env.STARTUP_MAX_MS || '10000'),
  REGISTRY_GROWTH_MB: parseInt(process.env.REGISTRY_GROWTH_MB || '500')
};
```
safetyMonitor.ts UPDATE: use SAFETY_CONFIG

## Fase 2: PG Obrigatório (T046) 1h
postgresRegistry.ts UPDATE: throw se !PG_URL em prod
.env: PG_URL obrigatório

## Fase 3: Prometheus Alerts (T047) 45min
metrics.ts UPDATE:
```ts
registry.set('retry_storm_total', new Gauge({ help: 'Retry storm alerts' }));
```
Teste: curl /metrics | grep retry_storm

## Fase 4: Benchmark Suite (T048-T049) 1h
package.json UPDATE:
```json
"benchmark": "autocannon -c 10 -d 30 http://localhost:3000/metrics"
```
npm i -D autocannon
benchmark.js (NOVO): teste load 1000 req/s + assert sem storm

## Fase 5: Relatório Final (T050)
npm run benchmark > docs/benchmark/phase9.md
diff phase8 phase9 → +20%

## Commit Gates
- npm test 39/39
- curl /metrics → retry_storm_total presente
- npm run benchmark → requests/sec > baseline
