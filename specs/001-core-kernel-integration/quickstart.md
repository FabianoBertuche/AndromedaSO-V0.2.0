# Quickstart: Core Kernel Integration

## Prerequisites

- Node.js 20+
- Docker / Docker Compose
- PostgreSQL e Redis disponíveis via `docker-compose.infra.yml`

## Local setup

1. Selecionar a branch da feature.

```bash
git checkout 001-core-kernel-integration
```

2. Subir a infraestrutura local.

```bash
docker-compose -f docker-compose.infra.yml up -d
```

3. Instalar dependências do kernel e iniciar o serviço.

```bash
cd core/kernel
npm install
npm run dev
```

4. Opcionalmente, iniciar o frontend em outra sessão.

```bash
cd frontend
npm install
npm run dev
```

## Required environment

- `DATABASE_URL` apontando para PostgreSQL 15
- `REDIS_URL` apontando para Redis 7
- `PROVIDER_REPOSITORY_MODE` configurado conforme o modo local desejado, se aplicável

## Smoke test

1. Confirmar que existe uma árvore de módulo válida, por exemplo `modules/providers/` com `module.manifest.yaml`.
2. Executar discovery:

```bash
curl -X POST http://localhost:4000/api/modules/discover -H "content-type: application/json" -d '{"rootPath":"C:/FB/Andromeda SO V0.2.0/modules"}'
```

3. Listar módulos registrados:

```bash
curl http://localhost:4000/api/modules
```

4. Validar um módulo descoberto:

```bash
curl -X POST http://localhost:4000/api/modules/<module-id>/validate
```

5. Carregar e iniciar o módulo:

```bash
curl -X POST http://localhost:4000/api/modules/<module-id>/load
curl -X POST http://localhost:4000/api/modules/<module-id>/start
curl http://localhost:4000/api/modules/<module-id>/status
```

## Verification

Rodar as verificações mínimas do backend:

```bash
cd core/kernel
npx tsc --noEmit
npm run test
```

## References

- `specs/001-core-kernel-integration/plan.md`
- `specs/001-core-kernel-integration/research.md`
- `specs/001-core-kernel-integration/data-model.md`
- `specs/001-core-kernel-integration/contracts/module-runtime-api.md`
- `specs/001-core-kernel-integration/contracts/module-manifest.md`
