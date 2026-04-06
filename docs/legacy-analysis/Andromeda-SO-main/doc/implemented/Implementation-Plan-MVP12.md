# Implementation Plan — MVP12
**Zero-Shot Ready para Antigravity/Claude Code**  
**Estimativa:** 14 sessões de coding  
**Data:** 2026-03-25 (atualizado)

---

## Leia Antes de Começar

1. Leia `doc/active/Project-Context.md` — contexto geral do projeto
2. Leia `doc/active/MVP12-PRD.md` — requisitos completos
3. Leia `doc/active/EDD-MVP12.md` — arquitetura detalhada
4. Confirme: MVP01–MVP11 estão todos concluídos
5. Confirme: Python service (`services/cognitive-python`) está rodando em `:8000`
6. Confirme: `packages/api` está rodando em `:3000`

**Regra de ouro:** Ao final de cada fase, rode `npm run test` + `npm run typecheck`. Só avance com tudo verde. Faça commit com a convenção `feat(mvp12): fase N — descrição`.

---

## Decisões Pré-Implementação

| Decisão | Escolha |
|---------|---------|
| Migração Agent | **Uma vez** — DB é fonte de verdadade, `.md` descartados |
| Escopo preferredLocale | **Ambos** — System prompt + Knowledge retrieval |
| Localização CLI | **Pacote separado** — `packages/cli/` |
| UI Export/Import | **Sim** — Modais web além do CLI |

---

## FASE 0 — Model Agent + Migração File→DB (NOVA)
**Estimativa:** 1.5h  
**Objetivo:** Persistir agentes no banco para suportar export/import com relacionamentos.

**Arquivos a criar/modificar:**

```
packages/api/prisma/schema.prisma                          ADICIONAR model Agent
packages/api/src/modules/agent-management/
  infrastructure/
    PrismaAgentProfileRepository.ts                        NOVO
    AgentMigrationService.ts                               NOVO
  dependencies.ts                                           ALTERAR
```

**O que fazer:**

1. Adicionar model `Agent` no Prisma:

```prisma
model Agent {
  id                String   @id @default(uuid())
  slug              String   @unique
  name              String
  role              String
  description       String
  teamId            String   @default("team-core")
  category          String   @default("general")
  type              String   @default("specialist")
  defaultModel      String   @default("automatic-router")
  status            String   @default("active")
  isDefault         Boolean  @default(false)
  version           String   @default("v1.0.0")
  preferredLocale   String   @default("pt-BR")
  fallbackLocale    String   @default("en-US")
  
  identity          Json
  soul              Json
  rules             Json
  playbook          Json
  context           Json
  safeguardConfig   Json
  personaConfig     Json
  
  bundles           AgentBundle[]
  
  tenantId          String   @default("default")
  createdBy         String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deletedAt         DateTime?
  archivedAt        DateTime?

  @@index([tenantId])
  @@index([slug])
  @@index([deletedAt])
  @@map("agents")
}
```

2. Criar `PrismaAgentProfileRepository.ts`:
   - Implementar mesma interface de `FileSystemAgentProfileRepository`
   - Mapear `AgentProfile` (type TS) para `Agent` (model Prisma)
   - Métodos: `getById`, `list`, `save`, `delete`

3. Criar `AgentMigrationService.ts`:
   - Script one-shot para migrar arquivos `.md` para banco
   - Executar: `npx ts-node scripts/migrate-agents-to-db.ts`
   - Preservar estrutura completa do AgentProfile
   - Criar backup de `.agent/agents/` antes de migrar

4. Atualizar `dependencies.ts`:
   - Swap de `FileSystemAgentProfileRepository` para `PrismaAgentProfileRepository`

5. Rodar:
```bash
npx prisma migrate dev --name mvp12-agent-model
npx prisma generate
npm run test
```

**Commit gate:** Agentes existentes em `.agent/agents/` aparecem na API via banco de dados.

---

## FASE 1 — Prisma Migrations + Entidades Base (ORIGINAL)
**Estimativa:** 1h  
**Arquivos a criar/modificar:**

```
packages/api/prisma/schema.prisma              ALTERAR
packages/api/prisma/migrations/                GERAR
```

**O que fazer:**

1. Adicionar em `model Agent`:
   - `preferredLocale String? @default("pt-BR")`
   - `fallbackLocale  String? @default("en-US")`
   - `bundles AgentBundle[]`

