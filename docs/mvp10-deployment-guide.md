# MVP10 Deployment Guide

## Scope
Este guia cobre deploy do Core Kernel com os recursos MVP10 (T051-T060) habilitados.

## Pre-requisitos
- Node.js 20+
- npm 10+
- Docker (opcional para Postgres/Redis locais)
- Variaveis de ambiente do kernel configuradas

## 1) Validacao local
No diretorio `core/kernel`:

```bash
npm install
npm test
npm run build
```

Resultado esperado:
- Testes passando (58/58 ou superior)
- Build TypeScript sem erro

## 2) Start da aplicacao

```bash
npm start
```

Verifique saude:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/status
```

## 3) Endpoints MVP10 para smoke test
- `POST /agents/:id/version/snapshot`
- `GET /agents/:id/version/diff`
- `POST /agents/:id/version/rollback`
- `POST /agents/:id/performance/record`
- `GET /agents/:id/performance`
- `GET /agents/:id/reputation`
- `POST /agents/:id/budget/set`
- `POST /agents/:id/budget/spend`
- `GET /dashboard/costs`
- `POST /tasks/:id/feedback`
- `GET /agents/:id/suggestions`
- `POST /eval/run`

## 4) Persistencia e seguranca
- Em ambiente local sem Postgres, o kernel opera com fallback in-memory (logs de warning esperados).
- Em producao, configurar Postgres e Redis para evitar perda de trilha historica.
- Definir limites de budget por agente antes de ativar rotas de execucao.

## 5) Checklist de deploy
- [ ] `npm test` passou no pipeline
- [ ] `npm run build` passou no pipeline
- [ ] `/health` e `/status` retornando 200
- [ ] Dashboard carregando em `/dashboard/costs`
- [ ] `POST /eval/run` retornando 50 resultados
- [ ] Rollback de versao validado em ambiente de staging

## 6) Rollback operacional
Se houver regressao apos deploy:
1. Chamar `POST /agents/:id/version/rollback` para reverter configuracao do agente.
2. Reaplicar limite de budget com `POST /agents/:id/budget/set`.
3. Reexecutar `POST /eval/run` para confirmar score medio esperado.

## 7) Observabilidade recomendada
- Monitorar taxa de `429` por agente para tuning de budget.
- Monitorar variacao de `averageScore` nas execucoes de eval.
- Revisar sugestoes em `GET /agents/:id/suggestions` semanalmente.
