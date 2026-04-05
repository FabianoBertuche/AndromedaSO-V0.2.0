---
name: frontend-agents-management
description: Interface completa de gestão de agentes no frontend com criação, edição, duplicação, ativação/desativação, carregamento e listagem de templates
---

# Documento de Requisitos — Frontend Agents Management

## Introdução

Esta feature implementa a interface frontend para gestão de agentes configuráveis do Andromeda SO V0.2.0. A interface permite aos operadores criar, editar, duplicar, ativar, desativar e carregar agentes, além de listar templates disponíveis.

O módulo de agentes backend já expõe os seguintes endpoints HTTP que serão consumidos pelo frontend:

- `GET /api/agents/templates` — listar templates disponíveis
- `GET /api/agents` — listar todos os agentes
- `GET /api/agents/:id` — obter detalhe de um agente
- `POST /api/agents` — criar agente a partir de template
- `PUT /api/agents/:id` — editar agente existente
- `DELETE /api/agents/:id` — excluir logicamente um agente
- `POST /api/agents/:id/duplicate` — duplicar um agente
- `POST /api/agents/:id/activate` — ativar um agente
- `POST /api/agents/:id/deactivate` — desativar um agente
- `POST /api/agents/:id/load` — carregar configuração resolvida de um agente

Stack: React 18 + Vite 5 + TailwindCSS 3 + TanStack React Query 5. Visual language: neon matrix (verde/ciano sobre fundo escuro).

---

## Glossário

- **AgentInstance**: Instância configurável de agente criada pelo usuário, com identidade própria e vínculo com template de origem.
- **AgentTemplateManifest**: Artefato declarativo predefinido que define manifesto, configuração, metadata e parâmetros padrão de um template.
- **ResolvedAgentConfig**: Configuração final do agente após aplicar a cadeia determinística de resolução.
- **CreateAgentInput**: Payload para criação de novo agente via POST /api/agents.
- **UpdateAgentInput**: Payload para edição de agente existente via PUT /api/agents/:id.
- **DuplicateAgentInput**: Payload para duplicação de agente existente via POST /api/agents/:id/duplicate.
- **LoadAgentInput**: Payload para carregamento de configuração resolvida via POST /api/agents/:id/load.

---

## Requisitos

### Requisito 1: Listar templates disponíveis

**User Story:** Como operador, quero ver a lista de templates de agentes disponíveis no sistema para escolher qual usar na criação de novos agentes.

#### Critérios de Aceitação

1. A aplicação SHALL chamar `GET /api/agents/templates` ao carregar a aba "Agents" ou ao selecionar a tab "Templates".
2. A interface SHALL exibir cada template com seu `templateId`, `name`, `group`, `variant`, `version` e `status`.
3. WHEN a requisição falhar, a interface SHALL exibir mensagem de erro indicando falha ao carregar templates.
4. WHEN não houver templates disponíveis, a interface SHALL exibir a mensagem "Nenhum template disponível."

---

### Requisito 2: Listar agentes instanciados

**User Story:** Como operador, quero ver a lista de agentes já criados no sistema para gerenciá-los.

#### Critérios de Aceitação

1. A aplicação SHALL chamar `GET /api/agents` ao carregar a tab "Agentes".
2. A interface SHALL exibir cada agente com seu `id`, `name`, `templateId`, `status`, `createdAt` e `updatedAt`.
3. A lista SHALL suportar ordenação por nome, status ou data de criação.
4. WHEN a requisição falhar, a interface SHALL exibir mensagem de erro indicando falha ao carregar agentes.

---

### Requisito 3: Ver detalhe de agente

**User Story:** Como operador, quero visualizar os detalhes completos de um agente específico para entender sua configuração.

#### Critérios de Aceitação

1. A aplicação SHALL chamar `GET /api/agents/:id` ao clicar em um agente na lista.
2. A interface SHALL exibir todos os campos do agente incluindo `name`, `slug`, `description`, `role`, `goal`, `personality`, `systemInstructions`, `restrictions`, `status` e `sourceTemplateId`.
3. A interface SHALL exibir a configuração resolvida se o agente estiver carregado.

---

### Requisito 4: Criar agente a partir de template

**User Story:** Como operador, quero criar um novo agente selecionando um template base e customizando seus parâmetros.

#### Critérios de Aceitação

