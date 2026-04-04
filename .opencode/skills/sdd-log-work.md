---
name: sdd-log-work
description: Documentar/logar trabalho feito. Use para registrar decisões, problemas e progresso.
---

# SDD Log Work Workflow

## Quando Usar

- Ao completar uma sessão de trabalho
- Ao encontrar problema ou decisão importante
- Ao finalizar uma feature
- Para manter histórico do projeto

## O Que Faz

Registra o que foi feito, decidido, e quaisquer problemas encontrados.

---

## Formato de Log

```markdown
## Log — {data}

### Trabalho Realizado
- Task 1 ✅ — {breve descrição do que foi feito}
- Task 2 ✅ — {breve descrição}

### Decisões Tomadas
- Decisão 1: {descrição} → {rationale}
- Decisão 2: {descrição} → {rationale}

### Problemas Encontrados
- Problema 1: {descrição} → {solução ou aberto}
- Problema 2: {descrição} → {solução ou aberto}

### Documentação Atualizada
- docs/implemented-features.md ✅
- .kiro/specs/{feature}/tasks.md ✅

### Git Status
- Commits criados: {N}
- Pendentes de push: {lista}

### Próximos Passos
- [ ] Task pendente 1
- [ ] Task pendente 2
```

## Onde Registrar

### 1. tasks.md (IMEDIATO)

Ao marcar task como `[x]`, adicione nota se relevante:
```markdown
- [x] 1. Task description — COMPLETO: {nota}
```

### 2. docs/implemented-features.md

Para features completas:
```markdown
## {feature-name} ✅
**Data:** {YYYY-MM-DD}
**Spec:** `.kiro/specs/{feature-name}/`

### O que foi feito
- Item 1
- Item 2
```

### 3. CHANGELOG.md (SE EXISTIR)

```markdown
## {YYYY-MM-DD}
### {feature-name}
- {mudança}
```

### 4. Comentários no Código

```typescript
// Decision: {descrição} (SDD: {spec-name})
// Problem: {descrição} → {solução}
// TODO: {descrição} (SDD: {spec-name})
```

## Para Problemas

```markdown
## Problema Registrado — {data}

**Spec:** {feature-name}
**Task:** N

**Problema:** {descrição}

**Impacto:** {bloqueia? afeta outras tasks?}

**Status:** ABERTO — aguardando {instrução}
```

## Git Log

Ao final da sessão, registre:

```markdown
### Commits Não Pushados

1. {hash} — {mensagem}
2. {hash} — {mensagem}

**Ação requerida:** git push --all
```

---

## Checklist de logging

- [ ] Registrei tasks completadas com notas
- [ ] Registrei decisões importantes
- [ ] Registrei problemas encontrados
- [ ] Atualizei docs/implemented-features.md
- [ ] Atualizei CHANGELOG.md se existir
- [ ] Registrei commits pendentes
- [ ] Reportei status ao usuário
```

---

## IMPORTANT

1. Read the existing files before modifying them (for update tasks)
2. Create new files with exact content shown
3. Use exact paths as specified

Base path: `C:\FB\Andromeda SO V0.2.0\`

Files to modify:
- `.opencode/rules/04-compilation-check.md` (APPEND new section)
- `.opencode/skills/sdd-implement.md` (REPLACE content)
- `.opencode/skills/sdd-log-work.md` (REPLACE content)

Files to create:
- `.opencode/rules/07-documentation.md`
- `.opencode/rules/08-git-workflow.md