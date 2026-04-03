# Deploy Guide - Matrix Ops

## Visual Vibe

- Neon terminal aesthetic for operator scripts.
- Matrix green status markers for runtime checks.
- Production checklist-first workflow.

## Core Commands

```powershell
.\deploy.ps1
.\validate.ps1
```

## Live Endpoints

- Frontend: `http://localhost:5173`
- API Health: `http://localhost:4000/health`
- API Status: `http://localhost:4000/api/status`

## Notes

- Frontend is served by nginx with SPA fallback.
- API-like paths are proxied to kernel service.
- PostgreSQL and Redis are started with persistent volumes and healthchecks.
