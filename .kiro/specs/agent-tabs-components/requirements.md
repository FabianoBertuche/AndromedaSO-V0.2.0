---
name: agent-tabs-components
description: Componentes reutilizáveis para tabs de agentes (FormSection, JSONEditor, RetryPolicyForm, AuditMetadataDisplay, FormSectionHeader)
---

# Documento de Requisitos — Agent Tabs Components

## Introdução

Esta feature implementa um conjunto de componentes reutilizáveis para formulários de agentes no Andromeda SO V0.2.0. Os componentes são projetados para serem usados em tabs de configuração de agentes, fornecendo uma interface consistente para edição de configurações JSON, políticas de retry, metadados de auditoria e organização de formulários.

Stack: React 18 + TypeScript + TailwindCSS 3. Visual language: neon matrix (verde/ciano sobre fundo escuro).

---

## Glossário

- **FormSection**: Componente container para agrupar campos de formulário relacionados com título, descrição opcional e indicador de erro.
- **FormSectionHeader**: Sub-componente para exibir título de seção com ícone opcional, badge de status e ações.
- **JSONEditor**: Componente para edição validada de dados JSON com syntax highlighting, validação de schema e formatação automática.
- **RetryPolicyForm**: Componente especializado para configurar políticas de retry com campos para maxRetries, delay, backoffStrategy e retryableErrors.
- **AuditMetadataDisplay**: Componente para exibir informações de auditoria (createdAt, updatedAt, createdBy, updatedBy, version) em formato de badge ou linha.
- **ValidationError**: Estado que indica erro de validação em um campo, incluindo mensagem e severidade.

---

## Requisitos

### Requisito 1: FormSection — Container de Seção de Formulário

**User Story:** Como desenvolvedor frontend, quero um componente container para agrupar campos relacionados em uma seção visualmente distinta, com título, descrição e indicador de erro.

#### Critérios de Aceitação

1. O componente SHALL aceitar as props: `title` (string, obrigatório), `description` (string, opcional), `error` (ValidationError, opcional), `children` (ReactNode), `className` (string, opcional).
2. O componente SHALL renderizar um container visualmente destacado com borda sutil no tema neon matrix.
3. WHEN `error` for fornecido, a seção SHALL exibir indicador visual de erro (borda vermelha/coral e mensagem).
4. O container SHALL aplicar padding e spacing consistente com o design system do projeto.
5. O componente SHALL ser flexível o suficiente para conter qualquer conteúdo filho (inputs, selects, etc.).

---

### Requisito 2: FormSectionHeader — Cabeçalho de Seção

**User Story:** Como desenvolvedor frontend, quero um cabeçalho reutilizável para seções de formulário com título, ícone opcional, badge de status e ações.

#### Critérios de Aceitação

1. O componente SHALL aceitar as props: `title` (string, obrigatório), `icon` (LucideIcon, opcional), `badge` ({ text: string, variant: 'success' | 'warning' | 'error' | 'info' }, opcional), `actions` (ReactNode, opcional), `className` (string, opcional).
2. WHEN `icon` for fornecido, SHALL renderizar o ícone à esquerda do título com cor do tema neon.
3. WHEN `badge` for fornecido, SHALL renderizar um badge colorido à direita do título conforme o variant.
4. WHEN `actions` for fornecido, SHALL renderizar as ações no extremo direito do cabeçalho.
5. O cabeçalho SHALL usar tipografia consistente (tamanho, peso) com o design system.

---

### Requisito 3: JSONEditor — Editor de JSON com Validação

**User Story:** Como operador, quero editar configurações JSON de forma segura com validação em tempo real, syntax highlighting e formatação automática para evitar erros de sintaxe.

#### Critérios de Aceitação

1. O componente SHALL aceitar as props: `value` (object | string, obrigatório), `onChange` (function, obrigatório), `schema` (JSONSchema, opcional), `label` (string, opcional), `placeholder` (string, opcional), `disabled` (boolean, opcional), `minHeight` (string, opcional, default: '150px'), `className` (string, opcional).
2. O componente SHALL renderizar uma textarea ou editor com syntax highlighting para JSON.
3. WHEN o valor for um object, o componente SHALL serializá-lo para exibição formatada.
4. WHEN o usuário digitar, o componente SHALL validar a sintaxe JSON em tempo real.
5. WHEN o JSON for inválido, o componente SHALL exibir mensagem de erro indicando a posição do erro.
6. WHEN `schema` for fornecido, o componente SHALL validar o JSON contra o schema e exibir erros de validação.
7. O componente SHALL fornecer botão ou atalho para formatar/prettify o JSON automaticamente.
8. O componente SHALL aceitar atalho de teclado (Ctrl/Cmd + Enter) para formatar.