2. Adicionar em `model KnowledgeDocument`:
   - `detectedLang    String?`
   - `detectedLocale  String?`
   - `langConfidence  Float?`

3. Criar models novos (copie do EDD-MVP12.md seção 4):
   - `LocaleRegistry`
   - `LocalizedMessage`
   - `UserPreferences`
   - `AgentBundle`
   - `AgentImportJob`
   - Enums: `AgentImportStatus`, `ConflictPolicy`

4. Rodar:
```bash
npx prisma migrate dev --name mvp12-i18n-portability
npx prisma generate
```

**Commit gate:** `npx prisma validate` sem erros.

---

## FASE 2 — i18n Backend (API)
**Estimativa:** 1.5h  
**Arquivos a criar:**

```
packages/api/src/modules/i18n/
  locale.routes.ts             NOVO
  locale.controller.ts         NOVO
  i18n.service.ts              NOVO
  repositories/
    localized-message.repository.ts   NOVO
    user-preferences.repository.ts    NOVO
  seeds/
    pt-BR.seed.ts              NOVO
    en-US.seed.ts              NOVO
```

**O que fazer:**

1. Criar `I18nService` com métodos:
   - `getMessage(key, locale)` → string com fallback para en-US
   - `listLocales()` → LocaleRegistry[]
   - `getMessagesByCategory(locale, category)` → LocalizedMessage[]
   - `getUserPreferences(userId)` → UserPreferences
   - `updateUserPreferences(userId, data)` → UserPreferences

2. Criar rotas:
   - `GET /v1/i18n/locales`
   - `GET /v1/i18n/messages?locale=pt-BR&category=system`
   - `PUT /v1/users/me/preferences`

3. Criar seeds com mensagens em PT-BR e EN-US para categorias:
   - `system`: task.created, task.failed, task.completed, agent.error.*
   - `notification`: budget.warning, budget.exceeded, health.degraded
   - `error`: validation.*, auth.*, rate_limit.*

4. Registrar módulo em `packages/api/src/app.ts`

**Commit gate:** `GET /v1/i18n/locales` retorna `[{code:"pt-BR",...},{code:"en-US",...}]`

---

## FASE 3 — Language Detection (Python)
**Estimativa:** 1h  
**Arquivos a criar/modificar:**

```
services/cognitive-python/requirements.txt          ALTERAR
services/cognitive-python/src/routers/language.py   NOVO
services/cognitive-python/src/routers/retrieval.py  ALTERAR
services/cognitive-python/src/main.py               ALTERAR
```

**O que fazer:**

1. Adicionar `langdetect>=1.0.9` em `requirements.txt`

2. Criar `language.py` (copie do EDD-MVP12.md seção 2.4):
   - `POST /language/detect` com `DetectRequest` e `DetectResponse`
   - Mapa `LANG_TO_LOCALE = {"pt": "pt-BR", "en": "en-US", ...}`
   - Fallback para `en-US` quando confiança < `min_confidence`

3. Alterar `retrieval.py`:
   - Adicionar campo opcional `lang_filter: Optional[str]` no request
   - Se presente: filtrar chunks por `detectedLang == lang_filter` antes do reranking

4. Registrar router em `main.py`: `app.include_router(language_router)`

5. Alterar `KnowledgeIngestService` no TypeScript:
   - Após salvar documento, chamar `POST http://localhost:8000/language/detect`
   - Persistir `detectedLang`, `detectedLocale`, `langConfidence` no documento

**Commit gate:** `curl -X POST localhost:8000/language/detect -d '{"text":"Olá mundo"}'` retorna `{"locale":"pt-BR","confidence":>0.8}`

---

## FASE 4 — Export de Agentes
**Estimativa:** 1.5h  
**Arquivos a criar:**

```
packages/api/src/modules/agent-portability/
  bundle.builder.ts            NOVO
  bundle.validator.ts          NOVO
  export.use-case.ts           NOVO
  export.controller.ts         NOVO
  export.routes.ts             NOVO
  repositories/
    agent-bundle.repository.ts NOVO
```

**O que fazer:**

1. Instalar dependências:
```bash
cd packages/api
npm install archiver @types/archiver
```

2. Criar `BundleBuilder` (copie do EDD-MVP12.md seção 3.1):
   - Método `build(agentId, options)` → `AgentBundleFile`
   - Gerar ZIP com estrutura do EDD
   - Calcular SHA-256 do arquivo gerado
   - Salvar em `./storage/bundles/`

