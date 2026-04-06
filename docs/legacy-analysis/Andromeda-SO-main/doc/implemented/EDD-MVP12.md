# EDD-MVP12 — i18n Nativa + Export/Import de Agentes
**Tipo:** Engineering Design Document  
**MVP:** 12  
**Data:** 2026-03-24  
**Autor:** Andromeda OS Docs  

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      apps/web                           │
│  i18next Provider → LocaleSwitcher → All UI Components  │
│  apps/web/src/locales/pt-BR/*.json                      │
│  apps/web/src/locales/en-US/*.json                      │
└────────────────────┬────────────────────────────────────┘
                     │ REST
┌────────────────────▼────────────────────────────────────┐
│              packages/api (Express/TS)                  │
│                                                         │
│  modules/i18n/          modules/agent-portability/      │
│  ├─ locale.routes.ts    ├─ export.use-case.ts           │
│  ├─ locale.controller   ├─ import.use-case.ts           │
│  └─ i18n.service.ts     ├─ bundle.builder.ts            │
│                         ├─ bundle.validator.ts          │
│  modules/agents/        └─ conflict.resolver.ts         │
│  ├─ agent.schema +      │                               │
│  │  preferredLocale     │                               │
│  └─ locale injection    │                               │
│         │                         │                     │
│         ▼                         ▼                     │
│  [Prisma / PostgreSQL]    [Storage: /bundles/*.zip]     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────────┐
│         services/cognitive-python (FastAPI)             │
│  POST /language/detect  ← langdetect library            │
│  POST /retrieval/query  ← filtro por lang_code          │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Módulo i18n

### 2.1 Estrutura de Arquivos

```
apps/web/src/
  locales/
    pt-BR/
      common.json        # labels genéricos
      agents.json        # módulo de agentes
      tasks.json         # módulo de tasks
      errors.json        # mensagens de erro
      notifications.json # notificações do sistema
    en-US/
      common.json
      agents.json
      tasks.json
      errors.json
      notifications.json
  providers/
    I18nProvider.tsx     # wrapper react-i18next

packages/api/src/modules/i18n/
  locale.routes.ts
  locale.controller.ts
  i18n.service.ts
  repositories/
    localized-message.repository.ts
```

### 2.2 Configuração i18next

```typescript
// apps/web/src/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['pt-BR', 'en-US'],
    ns: ['common', 'agents', 'tasks', 'errors', 'notifications'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })
```

### 2.3 I18nService (API)

```typescript
// packages/api/src/modules/i18n/i18n.service.ts
export class I18nService {
  async getMessage(key: string, locale: string): Promise<string> {
    const msg = await this.repo.findByKeyAndLocale(key, locale)
    if (!msg) {
      const fallback = await this.repo.findByKeyAndLocale(key, 'en-US')
      return fallback?.value ?? key
    }
    return msg.value
  }

  async getAgentSystemPromptLocale(agentId: string): Promise<string> {
    const agent = await this.agentRepo.findById(agentId)
    return agent.preferredLocale ?? 'pt-BR'
  }
}
```

### 2.4 Language Detection (Python)

```python
# services/cognitive-python/src/routers/language.py
from langdetect import detect, DetectorFactory
from pydantic import BaseModel

DetectorFactory.seed = 42  # determinismo

class DetectRequest(BaseModel):
    text: str
    min_confidence: float = 0.8

class DetectResponse(BaseModel):
    lang_code: str      # "pt", "en"
    locale: str         # "pt-BR", "en-US"
    confidence: float
    fallback: bool

@router.post("/language/detect", response_model=DetectResponse)
async def detect_language(req: DetectRequest):
    try:
        from langdetect import detect_langs
        langs = detect_langs(req.text)
        top = langs[0]
        if top.prob >= req.min_confidence:
            return DetectResponse(
                lang_code=str(top.lang),
                locale=LANG_TO_LOCALE.get(str(top.lang), "en-US"),
                confidence=top.prob,
                fallback=False
            )
    except Exception:
        pass
    return DetectResponse(lang_code="en", locale="en-US", confidence=0.0, fallback=True)
```

---

## 3. Módulo Agent Portability

### 3.1 Bundle Builder

```typescript
// packages/api/src/modules/agent-portability/bundle.builder.ts
import archiver from 'archiver'
import { createHash } from 'crypto'

export class BundleBuilder {
  async build(agentId: string, options: BundleOptions): Promise<AgentBundleFile> {
    const agent = await this.agentRepo.findFullById(agentId)
    const manifest = this.buildManifest(agent, options)

    const archive = archiver('zip', { zlib: { level: 9 } })
    const outputPath = `bundles/${agentId}-${Date.now()}.andromeda-agent`

    archive.append(JSON.stringify(manifest, null, 2), { name: 'manifest.json' })
    archive.append(agent.identity, { name: 'profile/identity.md' })
    archive.append(agent.soul, { name: 'profile/soul.md' })
    archive.append(agent.rules, { name: 'profile/rules.md' })
    archive.append(agent.playbook ?? '', { name: 'profile/playbook.md' })
    archive.append(JSON.stringify(agent.numericConfig, null, 2), { name: 'config.json' })
    archive.append(JSON.stringify(agent.sandboxPolicy, null, 2), { name: 'sandbox-policy.json' })
    archive.append(JSON.stringify(agent.safeguards, null, 2), { name: 'safeguards.json' })

    if (options.includesVersions) {
      const versions = await this.versionRepo.findLastN(agentId, 10)
      archive.append(JSON.stringify(versions, null, 2), { name: 'versions/history.json' })
    }

    if (options.includesKnowledge) {
      const collections = await this.knowledgeRepo.findByAgent(agentId)
      archive.append(JSON.stringify(collections.map(c => c.metadata), null, 2), {
        name: 'knowledge/collections.json'
      })
    }

    await archive.finalize()
    const checksum = await this.computeChecksum(outputPath)

    return { outputPath, checksum, manifest }
  }

  private buildManifest(agent: Agent, options: BundleOptions): BundleManifest {
    return {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      agent: {
        id: agent.id,
        slug: agent.slug,
        name: agent.name,
        version: agent.currentVersion,
        locale: agent.preferredLocale,
      },
      includes: {
        knowledge: options.includesKnowledge,
        versions: options.includesVersions,
        performance: false, // MVP12 sem performance snapshot
      }
    }
  }
}
```

### 3.2 Bundle Validator

```typescript
// packages/api/src/modules/agent-portability/bundle.validator.ts
export class BundleValidator {
  async validate(filePath: string, declaredChecksum: string): Promise<ValidationResult> {
    const errors: string[] = []

    // 1. Checksum
    const actualChecksum = await this.computeChecksum(filePath)
    if (actualChecksum !== declaredChecksum) {
      errors.push(`Checksum mismatch: expected ${declaredChecksum}, got ${actualChecksum}`)
    }

    // 2. Estrutura mínima obrigatória
    const required = ['manifest.json', 'profile/identity.md', 'config.json']
    const contents = await this.listZipContents(filePath)
    for (const file of required) {
      if (!contents.includes(file)) errors.push(`Missing required file: ${file}`)
    }

    // 3. Schema version compatível
    const manifest = await this.readManifest(filePath)
    if (!SUPPORTED_SCHEMA_VERSIONS.includes(manifest.schemaVersion)) {
      errors.push(`Unsupported schema version: ${manifest.schemaVersion}`)
    }

    return { valid: errors.length === 0, errors, manifest }
  }
}
```

### 3.3 Import Use Case (transação atômica)

```typescript
// packages/api/src/modules/agent-portability/import.use-case.ts
export class ImportAgentUseCase {
  async execute(input: ImportAgentInput): Promise<ImportAgentOutput> {
    const job = await this.jobRepo.create({
      tenantId: input.tenantId,
      bundleChecksum: input.checksum,
      conflictPolicy: input.conflictPolicy ?? 'ABORT',
      createdBy: input.userId,
      status: 'VALIDATING'
    })

    try {
      const validation = await this.validator.validate(input.filePath, input.checksum)
      if (!validation.valid) {
        await this.jobRepo.fail(job.id, validation.errors.join('; '))
        return { jobId: job.id, status: 'FAILED', errors: validation.errors }
      }

      // Detecta conflito
      const existing = await this.agentRepo.findBySlug(
        validation.manifest.agent.slug, input.tenantId
      )
      if (existing) {
        if (input.conflictPolicy === 'ABORT') {
          await this.jobRepo.update(job.id, { status: 'CONFLICT_DETECTED' })
          return { jobId: job.id, status: 'CONFLICT_DETECTED', conflictAgentId: existing.id }
        }
        if (input.conflictPolicy === 'RENAME') {
          validation.manifest.agent.slug += `-imported-${Date.now()}`
        }
        // OVERWRITE: continua com mesmo slug
      }

      // Import dentro de transação
      await this.jobRepo.update(job.id, { status: 'IMPORTING' })
      const importedAgent = await this.prisma.$transaction(async (tx) => {
        return this.bundleImporter.importFromBundle(input.filePath, validation.manifest, {
          tenantId: input.tenantId, tx,
          overwrite: input.conflictPolicy === 'OVERWRITE' ? existing?.id : undefined
        })
      })

      await this.jobRepo.complete(job.id, importedAgent.id, {
        created: [importedAgent.id], skipped: [], conflicts: []
      })
      return { jobId: job.id, status: 'COMPLETED', importedAgentId: importedAgent.id }

    } catch (err) {
      await this.jobRepo.fail(job.id, err.message)
      throw err
    }
  }
}
```

---

## 4. Mudanças no Schema Prisma Existente

```prisma
// Adicionar em model Agent
model Agent {
  // ... campos existentes ...
  preferredLocale  String?  @default("pt-BR")
  fallbackLocale   String?  @default("en-US")
  bundles          AgentBundle[]
}

// Adicionar em model KnowledgeDocument
model KnowledgeDocument {
  // ... campos existentes ...
  detectedLang   String?  // "pt", "en" — preenchido na ingestão
  detectedLocale String?  // "pt-BR", "en-US"
  langConfidence Float?
}

// Adicionar em model User (se existir) ou criar UserPreferences
```

---

## 5. Alterações no Python Cognitive Service

### Arquivo: `services/cognitive-python/src/routers/language.py` (NOVO)
- Endpoint `POST /language/detect`
- Lib: `langdetect>=1.0.9`

### Arquivo: `services/cognitive-python/src/routers/retrieval.py` (ALTERAR)
- Adicionar filtro `lang_filter?: string` no request de retrieval
- Se `lang_filter` presente: filtrar chunks por `detectedLang` antes do reranking

---

## 6. Alterações na UI

### Componentes Novos
| Componente | Localização | Descrição |
|-----------|-------------|-----------|
| `LocaleSwitcher` | `components/LocaleSwitcher.tsx` | Dropdown PT/EN no header |
| `AgentExportModal` | `components/AgentExportModal.tsx` | Opções de export + download |
| `AgentImportModal` | `components/AgentImportModal.tsx` | Upload + progress + conflito |
| `ImportConflictDialog` | `components/ImportConflictDialog.tsx` | Resolução de conflito |

### Páginas Alteradas
- `AgentManagementView` — botão Export por agente + botão Import global
- `AgentEditView` — campo Locale Preferido + Locale Fallback
- `SettingsView` — aba Idioma com `LocaleSwitcher`

---

## 7. CLI Commands

```bash
# Export
andromeda agents export <agentId> [--include-knowledge] [--output ./my-agent.andromeda-agent]

# Import
andromeda agents import ./my-agent.andromeda-agent [--conflict rename|overwrite|abort]

# Listar locales disponíveis
andromeda i18n locales

# Seed de mensagens localizadas
andromeda i18n seed --locale pt-BR
```

---

## 8. Dependências Novas

### packages/api
```json
"archiver": "^7.0.0",
"@types/archiver": "^6.0.0",
"unzipper": "^0.12.0"
```

### apps/web
```json
"i18next": "^23.0.0",
"react-i18next": "^14.0.0",
"i18next-browser-languagedetector": "^8.0.0"
```

### services/cognitive-python
```
langdetect>=1.0.9
```

---

## 9. Segurança

- Bundles armazenados fora do webroot — acessíveis apenas via endpoint autenticado
- Limite de 50MB por bundle (Multer config)
- Scan básico de ZIP bomb: rejeitar se descomprimido > 500MB
- SHA-256 obrigatório — sem checksum = import rejeitado
- RBAC: apenas `admin`/`owner` podem exportar/importar agentes
