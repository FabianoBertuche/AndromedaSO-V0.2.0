# SDD Rules — Regras Obrigatórias de Desenvolvimento

Estas regras são OBRIGATÓRIAS e têm precedência sobre qualquer outra instrução.
Não há exceções. Não há interpretação. Siga exatamente.

---

## REGRA 1: Nunca implemente sem spec

PROIBIDO escrever código para uma feature sem que exista um spec aprovado em `.kiro/specs/{feature-name}/`.

Um spec válido contém TODOS os três arquivos:
- `requirements.md` — o que fazer
- `design.md` — como fazer
- `tasks.md` — lista de tasks

Se qualquer um desses arquivos estiver ausente, PARE e informe o usuário.

---

## REGRA 2: Leia o spec completo antes de escrever qualquer linha de código

Ordem obrigatória de leitura:
1. `requirements.md` — entenda os critérios de aceitação
2. `design.md` — entenda a arquitetura e o código exato a implementar
3. `tasks.md` — execute na ordem definida

PROIBIDO pular etapas ou reordenar tasks.

---

## REGRA 3: Implemente EXATAMENTE o que o design especifica

Se o `design.md` mostra o conteúdo exato de um arquivo, use esse conteúdo.
PROIBIDO "melhorar", "simplificar" ou "refatorar" além do que o design especifica.
PROIBIDO adicionar dependências não listadas no design.
PROIBIDO criar arquivos não listados no design.

---

## REGRA 4: Verifique compilação após cada task

Após cada task obrigatória (sem `*`):
- Backend: `tsc --noEmit` em `core/kernel/` deve passar sem erros
- Frontend: `tsc --noEmit` em `frontend/` deve passar sem erros

Se houver erros de compilação, corrija ANTES de avançar para a próxima task.

---

## REGRA 5: Não quebre o que já funciona

PROIBIDO alterar contratos de API existentes (endpoints, tipos, interfaces).
PROIBIDO remover exports existentes.
PROIBIDO alterar testes existentes que estão passando.

Se uma mudança for necessária e não estiver no design, PARE e informe o usuário.

---

## REGRA 6: Siga as convenções do projeto sem exceção

Backend (`core/kernel/`):
- Imports locais com extensão `.js` (ESM)
- Logger Pino nomeado: `pino({ name: 'nome-do-modulo' })`
- Sem `console.log`, `console.warn`, `console.error` — use sempre Pino
- Sem Prisma — apenas Drizzle ORM
- Sem `any` no TypeScript sem comentário justificando

Frontend (`frontend/`):
- Sem bibliotecas de UI externas (shadcn, mui, chakra, etc.)
- TailwindCSS para estilo — visual neon matrix (verde/ciano sobre fundo escuro)
- TanStack React Query para data fetching
- Sem `fetch` direto nos componentes — use hooks de `useProviders.ts` ou funções de `kernel.ts`

---

## REGRA 7: Marque tasks como concluídas

Ao concluir uma task, atualize o `tasks.md` mudando `- [ ]` para `- [x]`.
Ao iniciar uma task, mude para `- [-]`.

---

## REGRA 8: Relate problemas imediatamente

Se encontrar qualquer situação não coberta pelo design:
- PARE a implementação
- Descreva o problema claramente
- Aguarde instrução do usuário

PROIBIDO tomar decisões arquiteturais por conta própria.

---

## REGRA 9: Testes opcionais são opcionais de verdade

Tasks marcadas com `*` são opcionais. Implemente apenas se o usuário pedir explicitamente.
Não implemente testes opcionais para "completar" o spec — foque nas tasks obrigatórias.

---

## REGRA 10: O CONTEXT.md é o ponto de entrada

Cada spec tem um `CONTEXT.md` que resume tudo. Leia-o primeiro.
Se não existir, leia `requirements.md` → `design.md` → `tasks.md` nessa ordem.

---

## Checklist antes de começar qualquer implementação

- [ ] Li o CONTEXT.md (ou requirements + design + tasks)
- [ ] Entendo todos os critérios de aceitação do requirements.md
- [ ] Sei exatamente quais arquivos criar/modificar (listados no design.md)
- [ ] Não vou adicionar nada além do que está no design
- [ ] Tenho o ambiente configurado (Docker infra rodando, .env correto)