3. Criar `ExportAgentUseCase`:
   - Verificar permissão RBAC (admin/owner only)
   - Chamar `BundleBuilder.build()`
   - Persistir `AgentBundle` no banco
   - Retornar `{ bundleId, downloadUrl }`

4. Criar rotas:
   - `POST /v1/agents/:id/export`
   - `GET /v1/agents/:id/bundles`
   - `GET /v1/agents/:id/bundles/:bundleId/download`

**Commit gate:** `POST /v1/agents/:id/export` retorna `{ bundleId, downloadUrl }` e arquivo `.andromeda-agent` é criado em `/storage/bundles/`

---

## FASE 5 — Import de Agentes
**Estimativa:** 2h  
**Arquivos a criar:**

```
packages/api/src/modules/agent-portability/
  bundle.validator.ts          NOVO (ou complementar Fase 4)
  bundle.importer.ts           NOVO
  import.use-case.ts           NOVO
  import.controller.ts         NOVO
  import.routes.ts             NOVO
  repositories/
    agent-import-job.repository.ts NOVO
```

**O que fazer:**

1. Instalar:
```bash
npm install unzipper multer @types/multer
```

2. Criar `BundleValidator` (copie do EDD-MVP12.md seção 3.2):
   - Verificar checksum SHA-256
   - Listar conteúdo do ZIP e checar arquivos obrigatórios
   - Validar `schemaVersion` contra `SUPPORTED_SCHEMA_VERSIONS = ['1.0']`

3. Criar `BundleImporter`:
   - Extrair ZIP em diretório temporário
   - Criar Agent com dados do bundle dentro de `$transaction`
   - Limpar diretório temporário após import
   - Suportar `overwrite: agentId?` para sobrescrever agente existente

4. Criar `ImportAgentUseCase` (copie do EDD-MVP12.md seção 3.3):
   - Pipeline: VALIDATING → CONFLICT_DETECTED? → IMPORTING → COMPLETED/FAILED
   - Transação atômica — rollback total em caso de erro
   - Aplicar `conflictPolicy`: ABORT, RENAME, OVERWRITE

5. Criar rotas:
   - `POST /v1/agents/import` (multipart/form-data)
   - `GET /v1/agents/import/:jobId`
   - `POST /v1/agents/import/:jobId/resolve` (resolve conflito)

**Commit gate:**
- Import de bundle válido → agente criado no banco
- Import de bundle corrompido → FAILED sem agente criado
- Import com slug duplicado + ABORT → CONFLICT_DETECTED, nada criado

---

## FASE 6 — UI: i18n Frontend
**Estimativa:** 1.5h  
**Arquivos a criar/modificar:**

```
apps/web/
  package.json                          ALTERAR (add i18next)
  src/i18n.ts                           NOVO
  src/main.tsx                          ALTERAR (add I18nextProvider)
  src/locales/pt-BR/common.json         NOVO
  src/locales/pt-BR/agents.json         NOVO
  src/locales/pt-BR/tasks.json          NOVO
  src/locales/pt-BR/errors.json         NOVO
  src/locales/en-US/common.json         NOVO
  src/locales/en-US/agents.json         NOVO
  src/locales/en-US/tasks.json          NOVO
  src/locales/en-US/errors.json         NOVO
  src/components/LocaleSwitcher.tsx     NOVO
  src/views/SettingsView.tsx            ALTERAR
```

**O que fazer:**

1. Instalar:
```bash
cd apps/web
npm install i18next react-i18next i18next-browser-languagedetector
```

2. Criar `src/i18n.ts` com configuração (copie do EDD-MVP12.md seção 2.2)

3. Criar arquivos JSON de tradução para PT-BR e EN-US com todas as strings visíveis na UI atual. Estratégia: percorra cada View e extraia strings hardcoded.

4. Substituir strings hardcoded por `t('key')` em todos os componentes (use `useTranslation` hook)

5. Criar `LocaleSwitcher` — dropdown no Header/Navbar com PT 🇧🇷 e EN 🇺🇸. Ao trocar, persiste no `localStorage` e chama `PUT /v1/users/me/preferences`.

6. Em `AgentEditView`, adicionar campos `preferredLocale` e `fallbackLocale` (select com locales disponíveis)

**Commit gate:** UI renderiza 100% em PT-BR por padrão; ao trocar para EN-US, todos os labels mudam sem reload.

---

