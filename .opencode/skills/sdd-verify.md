---
name: sdd-verify
description: Verificar se implementação_matches spec. Use quando o usuário quiser validar que o código está correto.
---

# SDD Verify Workflow

## Quando Usar

- Após completar implementação
- Antes de archivar um spec
- Quando usuário questiona se está certo
- Durante code review

## O Que Faz

Verifica que a implementação está correta e completa segundo o spec.

---

## Workflow

### Passo 1: Identificar Spec

Determine qual spec verificar:
- Específico: `.kiro/specs/{feature-name}/`
- Ou pergunte: "Qual spec você quer verificar?"

### Passo 2: Ler Spec

1. `requirements.md` — critérios de aceitação
2. `design.md` — arquitetura e código
3. `tasks.md` — lista de tasks

### Passo 3: Checklist de Verificação

Para cada requirement:
```
[ ] Requisito: {descrição}
    - Implementado em: {arquivo}:{linha}
    - Correto: ✅ ou ❌
```

### Passo 4: Verificar Tasks

```
Tasks em tasks.md:
- [x] Task 1 — ✅ Implementada
- [x] Task 2 — ✅ Implementada
- [ ] Task 3 — ❌ Não implementada
```

### Passo 5: Compilação

```bash
cd core/kernel && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

### Passo 6: Testes

```bash
cd core/kernel && npm run test
cd frontend && npm run test
```

### Passo 7: Reportar

```
## Verificação: {feature-name}

### Requirements
- [✅] Requisito 1 — Implementado
- [❌] Requisito 2 — FALTANDO

### Tasks
- [✅] 5/7 completas
- [❌] 2 pendientes

### Compilação
- Backend: ✅ Passou
- Frontend: ✅ Passou

### Status
🟡 **PARCIAL** — 2 tasks pendentes

**Ação necessária:** Implementar tasks 3 e 5
```

---

## Status Possíveis

| Status | Significado |
|--------|-------------|
| 🟢 COMPLETE | Tudo implementado, compilando, testes passando |
| 🟡 PARTIAL | Parcialmente implementado, tasks pendientes |
| 🔴 FAILED | Problemas sérios, não compilando |

---

## Checklist

- [ ] Li requirements.md
- [ ] Li design.md
- [ ] Li tasks.md
- [ ] Verifiquei cada requirement
- [ ] Verifiquei cada task
- [ ] Compilação passou
- [ ] Testes passaram
- [ ] Reportei status
