# MVP12 — i18n Nativa + Export/Import de Agentes
**Projeto:** Andromeda OS  
**Versão:** 1.0  
**Data:** 2026-03-24  
**Status:** Planejado  
**Pré-requisitos:** MVP01–MVP11 concluídos  

---

## 1. Objetivo

Tornar o Andromeda OS um sistema verdadeiramente multilíngue (PT/EN como base, extensível a qualquer locale) e introduzir portabilidade completa de agentes via bundle exportável/importável — base estrutural para o futuro Agent Marketplace.

---

## 2. Problema

| # | Problema | Impacto |
|---|----------|---------|
| 1 | Sistema completamente em EN — barreia de uso para equipes BR | Alto |
| 2 | Locale hardcoded na UI e nas system messages | Alto |
| 3 | Impossível mover agente entre ambientes (dev→staging→prod) | Alto |
| 4 | Sem portabilidade entre instâncias Andromeda de clientes distintos | Alto |
| 5 | Knowledge Layer não filtra documentos por idioma | Médio |
| 6 | LLM Router não considera especialização do modelo por língua | Médio |

---

## 3. Escopo do MVP12

### 3.1 i18n em Três Camadas

#### Camada 1 — UI Layer
- Integração de `i18next` + `react-i18next` no `apps/web`
- Locales como arquivos JSON em `apps/web/src/locales/{locale}/`
- Suporte inicial: `pt-BR` e `en-US`
- Seletor de idioma persistido no perfil do usuário (UserPreferences)
- Fallback automático para `en-US` se tradução ausente
- Detecção automática do idioma do browser na primeira visita

#### Camada 2 — Agent Locale
- Campo `preferredLocale` e `fallbackLocale` no `AgentProfile`
- Agent responde no idioma configurado independente do idioma da UI
- System prompt do agente injetado no locale correto
- Prompt de `soul.md`, `rules.md` e `playbook.md` localizáveis por arquivo (`soul.pt-BR.md`, `soul.en-US.md`)

#### Camada 3 — System Messages & Knowledge
- `LocalizedMessage` — mensagens do sistema (erros, status, notificações) por locale
- Knowledge Layer: detecção automática de idioma de documentos na ingestão (langdetect Python)
- Filtro de retrieval por língua: agente com `preferredLocale=pt-BR` prioriza chunks PT na busca
- LLM Router: tag `lang_specialization` nos `ModelCapability` (ex: `pt-BR-optimized`)

---

### 3.2 Export/Import de Agentes

#### Export
- Gera um bundle `.andromeda-agent` (ZIP estruturado com manifest JSON)
- Conteúdo do bundle:
  - `manifest.json` — metadata, versão, schema version, checksum SHA-256
  - `profile/` — identity.md, soul.md, rules.md, playbook.md (e variantes por locale)
  - `config.json` — configurações numéricas (temperatura, max_tokens, etc.)
  - `sandbox-policy.json` — políticas de sandbox do agente
  - `safeguards.json` — configurações de safeguards
  - `knowledge/` — referências às KnowledgeCollections (não os documentos em si, apenas metadados + opção de incluir)
  - `versions/` — histórico de AgentVersions (últimas N versões)
  - `performance/` — snapshot de AgentPerformanceRecord
- Export via UI (botão no AgentManagementView) e via CLI (`andromeda agents export <agentId>`)

#### Import
- Upload de `.andromeda-agent` via UI ou CLI
- Pipeline de validação:
  1. Verificação de checksum SHA-256
  2. Validação de schema version (compatibilidade)
  3. Detecção de conflitos (agente com mesmo `slug` já existe?)
  4. Resolução de conflitos: Sobrescrever / Renomear / Cancelar
- `AgentImportJob` — entidade que rastreia o progresso do import
- Relatório pós-import: o que foi criado, o que foi ignorado, conflitos resolvidos
- Permissão RBAC: apenas `admin` e `owner` podem importar agentes

---

## 4. Entidades Novas

### 4.1 Prisma Schema