## FASE 7 — UI: Export/Import de Agentes
**Estimativa:** 1.5h  
**Arquivos a criar/modificar:**

```
apps/web/src/
  components/
    AgentExportModal.tsx          NOVO
    AgentImportModal.tsx          NOVO
    ImportConflictDialog.tsx      NOVO
    ImportProgressBar.tsx         NOVO
  views/
    AgentManagementView.tsx       ALTERAR (add botões Export/Import)
    AgentEditView.tsx             ALTERAR (add botão Export)
  services/
    agent-portability.service.ts  NOVO
```

**O que fazer:**

1. `AgentExportModal`:
   - Checkbox "Incluir Knowledge Collections"
   - Checkbox "Incluir Histórico de Versões" (default: true)
   - Botão "Exportar" → chama `POST /v1/agents/:id/export` → download automático

2. `AgentImportModal`:
   - Drag & drop ou file picker para `.andromeda-agent`
   - Mostra progresso do `AgentImportJob` via polling `GET /v1/agents/import/:jobId`
   - Em `CONFLICT_DETECTED`: abre `ImportConflictDialog`

3. `ImportConflictDialog`:
   - Exibe nome do agente em conflito
   - Opções: Renomear / Substituir / Cancelar
   - Chama `POST /v1/agents/import/:jobId/resolve`

4. `AgentManagementView`:
   - Botão "Importar Agente" no header da listagem
   - Menu de contexto por agente: "Exportar"

**Commit gate:** Export gera download do arquivo; Import com conflito apresenta dialog; Import bem-sucedido aparece na listagem de agentes.

---

## FASE 8 — CLI (NOVA)
**Estimativa:** 2h  
**Arquivos a criar:**

```
packages/cli/
  package.json                   NOVO
  tsconfig.json                  NOVO
  src/
    index.ts                     NOVO (entry point)
    commands/
      agents.export.ts           NOVO
      agents.import.ts           NOVO
      i18n.locales.ts            NOVO
      i18n.seed.ts               NOVO
    lib/
      api-client.ts              NOVO
      bundle-io.ts               NOVO
```

**O que fazer:**

1. Criar estrutura do pacote CLI:

```json
// packages/cli/package.json
{
  "name": "@andromeda/cli",
  "version": "0.1.0",
  "bin": {
    "andromeda": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "archiver": "^7.0.0",
    "unzipper": "^0.12.0"
  }
}
```

2. Criar `src/index.ts` com commander:

```typescript
#!/usr/bin/env node
import { program } from 'commander';
import { agentsExport } from './commands/agents.export';
import { agentsImport } from './commands/agents.import';
import { i18nLocales } from './commands/i18n.locales';
import { i18nSeed } from './commands/i18n.seed';

program
  .name('andromeda')
  .description('Andromeda OS CLI')
  .version('0.1.0');

program
  .command('agents export <agentId>')
  .option('-o, --output <path>', 'Output file path')
  .option('--include-knowledge', 'Include knowledge collections')
  .action(agentsExport);

program
  .command('agents import <file>')
  .option('--conflict <policy>', 'Conflict policy: abort|rename|overwrite', 'abort')
  .action(agentsImport);

program
  .command('i18n locales')
  .action(i18nLocales);

program
  .command('i18n seed')
  .option('--locale <code>', 'Locale to seed', 'pt-BR')
  .action(i18nSeed);

program.parse();
```

3. Criar `commands/agents.export.ts`:
   - Chama `GET /v1/agents/:id` para obter dados do agente
   - Chama `POST /v1/agents/:id/export` para gerar bundle
   - Faz download do arquivo `.andromeda-agent`
   - Exibe progresso e checksum

4. Criar `commands/agents.import.ts`:
   - Valida arquivo `.andromeda-agent`
   - Chama `POST /v1/agents/import` (multipart)
   - Polling de `GET /v1/agents/import/:jobId`
   - Se `CONFLICT_DETECTED`, solicita resolução interativa

5. Criar `lib/api-client.ts`:
   - HTTP client para API do Andromeda
   - Lê URL base de `ANDROMEDA_API_URL` ou `http://localhost:3000`
   - Lê token de `ANDROMEDA_TOKEN` ou arquivo de config

6. Adicionar script no root `package.json`:

```json
{
  "scripts": {
    "cli": "tsx packages/cli/src/index.ts"
  }
}
```

**Uso:**

