# Andromeda OS v0.2.1 - Production Deploy Guide

```text
    _   _   _   _   _   _   _   _   _
   / \ / \ / \ / \ / \ / \ / \ / \ / \
  ( A | N | D | R | O | M | E | D | A )
   \_/ \_/ \_/ \_/ \_/ \_/ \_/ \_/ \_/
```

## Neon Terminal Runbook

- Matrix green status badges: healthchecks for all containers.
- One-click setup: `./deploy.ps1`.
- Production ports:
  - Frontend: `http://localhost:5173`
  - API: `http://localhost:4000`
  - PostgreSQL: `localhost:5433`
  - Redis: `localhost:6380`

## 1) Prepare env

```powershell
Copy-Item .env.prod.example .env.prod
```

## 2) Deploy (1-click)

```powershell
.\deploy.ps1
```

## 3) Validate production checklist

```powershell
.\validate.ps1
```

## Production Checklist

- [x] `docker compose -f docker-compose.prod.yml up -d --build`
- [x] `localhost:5173` responds with frontend app
- [x] `localhost:4000/api/status` returns JSON 200
- [x] Budget overrun returns `429`
- [x] PostgreSQL volume persists (`postgres_data`)

## Simulated logs

```text
[andromeda-kernel-prod] Core/Kernel API running at http://0.0.0.0:4000
[andromeda-kernel-prod] GET /health 200
[andromeda-frontend-prod] nginx: started worker process
[andromeda-postgres-prod] database system is ready to accept connections
[andromeda-redis-prod] Ready to accept connections
```

## Matrix Status Badges

- KERNEL: ONLINE
- FRONTEND: ONLINE
- POSTGRES: ONLINE
- REDIS: ONLINE

Production metrics dashboard is available through app runtime routes and status cards.