---

### Requisito 4: RetryPolicyForm — Formulário de Política de Retry

**User Story:** Como operador, quero configurar políticas de retry para operações do agente com campos intuitivos para tentativas, delay, estratégia de backoff e erros retryáveis.

#### Critérios de Aceitação

1. O componente SHALL aceitar as props: `value` (RetryPolicy, obrigatório), `onChange` (function, obrigatório), `disabled` (boolean, opcional), `className` (string, opcional).
2. O componente SHALL renderizar campos para: `maxRetries` (number, 0-10), `delay` (number, ms), `backoffStrategy` (enum: 'fixed' | 'exponential' | 'linear'), `retryableErrors` (string[]).
3. O campo `maxRetries` SHALL usar input numérico com validação de range.
4. O campo `delay` SHALL aceitar valor em milissegundos com conversão visual para segundos quando apropriado.
5. O campo `backoffStrategy` SHALL usar select dropdown com opções predefinidas.
6. O campo `retryableErrors` SHALL permitir adicionar/remover códigos de erro em formato de tags/chips.
7. WHEN `maxRetries` for 0, os demais campos SHOULD ser desabilitados visualmente.
8. O componente SHALL exibir preview da política resultante em formato legível.

---

### Requisito 5: AuditMetadataDisplay — Exibição de Metadados de Auditoria

**User Story:** Como operador, quero visualizar informações de auditoria (quando e por quem o agente foi criado/modificado) de forma discreta e informativa.

#### Critérios de Aceitação

1. O componente SHALL aceitar as props: `metadata` (AuditMetadata, obrigatório), `variant` ('row' | 'badges' | 'compact', opcional, default: 'row'), `showVersion` (boolean, opcional, default: true), `className` (string, opcional).
2. O tipo `AuditMetadata` SHALL conter: `createdAt` (ISO string), `updatedAt` (ISO string), `createdBy` (string, opcional), `updatedBy` (string, opcional), `version` (number).
3. WHEN `variant='row'`, SHALL exibir informações em linha com separadores.
4. WHEN `variant='badges'`, SHALL exibir cada metadado como badge separado.
5. WHEN `variant='compact'`, SHALL exibir apenas ícones com tooltip nas datas.
6. As datas SHALL ser formatadas em formato localizado (pt-BR).
7. WHEN `showVersion` for true, SHALL exibir badge com número da versão.
8. O componente SHALL usar cores sutis do tema neon (cinza/verde claro).

---

### Requisito 6: Integração Visual Consistente

**User Story:** Como desenvolvedor frontend, quero que todos os componentes sigam o mesmo sistema visual neon matrix para manter consistência na aplicação.

#### Critérios de Aceitação

1. Todos os componentes SHALL usar TailwindCSS classes consistentes com o tema do projeto.
2. Cores: fundo escuro (`bg-slate-950`), texto ciano/verde (`text-cyan-300`, `text-green-400`), bordas sutis (`border-cyan-500/30`).
3. Tipografia: usar font-sans com tamanhos consistentes.
4. Estados de foco: glow sutil em ciano (`focus:ring-cyan-500/50`).
5. Estados de erro: borda coral/vermelha (`border-red-500`, `text-red-400`).
6. Todos os componentes SHALL ser responsivos e funcionar em telas de tamanhos variados.

---

## Stack e Convenções

- **Frontend**: React 18 + TypeScript + TailwindCSS 3
- **Ícones**: Lucide React (já usado no projeto)
- **Visual**: Neon matrix (verde/ciano sobre fundo escuro)
- **Sem bibliotecas de UI externas** (shadcn, mui, etc.)
- **Imports locais com extensão `.js`** (ESM obrigatório)
- **Localização dos componentes**: `frontend/src/components/agents/`

---

## Tipos Compartilhados

```typescript
// Tipos usados pelos componentes

export type ValidationError = {
  message: string;
  severity?: 'error' | 'warning';
};

export type RetryPolicy = {
  maxRetries: number;
  delay: number;
  backoffStrategy: 'fixed' | 'exponential' | 'linear';
  retryableErrors: string[];
};

export type AuditMetadata = {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  version: number;
};

export type JSONSchema = {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
};
```