```prisma
model LocaleRegistry {
  id          String   @id @default(uuid())
  code        String   @unique  // "pt-BR", "en-US"
  name        String            // "Português (Brasil)"
  isDefault   Boolean  @default(false)
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}

model LocalizedMessage {
  id         String   @id @default(uuid())
  key        String            // "task.created", "agent.error.budget_exceeded"
  locale     String            // "pt-BR"
  value      String            // "Tarefa criada com sucesso"
  category   String            // "system", "agent", "notification", "error"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([key, locale])
}

model UserPreferences {
  id            String   @id @default(uuid())
  userId        String   @unique
  preferredLocale String @default("pt-BR")
  fallbackLocale  String @default("en-US")
  theme         String   @default("dark")
  updatedAt     DateTime @updatedAt
}

model AgentBundle {
  id            String   @id @default(uuid())
  agentId       String
  tenantId      String
  version       String            // semver "1.0.0"
  schemaVersion String            // versão do schema do bundle
  checksum      String            // SHA-256 do arquivo ZIP
  filePath      String            // caminho no storage
  includesKnowledge Boolean @default(false)
  includesVersions  Boolean @default(true)
  exportedAt    DateTime @default(now())
  exportedBy    String            // userId
  deletedAt     DateTime?

  agent         Agent    @relation(fields: [agentId], references: [id])
}

model AgentImportJob {
  id              String   @id @default(uuid())
  tenantId        String
  bundleChecksum  String
  status          AgentImportStatus @default(PENDING)
  conflictPolicy  ConflictPolicy    @default(ABORT)
  importedAgentId String?
  report          Json?             // { created: [], skipped: [], conflicts: [] }
  errorMessage    String?
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  createdBy       String

  @@index([tenantId, status])
}

enum AgentImportStatus {
  PENDING
  VALIDATING
  CONFLICT_DETECTED
  IMPORTING
  COMPLETED
  FAILED
}

enum ConflictPolicy {
  ABORT
  RENAME
  OVERWRITE
}
```

---

## 5. APIs

### i18n
| Método | Rota | Descrição |
|--------|------|-----------|
| GET | /v1/i18n/locales | Lista locales disponíveis |
| GET | /v1/i18n/messages?locale=pt-BR&category=system | Mensagens por locale/categoria |
| PUT | /v1/users/me/preferences | Atualiza preferências (locale, tema) |

### Export/Import
| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /v1/agents/:id/export | Gera bundle de export |
| GET | /v1/agents/:id/bundles | Lista bundles exportados |
| GET | /v1/agents/:id/bundles/:bundleId/download | Download do arquivo |
| POST | /v1/agents/import | Upload + inicia import job |
| GET | /v1/agents/import/:jobId | Status do import job |
| POST | /v1/agents/import/:jobId/resolve | Resolve conflito detectado |

---

## 6. Critérios de Aceite

- [ ] UI totalmente em PT-BR por padrão, alternável para EN-US sem reload
- [ ] Locale do agente é independente do locale da UI
- [ ] Documentos ingeridos têm idioma detectado automaticamente
- [ ] Retrieval respeita `preferredLocale` do agente
- [ ] Export gera bundle `.andromeda-agent` válido com checksum correto
- [ ] Import com mesmo slug detecta conflito e apresenta opções ao usuário
- [ ] Import falho não deixa agente parcialmente criado (transação atômica)
- [ ] Apenas `admin`/`owner` podem importar agentes (RBAC)
- [ ] CLI `andromeda agents export/import` funcional
- [ ] Todos os evals BDD verdes

---

## 7. Fora do Escopo do MVP12

- Agent Marketplace público (MVP futuro)
- Tradução automática de documentos do Knowledge Layer
- i18n de e-mails/notificações externas
- Mais de 2 locales na UI (PT-BR e EN-US são suficientes para MVP12)
- Tradução automática de soul.md/rules.md via LLM

---

## 8. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Bundle muito grande com knowledge incluso | Média | `includesKnowledge` false por padrão; limite de 50MB por bundle |
| Import quebrar agente existente em produção | Média | Transação atômica + política ABORT como padrão |
| langdetect com baixa precisão em textos curtos | Média | Fallback para locale do agente quando confiança < 0.8 |
| Conflito de schema version entre versões do Andromeda | Baixa | Campo `schemaVersion` no manifest + migration guide |
