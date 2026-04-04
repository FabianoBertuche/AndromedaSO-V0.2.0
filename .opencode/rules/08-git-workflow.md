# SDD Git Workflow Rule — Commit e Push

## Commit (Automático)

Após completar todas as tasks obrigatórias de uma feature/session:

### 1. Staging

```bash
git add -A
```

### 2. Commit Message (Formato Obrigatório)

```
{type}: {descrição curta}

- {detail 1}
- {detail 2}
- {detail 3}
- Tests: {passing/failing}
- Docs: {updated/not updated}
```

#### Tipos de Commit

| Tipo | Uso |
|------|-----|
| `feat` | Nova feature |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `refactor` | Refatoração (só se design permitir) |
| `test` | Testes |
| `chore` | Tarefas gerais |

#### Exemplo

```
feat: add provider delete endpoint

- DELETE /api/providers/:id endpoint created
- Confirmation dialog component added
- useDeleteProvider hook implemented
- Tests: 3 passing
- Docs: implemented-features.md updated
```

---

## Push (Com Confirmação)

### REGRA: PERGUNTE ANTES DE PUSHAR

Após criar commits, SEMPRE pergunte:

```
## Git Push Necessário

Commits pendentes:
1. abc1234 — feat: add provider delete endpoint
2. def5678 — fix: resolve provider list race condition

Repos: origin (main)

### Opções:
1. ✅ Sim, fazer `git push --all` (recomendado)
2. 📝 Sim, mas primeiro ver os commits (`git log`)
3. ❌ Não, deixar para depois
4. 🔍 Não, há algo errado nos commits

O que prefere?
```

### Se Usuário Aprovar

```bash
git push --all
git push --tags  # se houver tags
```

### Se Usuário Rejeitar

Registre os commits pendentes e aguarde instrução.

---

## Commits Anteriores

Se houver commits não pushados de sessões anteriores:

1. Liste todos: `git log --oneline origin/main..HEAD`
2. Inclua na pergunta ao usuário
3. Se aprovado, push ALL: `git push --all`

---

## Checklist Git

- [ ] Commits criados com formato correto?
- [ ] Usuário consultado sobre push?
- [ ] Se aprovado: push realizado?
- [ ] Commits anteriores também incluídos?
