# Andromeda SO — Agent Rules

Este projeto usa **Spec-Driven Development (SDD)**. Todas as regras abaixo são OBRIGATÓRIAS.

---

## Contexto do projeto

- Backend: `core/kernel/` — Node.js 20, TypeScript ESM, Fastify 4, Drizzle ORM, PostgreSQL
- Frontend: `frontend/` — React 18, Vite 5, TailwindCSS 3, TanStack React Query 5
- Documentação: `docs/`, `.kiro/steering/`, `.kiro/specs/`

Leia antes de qualquer implementação:
- `.kiro/steering/tech.md` — stack e comandos
- `.kiro/steering/structure.md` — estrutura de pastas
- `.kiro/steering/opencode-workflow.md` — workflow completo

---

## REGRA 1: Nunca implemente sem spec

PROIBIDO escrever código sem spec aprovado em `.kiro/specs/{feature-name}/`.

Spec válido = `requirements.md` + `design.md` + `tasks.md` nos três presentes.

Se faltar qualquer arquivo: PARE e informe o usuário.

---

## REGRA 2: Leia o spec completo antes de escrever código

Ordem obrigatória:
1. `CONTEXT.md` (se existir) — resumo do spec
2. `requirements.md` — critérios de aceitação
3. `design.md` — arquitetura e código exato
4. `tasks.md` — execute na ordem definida

PROIBIDO pular etapas ou reordenar tasks.

---

## REGRA 3: Implemente EXATAMENTE o que o design especifica

- Se o design mostra código exato, use esse código
- PROIBIDO "melhorar", "simplificar" ou "refatorar" além do design
- PROIBIDO adicionar dependências não listadas no design
- PROIBIDO criar arquivos não listados no design

---

## REGRA 4: Verifique compilação após cada task obrigatória

```bash
# Backend
cd core/kernel && npx tsc --noEmit

# Frontend  
cd frontend && npx tsc --noEmit
```

Corrija erros ANTES de avançar para a próxima task.

---

## REGRA 5: Não quebre o que já funciona

- PROIBIDO alterar contratos de API existentes
- PROIBIDO remover exports existentes
- PROIBIDO alterar testes que estão passando

Se precisar mudar algo não coberto pelo design: PARE e informe o usuário.

---

## REGRA 6: Convenções obrigatórias

**Backend (`core/kernel/`):**
- Imports locais com extensão `.js` (ESM obrigatório)
- Logger: `pino({ name: 'nome-do-modulo' })` — sem `console.log`
- ORM: Drizzle — sem Prisma (foi removido)
- Sem `any` sem justificativa em comentário

**Frontend (`frontend/`):**
- Sem bibliotecas de UI externas (shadcn, mui, etc.)
- TailwindCSS — visual neon matrix (verde/ciano sobre fundo escuro)
- Data fetching via hooks em `useProviders.ts` ou funções em `kernel.ts`
- Sem `fetch` direto em componentes

---

## REGRA 7: Marque tasks ao executar

- Iniciando: `- [ ]` → `- [-]`
- Concluída: `- [-]` → `- [x]`

---

## REGRA 8: Problemas não cobertos pelo design = PARE

Se encontrar situação não coberta:
1. PARE a implementação
2. Descreva o problema claramente
3. Aguarde instrução

PROIBIDO tomar decisões arquiteturais por conta própria.

---

## REGRA 9: Tasks com `*` são opcionais

Implemente apenas se o usuário pedir explicitamente. Foque nas obrigatórias.

---

## REGRA 10: Foco em AGENTES, não em MODELOS (Lei Canônica)

Este projeto é um **sistema de agentes**, não um sistema de modelos.

### Lei Canônica Imutável:
- Toda comunicação (chat, API, canais) é feita **com o agente**, não com o modelo
- O **agente** é a entidade central - ele possui o modelo, systemPrompt, comportamento
- O **modelo** é apenas um detalhe de implementação configurável dentro do agente

### Exceção Permitida:
- Apenas na **aba "Model"** da interface de configuração de agentes o usuário pode selecionar modelos diretamente
- Todas as outras camadas devem tratar exclusivamente com agentes

### Implementação Obrigatória:
- **Backend**: Chat com agentes via `/api/agents/:id/chat` - nunca expor endpoints de chat com modelos diretamente para consumo de agentes
- **Frontend**: Hooks de chat devem enviar apenas `{ agentId, messages }`, nunca `{ modelId, messages }`
- **Futuros canais**: Qualquer novo canal de comunicação (WebSocket, Slack, Discord, etc.) deve conversar com agentes, não com modelos

### Invariantes:
- `agente.systemPrompt` → injetado automaticamente pelo backend como mensagem system
- `agente.preferredModel` → usado automaticamente pelo backend ao chamar provider
- Frontend nunca deve chamar `/api/providers/*` para聊天 com agentes
- Sistema de agentes deve funcionar mesmo que modelos sejam trocados - o agente mantém sua identidade

---

## Ambiente de desenvolvimento

```bash
# Subir infraestrutura (PostgreSQL + Redis)
docker-compose -f docker-compose.infra.yml up -d

# Backend com hot-reload
cd core/kernel && npm run dev

# Frontend
cd frontend && npm run dev

# Testes backend
cd core/kernel && npm run test

# Testes frontend
cd frontend && npm run test
```

Portas: kernel `:4000`, frontend `:5173`, PostgreSQL `:5432`, Redis `:6379`, Ollama `:11434`
