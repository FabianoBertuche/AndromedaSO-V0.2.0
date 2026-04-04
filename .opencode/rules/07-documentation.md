# SDD Documentation Rule — Atualize Documentação Sempre

## REGRA ABSOLUTA

Após completar cada task obrigatória, **atualizar documentação é OBRIGATÓRIO**.

## O Que Atualizar

### 1. tasks.md (IMEDIATO)

Marque a task como completa:
```markdown
- [x] 1. Task description — COMPLETO
```

### 2. docs/implemented-features.md (AO COMPLETAR SPEC)

Se a feature inteira foi completada, mova para a seção "Implementado":

```markdown
## {feature-name} ✅ COMPLETO

**Spec:** `.kiro/specs/{feature-name}/`
**Data:** {YYYY-MM-DD}

### O que foi feito
- {descrição}
```

### 3. CHANGELOG.md (SE EXISTIR)

```markdown
## {YYYY-MM-DD}

### {feature-name}
- {o que foi feito}
```

### 4. Comentários no Código (SE RELEVANTE)

Para decisões técnicas importantes, adicione comentário:
```typescript
// Decision: {descrição} (SDD: {spec-name})
```

## Checklist de Documentação

Ao final de cada task:

- [ ] `tasks.md` atualizado com `[x]`?
- [ ] `docs/implemented-features.md` atualizado (se completo)?
- [ ] `CHANGELOG.md` atualizado (se existir)?
- [ ] Comentários relevantes adicionados?

## Problema: Documentação Não Atualizada

Se você completar uma task e NÃO atualizar documentação, isso é violação da regra.

## Fluxo

```
Task completa → tsc --noEmit ✅ → npm run test ✅ → ATUALIZAR DOCS → Marcar [x] → Commit
```

---

**Documentação atualizada = trabalho completo.**