```bash
# Export
npx andromeda agents export agent-001 --output ./my-agent.andromeda-agent

# Import
npx andromeda agents import ./my-agent.andromeda-agent --conflict rename

# Listar locales
npx andromeda i18n locales

# Seed de mensagens
npx andromeda i18n seed --locale pt-BR
```

**Commit gate:** CLI consegue exportar agente, importar com conflito resolvido interativamente, e listar locales.

---

## FASE 9 — Testes E2E + Evals
**Estimativa:** 1.5h  
**Arquivos a criar:**

```
packages/api/tests/mvp12/
  i18n.test.ts                  NOVO
  export-import.test.ts         NOVO
packages/cli/tests/
  export.test.ts                NOVO
  import.test.ts                NOVO
packages/web-e2e/tests/
  mvp12-i18n.spec.ts            NOVO
  mvp12-export-import.spec.ts   NOVO
  mvp12-cli.spec.ts             NOVO
  fixtures/
    manifest.json               NOVO
```

**O que fazer:**

1. Testes de integração API (Vitest):
   - `GET /v1/i18n/locales` retorna PT-BR e EN-US
   - `GET /v1/i18n/messages?locale=pt-BR&category=system` retorna mensagens
   - Export → gera arquivo + persiste `AgentBundle` no banco
   - Import de bundle válido → cria agente
   - Import de bundle inválido (checksum errado) → FAILED
   - Import com conflito + ABORT → CONFLICT_DETECTED, nada criado
   - Import com conflito + OVERWRITE → agente substituído

2. Testes de CLI (subprocess):
   - `andromeda agents export` gera arquivo válido
   - `andromeda agents import` com arquivo válido cria agente
   - `andromeda agents import` com conflito exibe opções interativas
   - `andromeda i18n locales` lista locales

3. Testes E2E Playwright (UI):
   - LocaleSwitcher display PT-BR como padrão
   - Troca de locale PT↔EN sem reload
   - Locale persiste após refresh
   - Labels de formulário traduzidos
   - Mensagens de erro traduzidas
   - Preferência de locale salva no backend
   - Agente com locale preferido configurável
   - Botão Export na listagem e menu de contexto
   - Modal de export com opções
   - Download do arquivo .andromeda-agent
   - Import com drag-drop e progress
   - Conflito: ABORT, RENAME, OVERWRITE
   - Export→Import mantém dados do agente

4. Rodar evals BDD:
   - `doc/active/evals/mvp12-i18n.feature`
   - `doc/active/evals/mvp12-export-import.feature`

5. Atualizar `Development-Log.md`:

```markdown
## 2026-03-25 — MVP12 Concluído
- i18n PT-BR/EN-US implementado em 3 camadas (UI, Agent, Knowledge)
- Language detection automático na ingestão de documentos (langdetect)
- Export/Import de agentes com bundle .andromeda-agent
- Transação atômica no import com 3 políticas de conflito
- CLI: andromeda agents export/import funcional
- UI: Modais de Export/Import em AgentManagementView
- Agentes migrados de file-based para database
- E2E tests: Playwright + Vitest + CLI tests
```

**Commit gate final:** Todos os testes verdes. `npm run test` + `npm run typecheck` passam.

---

## Estrutura de Testes E2E (Playwright)

### mvp12-i18n.spec.ts
| Teste | Descrição |
|-------|-----------|
| LocaleSwitcher display PT-BR padrão | Verifica locale padrão |
| Troca PT-BR → EN-US sem reload | Verifica troca dinâmica |
| Locale persiste após refresh | Verifica localStorage + backend |
| Labels traduzidos | Verifica i18n em formulários |
| Mensagens de erro traduzidas | Verifica i18n em validações |
| Preferência salva no backend | Verifica PUT /users/me/preferences |
| Agente com locale preferido | Verifica campos preferredLocale/fallbackLocale |

### mvp12-export-import.spec.ts
| Teste | Descrição |
|-------|-----------|
| Botão Export aparece | Verifica UI de export |
| Modal de export com opções | Verifica checkboxes de knowledge/versions |
| Download .andromeda-agent | Verifica download do bundle |
| Botão Import aparece | Verifica UI de import |
| Import com drag-drop | Verifica upload |
| Import com progress | Verifica polling do job |
| Import falha checksum | Verifica erro de validação |
| Conflito: ABORT | Verifica cancelamento |
| Conflito: RENAME | Verifica sufixo -imported |
| Conflito: OVERWRITE | Verifica substituição |
| Export→Import ciclo | Verifica integridade dos dados |

