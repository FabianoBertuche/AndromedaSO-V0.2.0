---
name: sdd-status
description: Verificar status dos specs do projeto. Use para saber o que está pendente.
---

# SDD Status Workflow

## Quando Usar

- No início de uma sessão
- Para planejar próximo trabalho
- Para responder "o que falta fazer?"
- Para verificar progresso geral

## O Que Faz

Escaneia `.kiro/specs/` e mostra status de todos os specs.

---

## Como Verificar

### Passo 1: Listar Specs

```bash
ls -la .kiro/specs/
```

### Passo 2: Para Cada Spec

Leia o `tasks.md` e conte:
- `- [ ]` = pendente
- `- [-]` = em progresso
- `- [x]` = completo
- `- [ ]*` = opcional pendente

### Passo 3: Compilar Relatório

```
## Status Geral dos Specs

| Spec | Tasks | Completo | Status |
|------|-------|----------|--------|
| kernel-consolidation | 7 | 5 | 🟡 71% |
| mvp04-frontend | 10 | 10 | 🟢 100% |
| local-dev-setup | 9 | 0 | ⚪ 0% |
| provider-management-v2 | 17 | 0 | ⚪ 0% |
```

### Passo 4: Specs Prioritárias

Liste specs com tasks pendentes (`- [ ]` sem `*`):
```
## Specs Prontas para Trabalho

1. **local-dev-setup** (9 tasks pendentes)
   - Mais simples, foco em ambiente
   
2. **provider-management-v2** (17 tasks pendentes)
   - Feature nova com OAuth
```

## Status Signs

| Sign | Significado |
|------|-------------|
| 🟢 | 100% completo |
| 🟡 | Em progresso (>0% e <100%) |
| ⚪ | Não iniciado (0%) |
| 🔴 | Bloqueado/problema |

## Atualização de Docs

Se feature completa, atualize `docs/implemented-features.md`:

```markdown
## {feature-name} ✅ COMPLETO

**Data:** {data}
**Spec:** `.kiro/specs/{feature-name}/`

### O que foi feito
- Item 1
- Item 2
```

---

## Checklist

- [ ] Liste todos os specs
- [ ] Conte tasks por status
- [ ] Calcule percentuais
- [ ] Identifique blockers
- [ ] Reporte prioritization
- [ ] Atualize docs se completo
