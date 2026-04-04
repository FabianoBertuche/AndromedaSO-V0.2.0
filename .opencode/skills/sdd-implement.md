---
name: sdd-implement
description: Workflow completo para implementar tasks de um spec aprovado. Use quando o usuário pedir para implementar algo ou continuar implementação.
---

# SDD Implement Workflow

## Quando Usar

- Usuário pede para "implementar", "codar", "fazer" algo
- Usuário pede para "continuar" uma implementação
- Após spec ser aprovada e pronta para implementation

## Pré-Condição

Um spec válido deve existir em `.kiro/specs/{feature-name}/` com:
- `requirements.md` ✓
- `design.md` ✓
- `tasks.md` ✓

Se não existir, use a skill `sdd-propose.md` primeiro.

---

## Workflow

### Passo 1: Anunciar

```
## Implementando: {feature-name}

Spec: .kiro/specs/{feature-name}/
Progresso: N/M tasks completas
```

### Passo 2: Ler Spec Completa

Leia na ordem:
1. `CONTEXT.md` (se existir)
2. `requirements.md`
3. `design.md`
4. `tasks.md`

Confirme: "Entendo todas as tasks e o que cada uma requer."

### Passo 3: Executar Tasks

Para cada task pendente (`- [ ]` ou `- [-]`):

```
### Task N/M: {descrição}
```

1. **Implementar** — código conforme design
2. **Compilar Backend** — `cd core/kernel && npx tsc --noEmit`
3. **Testes Backend** — `cd core/kernel && npm run test`
4. **Compilar Frontend** — `cd frontend && npx tsc --noEmit` (se aplicável)
5. **Testes Frontend** — `cd frontend && npm run test` (se aplicável)
6. **Atualizar Documentação** — ver seção abaixo
7. **Marcar** — `- [-]` → `- [x]` quando completa

### Passo 4: Commit

Após completar TODAS as tasks obrigatórias:

```bash
git add -A
git commit -m "{feature}: {descrição clara do que foi feito}

- Task 1: {o que foi feito}
- Task 2: {o que foi feito}
- Tests: all passing
- Docs: updated"
```

### Passo 5: Perguntar sobre Git Push

```
## Trabalho Concluído

**Feature:** {feature-name}
**Tasks:** N/M completas
**Compilação:** ✅ Backend, ✅ Frontend
**Testes:** ✅ Backend, ✅ Frontend
**Documentação:** ✅ Atualizada
**Commit:** ✅ Criado

### Pronto para GitHub?

commits pendentes:
- {commit 1}
- {commit 2}

Quer que eu faça `git push --all` para subir todos os commits?
```

---

## Atualização de Documentação (OBRIGATÓRIO)

Após cada task completa, atualize:

1. **tasks.md** — marque task como `[x]`
2. **docs/implemented-features.md** — se feature completa, mova da seção "Pendente" para "Implementado"
3. **CHANGELOG.md** — se existir, adicione entrada

### Formato para docs/implemented-features.md

```markdown
## {feature-name} 🔄 Em Progresso

**Spec:** `.kiro/specs/{feature-name}/`
**Data:** {data}

### Progresso
- [x] Task 1 — {descrição}
- [x] Task 2 — {descrição}
- [ ] Task 3 — pendente

### O que foi feito
- {descrição}
```

Quando COMPLETO:

```markdown
## {feature-name} ✅ COMPLETO

**Spec:** `.kiro/specs/{feature-name}/`
**Data:** {data}

### O que foi feito
- {descrição}
```

---

## Erros

Se erro de compilação: corrija antes de avançar.
Se teste falhando: corrija antes de avançar.
Se task não clara: PARE e pergunte.
Se design problema: PARE e reporte.

---

## Checklist

- [ ] Anunciei o início
- [ ] Li todos os arquivos de spec
- [ ] Implementei cada task exatamente como no design
- [ ] Verifiquei compilação (tsc --noEmit) após cada task
- [ ] Rodei testes (npm run test) após cada task
- [ ] Atualizei documentação após cada task
- [ ] Marquei tasks ao completar
- [ ] Criei commit com boa descrição
- [ ] Perguntei sobre git push
- [ ] Reportei conclusão