### mvp12-cli.spec.ts
| Teste | Descrição |
|-------|-----------|
| i18n locales lista locales | Verifica CLI output |
| i18n seed popula mensagens | Verifica seed command |
| agents export gera arquivo | Verifica CLI export |
| agents export --include-knowledge | Verifica opção |
| agents export falha inexistente | Verifica erro |
| agents import cria agente | Verifica CLI import |
| agents import com conflito abort | Verifica política ABORT |
| agents import com conflito rename | Verifica política RENAME |
| agents import com conflito overwrite | Verifica política OVERWRITE |
| agents import falha corrompido | Verifica validação |
| Bundle contém manifest.json | Verifica estrutura |

---

## Dependências Novas

### packages/api
```bash
npm install archiver @types/archiver unzipper @types/unzipper
```

### apps/web
```bash
npm install i18next react-i18next i18next-browser-languagedetector
```

### packages/cli (novo)
```bash
npm install commander archiver unzipper
```

### services/cognitive-python
```bash
pip install langdetect>=1.0.9
```

---

## Checklist Final MVP12

### Fase 0 — Model Agent + Migração
- [ ] Model `Agent` criado no Prisma com todos os campos
- [ ] `PrismaAgentProfileRepository` implementado
- [ ] `AgentMigrationService` migrou `.agent/agents/` para banco
- [ ] `dependencies.ts` atualizado para usar `PrismaAgentProfileRepository`
- [ ] Agentes existentes aparecem na API após migração

### Fase 1 — Prisma Migrations
- [ ] Migration `mvp12-agent-model` aplicada
- [ ] Migration `mvp12-i18n-portability` aplicada
- [ ] Models `LocaleRegistry`, `LocalizedMessage`, `UserPreferences` criados
- [ ] Models `AgentBundle`, `AgentImportJob` criados
- [ ] KnowledgeDocument com campos `detectedLang`, `detectedLocale`, `langConfidence`

### Fase 2 — i18n Backend
- [ ] `GET /v1/i18n/locales` funcional
- [ ] `GET /v1/i18n/messages?locale=pt-BR&category=system` retorna mensagens
- [ ] `PUT /v1/users/me/preferences` persiste locale
- [ ] Seeds PT-BR e EN-US populados

### Fase 3 — Language Detection
- [ ] `POST /language/detect` no Python service
- [ ] Texto em PT detectado como `pt-BR`
- [ ] Texto em EN detectado como `en-US`
- [ ] Fallback para `en-US` quando confiança < 0.8
- [ ] KnowledgeDocument com idioma detectado na ingestão

### Fase 4 — Export
- [ ] `POST /v1/agents/:id/export` gera bundle
- [ ] Bundle `.andromeda-agent` é ZIP válido
- [ ] Checksum SHA-256 calculado e armazenado
- [ ] `AgentBundle` persistido no banco

### Fase 5 — Import
- [ ] Import valida checksum antes de processar
- [ ] Import com conflito ABORT → CONFLICT_DETECTED
- [ ] Import com conflito RENAME → agente com slug `-imported`
- [ ] Import com conflito OVERWRITE → agente substituído
- [ ] Import atômico: falha não deixa agente parcial
- [ ] RBAC: apenas admin/owner exportam/importam

### Fase 6 — UI i18n
- [ ] UI renderiza 100% em PT-BR por padrão
- [ ] LocaleSwitcher alterna PT↔EN sem reload
- [ ] Locale persistido em localStorage + backend
- [ ] `preferredLocale` configurável por agente na UI

### Fase 7 — UI Export/Import
- [ ] AgentExportModal funcional
- [ ] AgentImportModal com drag-drop
- [ ] ImportConflictDialog com opções
- [ ] ImportProgressBar mostra progresso
- [ ] Botões Export/Import em AgentManagementView

### Fase 8 — CLI
- [ ] `andromeda agents export <id>` funcional
- [ ] `andromeda agents import <file>` funcional
- [ ] `andromeda i18n locales` funcional
- [ ] `andromeda i18n seed --locale pt-BR` funcional

### Fase 9 — Testes
- [ ] Todos os testes de integração passando
- [ ] Todos os evals BDD verdes
- [ ] `npm run test` passa
- [ ] `npm run typecheck` passa

### Documentação
- [ ] `Development-Log.md` atualizado
- [ ] `Project-Context.md` atualizado com MVP12 concluído
