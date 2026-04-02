# Quickstart: Core Kernel Integration

## Requisitos
- Node.js 20+
- Docker/Docker Compose
- PostgreSQL 15+
- Redis 7+

## Setup local

1. Clone o repo e vá para o branch:

```bash
git checkout 001-core-kernel-integration
npm install
```

2. Iniciar dependências:

```bash
docker compose -f docker-compose.yml up -d postgres redis
```

3. Configurar variáveis de ambiente:

```bash
export DATABASE_URL=postgres://andromeda:andromeda@localhost:5432/andromeda
export REDIS_URL=redis://localhost:6379
export NODE_ENV=development
```

4. Executar migrações (exemplo Drizzle):

```bash
npm run migrate
```

5. Iniciar o core/kernel:

```bash
npm run start:core-kernel
```

## Smoke test

1. Criar módulo de teste em `modules/demo-module` com `module.manifest.yaml` válido.
2. Disparar `http GET :3000/api/modules/discover`.  
3. Verificar `http GET :3000/api/modules` contém o módulo e status `registered`.
4. Validar contrato com `http POST :3000/api/modules/{id}/validate`.
5. Carregar/inicializar e verificar `running`.

## Notas
- Para desenvolvimento rápido, use `npm run dev` com `NODE_ENV=development` (não padrão de produção).
- Para reset de estado: `docker compose -f docker-compose.yml down -v` e reiniciar as dependências.
