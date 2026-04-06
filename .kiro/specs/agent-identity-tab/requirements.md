---
name: agent-identity-tab
description: Tab Identity completa com ~34 campos canônicos organizados em 5 seções (Identidade, Origem/Template, Papel/Objetivo, Governança, Ciclo de Vida)
---

# Documento de Requisitos — Agent Identity Tab

## Introdução

Esta feature implementa a tab "Identity" para o formulário de agentes do Andromeda SO V0.2.0. A tab exibe todos os campos canônicos de identidade do agente organizados em 5 seções lógicas, permitindo ao operador visualizar e editar os metadados fundamentais do agente.

A tab Identity é a primeira aba do formulário de agentes e contém informações básicas sobre o agente, sua origem, seu propósito, governança e ciclo de vida. Estes campos são a base sobre a qual outras configurações (persona, instruções, modelo) são construídas.

Stack: React 18 + TypeScript + TailwindCSS 3. Visual language: neon matrix (verde/ciano sobre fundo escuro).

---

## Glossário

- **Identity Tab**: Aba de formulário que exibe campos de identidade do agente (nome, descrição, origem, papel, governança, etc.)
- **Canonical Field**: Campo canônico definido no documento `docs/suporte/andromeda-agents-canonical-fields.md`
- **AgentInstance**: Instância configurável de agente com todos os campos canônicos definidos em `frontend/src/types/kernel.ts`
- **FormSection**: Componente container para agrupar campos relacionados (já implementado em `.kiro/specs/agent-tabs-components/`)
- **FormSectionHeader**: Cabeçalho de seção com título, ícone e badge (já implementado)
- **AgentFormField**: Componente de campo de formulário genérico que renderiza input baseado no tipo (já implementado)

---

## Seções de Campos

### Seção 1: Identidade (9 campos)

Campos que definem a identidade básica do agente:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `id` | string | Sim | Identificador único estável do agente (UUID) |
| `name` | string | Sim | Nome humano principal do agente |
| `slug` | string | Sim | Identificador legível e amigável, derivado do nome |
| `shortDescription` | string | Não | Resumo curto para listagens |
| `longDescription` | string | Não | Descrição detalhada do agente |
| `owner` | string | Sim | Dono lógico do agente |
| `source` | string | Sim | Origem de criação (manual, template, import) |
| `version` | string | Sim | Versão lógica do registro |
| `status` | enum | Sim | Estado de vida (draft, active, inactive, archived, deleted) |

### Seção 2: Origem e Template (10 campos)

Campos que definem a origem e vínculo com templates:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `templateId` | string \| null | Não | ID do template de origem |
| `isTemplateDerived` | boolean | Sim | Indica se foi instanciado de template |
| `templateSource` | string \| null | Não | Origem lógica do template |
| `templateVariant` | string \| null | Não | Variante concreta do template |
| `templateManifestRef` | string \| null | Não | Referência ao manifesto do template |
| `originTemplateVersion` | string \| null | Não | Versão do template na instanciação |
| `templateDefaultsSnapshot` | object \| null | Não | Snapshot dos defaults herdados |
| `templateInheritanceMode` | enum | Sim | Modo de preservação do vínculo (copy-on-create, linked-metadata) |
| `templateLockPolicy` | enum | Sim | Política de travamento de campos (none, future, strict) |
| `cloneOfAgentId` | string \| null | Não | ID do agente original se for clone |

### Seção 3: Papel e Objetivo (5 campos)

Campos que definem o propósito funcional do agente:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `role` | string | Sim | Papel principal do agente |
| `mission` | string | Não | Missão resumida |
| `domain` | string | Não | Domínio de atuação |
| `objective` | string | Sim | Objetivo funcional primário |
| `successCriteria` | array | Não | Critérios de sucesso (lista de strings) |

### Seção 4: Governança e Edição (6 campos)

Campos que controlam a governança e permissões de edição:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `isActive` | boolean | Sim | Aptidão para operar (true/false) |
| `isEditable` | boolean | Sim | Capacidade de alteração (true/false) |
| `visibility` | enum | Sim | Nível de visibilidade (private, internal, public) |
| `tags` | array | Não | Etiquetas para categorização |
| `categories` | array | Não | Classificações funcionais |
| `auditMetadata` | object | Não | Metadados de auditoria (createdBy, updatedBy, reason) |

### Seção 5: Ciclo de Vida (8 campos)

Campos que rastreiam o ciclo de vida do agente:

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `originType` | enum | Sim | Tipo de origem (manual, template, import, clone) |
| `isDeleted` | boolean | Sim | Marca de exclusão lógica |
| `deletedAt` | datetime \| null | Não | Timestamp de exclusão |
| `activatedAt` | datetime \| null | Não | Timestamp de ativação |
| `deactivatedAt` | datetime \| null | Não | Timestamp de desativação |
| `createdAt` | datetime | Sim | Data de criação |
| `updatedAt` | datetime | Sim | Data da última atualização |
| `configSnapshotVersion` | number | Sim | Versão do snapshot de configuração |

---

## Requisitos Funcionais

### REQ-IDENT-001: Exibição de campos de identidade

**User Story:** Como operador, quero visualizar os campos de identidade do agente (nome, slug, descrições) em uma seção clara e organizada.

#### Critérios de Aceitação

1. A tab Identity SHALL exibir a seção "Identidade" com título e descrição explicativa.
2. A seção SHALL conter os campos: id (read-only), name, slug, shortDescription, longDescription.
3. O campo `id` SHALL ser exibido como texto read-only com estilo visual desabilitado.
4. Os campos `name` e `slug` SHALL ser obrigatórios e marcados com asterisco.
5. Os campos de descrição SHALL usar textarea para entrada multilinha.
6. As demais informações de identidade (owner, source, version, status) SHALL ser exibidas em grid secundário.

