# Spec: Phase 9 - Benchmark & Hardening

## Contexto
Baseline Phase 8 capturada. Otimizar performance + safety gaps.

## GIVEN sistema pós-Phase 8 (39 testes PASS)
## WHEN aplicar hardening + config thresholds
## THEN benchmark +20% + PG obrigatório + alertas webhook-ready

## Critérios de Aceitação (T045-T050)
- [ ] T045: Thresholds configuráveis (env: STORM_THRESHOLD=5, STARTUP_MAX=10s)
- [ ] T046: PG persistência obrigatória (sem fallback memória em prod)
- [ ] T047: Alertas Prometheus format (/metrics com retry_storm_total)
- [ ] T048: Benchmark suite (autocannon 1000 req/s, registry/list/start)
- [ ] T049: Load test sem retry storm (safety ativa)
- [ ] T050: Relatório final phase9.md vs phase8 (+20% perf)

## Fora do Escopo
- UI dashboard (MVP10)
- External monitoring (Grafana)

# Spec Phase 9: Hardening

GIVEN Phase 8 baseline
WHEN thresholds config + PG required + webhook alerts
THEN +20% perf + 0 errors em load test

T045-T050:
- T045: env STORM_THRESHOLD=5
- T046: PG obrigatório (no fallback)
- T047