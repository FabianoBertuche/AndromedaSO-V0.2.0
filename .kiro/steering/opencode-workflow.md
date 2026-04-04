# OpenCode Workflow Guide

## Papel do OpenCode neste projeto

O OpenCode é responsável exclusivamente pela **implementação**. O planejamento, análise, design e specs são produzidos pelo Kiro e ficam em `.kiro/specs/`.

---

## Antes de implementar qualquer coisa

Leia sempre estes arquivos primeiro:

1. `.kiro/steering/tech.md` — stack, versões, comandos
2. `.kiro/steering/structure.md` — estrutura de pastas e convenções
3. `.kiro/steering/product.md` — contexto do produto

---

## Como executar uma task

Cada feature tem um diretório em `.kiro/specs/{feature-name}/` com três arquivos:

- `requirements.md` — o que deve ser feito e por quê
- `design.md` — como deve ser feito (arquitetura, interfaces, modelos de dados)
- `tasks.md` — lista de tarefas ordenadas para implementar

### Fluxo de execução

1. Leia `requirements.md` e `design.md` completamente antes de escrever qualquer código
2. Execute as tasks na ordem definida em `tasks.md`
3. Tasks marcadas com `*` são opcionais — implemente apenas se o tempo permitir
4. Após cada task, verifique se o TypeScript compila sem erros (`tsc --noEmit`)
5. Após tasks de teste, rode `vitest run` para confirmar que passam

### Formato das tasks

```
- [ ] 1. Descrição da task        ← obrigatória
- [ ]* 2. Descrição opcional      ← opcional (tem asterisco)
- [x] 3. Task já concluída        ← não reimplementar
```

---

## Convenções de código obrigatórias

### Backend (`core/kernel/`)

- TypeScript ESM — todos os imports locais usam extensão `.js` (ex: `import { foo } from './bar.js'`)
- Pino logger nomeado por módulo: `pino({ name: 'nome-do-modulo' })`
- Zod para validação de entrada
- Drizzle ORM para banco — nunca usar Prisma (foi removido)
- Sem `console.log` — usar sempre o logger Pino
- Graceful degradation: se PostgreSQL não disponível, continuar com in-memory

### Frontend (`frontend/`)

- React 18 + TailwindCSS — visual neon matrix (verde/ciano sobre fundo escuro)
- TanStack React Query para data fetching
- Sem bibliotecas de UI externas (sem shadcn, mui, etc.)
- Componentes em `frontend/src/components/`
- Hooks em `frontend/src/hooks/`
- API calls em `frontend/src/api/kernel.ts`

---

## Estrutura de repositório de providers

O projeto usa dois repositórios para providers:

- **In-memory** (`provider.repository.memory.ts`) — usado em testes e quando PostgreSQL não está disponível
- **PostgreSQL** (`provider.repository.postgres.ts`) — usado em produção

A factory em `provider.repository.factory.ts` seleciona automaticamente baseado em `DATABASE_URL` e `PROVIDER_REPOSITORY_MODE`.

---

## Specs ativos (pendentes de implementação)

Verifique `.kiro/specs/` para ver quais specs têm tasks não concluídas (`- [ ]`).

Specs atuais:
- `.kiro/specs/kernel-consolidation/` — consolidação do kernel (concluído)
- `.kiro/specs/mvp04-frontend/` — frontend MVP04 (concluído)
- `.kiro/specs/real-provider-adapters/` — adapters reais de providers (concluído)

---

## O que NÃO fazer

- Não criar specs ou documentos de design — isso é responsabilidade do Kiro
- Não instalar dependências sem verificar se já existem no `package.json`
- Não usar Prisma — o projeto usa Drizzle
- Não usar `any` no TypeScript sem justificativa
- Não remover testes existentes
- Não alterar o schema Drizzle sem criar uma migration correspondente

---

## Ambiente de execução

O projeto roda via Docker Compose em produção:

```bash
# Subir stack completo
docker-compose -f docker-compose.prod.yml up -d

# Rebuildar apenas o kernel após mudanças
docker-compose -f docker-compose.prod.yml up -d --build kernel

# Ver logs do kernel
docker-compose -f docker-compose.prod.yml logs -f kernel
```

Portas:
- Backend: `localhost:4000`
- Frontend: `localhost:5173`
- PostgreSQL prod: `localhost:5433`
- Redis prod: `localhost:6380`