1. A interface SHALL exibir um botão "Criar Agente" que abre um modal de criação.
2. O modal SHALL listar os templates disponíveis para seleção.
3. O usuário SHALL poder informar `name`, `description` e demais campos configuráveis.
4. A aplicação SHALL chamar `POST /api/agents` com o payload de criação ao submeter o formulário.
5. WHEN a criação for bem-sucedida, a interface SHALL fechar o modal, atualizar a lista de agentes e exibir mensagem de sucesso.
6. WHEN a criação falhar, a interface SHALL exibir mensagem de erro e manter o modal aberto para correção.

---

### Requisito 5: Editar agente existente

**User Story:** Como operador, quero editar um agente existente para ajustar sua configuração.

#### Critérios de Aceitação

1. A interface SHALL exibir um botão "Editar" em cada linha de agente na lista.
2. O clique SHALL abrir um modal de edição pré-preenchido com os dados atuais do agente.
3. O usuário SHALL poder modificar os campos configuráveis exceto identificadores básicos.
4. A aplicação SHALL chamar `PUT /api/agents/:id` com o payload de atualização ao submeter.
5. WHEN a edição for bem-sucedida, a interface SHALL atualizar a lista e exibir mensagem de sucesso.

---

### Requisito 6: Deletar agente

**User Story:** Como operador, quero excluir um agente que não é mais necessário.

#### Critérios de Aceitação

1. A interface SHALL exibir um botão "Excluir" em cada linha de agente.
2. O clique SHALL solicitar confirmação antes da exclusão.
3. A aplicação SHALL chamar `DELETE /api/agents/:id` ao confirmar.
4. WHEN a exclusão for bem-sucedida, a interface SHALL remover o agente da lista e exibir mensagem de sucesso.

---

### Requisito 7: Duplicar agente

**User Story:** Como operador, quiero duplicar um agente existente para criar um novo com base em sua configuração.

#### Critérios de Aceitação

1. A interface SHALL exibir um botão "Duplicar" em cada linha de agente.
2. O clique SHALL abrir um modal solicitando o nome do novo agente.
3. A aplicação SHALL chamar `POST /api/agents/:id/duplicate` com o payload de duplicação.
4. WHEN a duplicação for bem-sucedida, a interface SHALL adicionar o novo agente à lista.

---

### Requisito 8: Ativar e desativar agente

**User Story:** Como operador, quiero ativar ou desativar um agente para controlar sua disponibilidade no sistema.

#### Critérios de Aceitação

1. A interface SHALL exibir botões "Ativar" e "Desativar" conforme o status atual do agente.
2. O clique SHALL chamar `POST /api/agents/:id/activate` ou `POST /api/agents/:id/deactivate`.
3. A interface SHALL atualizar o status do agente na lista após a operação.
4. WHEN a operação falhar, a interface SHALL exibir mensagem de erro.

---

### Requisito 9: Carregar configuração resolvida

**User Story:** Como operador, quiero carregar a configuração resolvida de um agente para verificar seus parâmetros finais.

#### Critérios de Aceitação

1. A interface SHALL exibir um botão "Carregar Configuração" na visualização de detalhes do agente.
2. O clique SHALL chamar `POST /api/agents/:id/load`.
3. A interface SHALL exibir o `ResolvedAgentConfig` retornado, incluindo `resolutionTrace` para rastreabilidade.

---

### Requisito 10: Integração com aba "Agents" existente

**User Story:** Como operador, quero que a interface de gestão de agentes seja acessível pela aba "Agents" já existente no App.tsx.

#### Critérios de Aceitação

1. A tab "Agents" SHALL renderizar a nova página `Agents.tsx` com as tabs internas "Templates" e "Agentes".
2. A página SHALL substituir a visualização atual do `AgentTable` com descoberta de agentes.
3. A transição SHALL manter a experiência visual neon matrix consistente com as demais páginas.

---

## Stack e Convenções

- **Frontend**: React 18 + Vite 5 + TailwindCSS 3 + TanStack React Query 5
- **Visual**: Neon matrix (verde/ciano sobre fundo escuro)
- **Data fetching**: Hooks em `useProviders.ts` ou funções em `kernel.ts`
- **Sem bibliotecas de UI externas** (shadcn, mui, etc.)
- **Imports locais com extensão `.js`** (ESM obrigatório)