---

### REQ-ORIGIN-002: Exibição de campos de origem

**User Story:** Como operador, quero visualizar a origem do agente, incluindo vínculo com templates e políticas de herança.

#### Critérios de Aceitação

1. A tab Identity SHALL exibir a seção "Origem e Template" quando o agente for derivado de template.
2. A seção SHALL conter campos informativos sobre o template de origem (templateId, templateSource, templateVariant).
3. Os campos `templateInheritanceMode` e `templateLockPolicy` SHALL ser exibidos como selects.
4. O campo `isTemplateDerived` SHALL ser exibido como checkbox read-only (indicativo).
5. O campo `cloneOfAgentId` SHALL ser exibido apenas quando não for nulo.

---

### REQ-PURPOSE-003: Exibição de campos de propósito

**User Story:** Como operador, quero definir o papel, missão e objetivo do agente para entender seu propósito funcional.

#### Critérios de Aceitação

1. A tab Identity SHALL exibir a seção "Papel e Objetivo".
2. A seção SHALL conter os campos: role (obrigatório), mission, domain, objective (obrigatório).
3. O campo `successCriteria` SHALL permitir entrada de múltiplos critérios via interface de chips/tags.
4. Os campos role e objective SHALL ser destacados visualmente como campos críticos.

---

### REQ-GOV-004: Exibição de campos de governança

**User Story:** Como operador, quero configurar a governança do agente (visibilidade, ativação, edição) e adicionar tags/categorias.

#### Critérios de Aceitação

1. A tab Identity SHALL exibir a seção "Governança e Edição".
2. A seção SHALL conter os campos: isActive (toggle), isEditable (toggle), visibility (select).
3. Os campos `tags` e `categories` SHALL usar interface de chips para adicionar/remover itens.
4. O campo `auditMetadata` SHALL ser exibido de forma compacta (createdBy, updatedBy) via componente AuditMetadataDisplay.

---

### REQ-LIFECYCLE-005: Exibição de campos de ciclo de vida

**User Story:** Como operador, quero visualizar as informações de ciclo de vida do agente (criação, ativação, exclusão).

#### Critérios de Aceitação

1. A tab Identity SHALL exibir a seção "Ciclo de Vida".
2. A seção SHALL conter campos read-only: originType, createdAt, updatedAt, configSnapshotVersion.
3. Os campos `activatedAt`, `deactivatedAt`, `deletedAt` SHALL ser exibidos apenas quando preenchidos.
4. O campo `isDeleted` SHALL ser exibido como badge visual (ex: "Excluído" em vermelho quando true).
5. As datas SHALL ser formatadas em formato localizado (pt-BR).

---

### REQ-EDIT-006: Edição de campos

**User Story:** Como operador, quero editar os campos de identidade do agente e ter as alterações salvas.

#### Critérios de Aceitação

1. Campos editáveis SHALL habilitar edição quando o agente estiver em modo de edição.
2. Campos read-only (id, createdAt, etc.) SHALL permanecer desabilitados independentemente do modo.
3. As alterações SHALL ser aplicadas via onChange do componente pai.
4. Campos obrigatórios SHALL exibir indicador visual quando vazios.

---

### REQ-LAYOUT-007: Layout em grid

**User Story:** Como operador, quero ver os campos organizados em um layout de duas colunas para melhor aproveitamento de espaço.

#### Critérios de Aceitação

1. Cada seção SHALL usar layout de grid com 2 colunas em telas maiores (lg:grid-cols-2).
2. Campos de texto longo (descrições) SHALL ocupar largura completa (col-span-2).
3. O layout SHALL ser responsivo, empilhando em uma coluna em telas menores.
4. Espaçamento consistente SHALL ser mantido entre campos (gap-4 ou gap-6).

---

## Critérios de Aceitação Globais

### CA-001: Campos completos
Todos os 34 campos das 5 seções DEVEM estar presentes na tab Identity, sem omissões.

### CA-002: Integração com tipos
A tab Identity DEVE usar os tipos `AgentInstance` definidos em `frontend/src/types/kernel.ts`.

### CA-003: Integração com componentes
A tab Identity DEVE usar os componentes já implementados: FormSection, FormSectionHeader, AgentFormField.

### CA-004: Estilo consistente
Todos os campos DEVEM seguir o tema visual neon matrix (cores, bordas, foco).

### CA-005: Responsividade
O layout DEVEM adaptar-se a diferentes tamanhos de tela (mobile, tablet, desktop).

### CA-006: Estados read-only
Campos que não devem ser editados (id, timestamps, etc.) DEVEM ser claramente identificados como read-only.

### CA-007: Validação visual
Campos obrigatórios DEVEM exibir asterisco (*) e estados de erro quando aplicável.

### CA-008: Integração com página Agents
A tab Identity DEVE ser integrada na página Agents.tsx como a primeira aba do formulário de edição.

---

## Stack e Convenções

- **Frontend**: React 18 + TypeScript + TailwindCSS 3
- **Ícones**: Lucide React
- **Visual**: Neon matrix (verde/ciano sobre fundo escuro)
- **Sem bibliotecas de UI externas** (shadcn, mui, etc.)
- **Imports locais com extensão `.js`** (ESM obrigatório)
- **Localização do componente**: `frontend/src/components/agents/tabs/IdentityTab.tsx`

---

## Dependências

- Componentes já implementados em `frontend/src/components/agents/`
- Tipos em `frontend/src/types/kernel.ts`
- Constantes de campos canônicos (se existirem)
- Hook useAgents para operações de atualização
