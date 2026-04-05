# Documento de Requisitos — agents-module

## Introdução

Este documento descreve os requisitos para o módulo de agentes do Andromeda SO V0.2.0. A feature cria um subsistema modular responsável por cadastro, edição, exclusão lógica, duplicação, ativação/desativação, instanciação por template e carregamento de agentes configuráveis, com suporte a templates predefinidos adicionáveis por pasta e resolução determinística da configuração final.

O objetivo é permitir que cada agente seja uma entidade configurável, persistente, rastreável e estritamente guiada por seus campos resolvidos de identidade, papel, objetivo, personalidade, instruções, restrições, governança e parâmetros operacionais declarados, preservando a arquitetura modular do sistema e a integração com o core/kernel por contratos, manifestos e registry.

---

## Glossário

- **Agent Instance**: Instância configurável de agente criada pelo usuário ou pelo sistema, com identidade própria, vínculo com template de origem, parâmetros explícitos e overrides opcionais.
- **Agent Template**: Artefato declarativo predefinido que define manifesto, configuração, metadata, tests, scenarios e parâmetros padrão reutilizáveis.
- **Resolved Agent Config**: Configuração final do agente após aplicar a cadeia determinística de resolução permitida.
- **Operational Bindings**: Bindings válidos para provider, model e channel aplicados quando a operação exigir contexto explícito de execução.
- **Agent Manifest**: Documento declarativo versionado que descreve template, parâmetros padrão e metadados do agente.
- **Agent Registry**: Camada de catálogo e consulta das instâncias de agentes persistidas e seus vínculos com templates.
- **Deterministic Resolution**: Processo de composição cujo resultado é sempre o mesmo para a mesma entrada e ordem de fontes.
- **Strict Load**: Política segundo a qual o agente só pode ser carregado para execução após resolução completa e validação do contrato final.

---

## Requisitos

### Requisito 1: Estrutura modular raiz do módulo de agentes

**User Story:** Como arquiteto do sistema, quero que o módulo de agentes exista como um módulo raiz próprio com manifestos e contratos explícitos, para que sua evolução siga a arquitetura modular do Andromeda e não fique espalhada pelo repositório.

#### Critérios de Aceitação

1. THE Andromeda SHALL conter uma raiz `modules/agents/` dedicada ao módulo de agentes.
2. THE módulo `agents` SHALL conter `module.manifest.yaml`, `README.md`, diretório `contracts/`, diretório `groups/` e artefatos declarativos necessários para discovery.
3. THE módulo `agents` SHALL suportar organização por `groups/<group-name>/variants/<variant-name>/templates/<template-id>/`.
4. WHEN um novo template for adicionado por nova pasta contendo `template.manifest.yaml`, THE sistema SHALL descobri-lo sem alteração de código do kernel.
5. THE core/kernel SHALL depender apenas de contratos, manifestos, discovery e registry do módulo de agentes, e não de implementações concretas internas dos templates.

---

### Requisito 2: Contratos canônicos de agente, template e resolução

**User Story:** Como desenvolvedor do kernel, quero contratos canônicos e versionáveis para instâncias, templates e configuração resolvida, para que o core consiga validar entradas e saídas do módulo sem acoplamento indevido.

#### Critérios de Aceitação

1. THE Kernel SHALL definir um contrato canônico para `AgentInstance`.
2. THE Kernel SHALL definir um contrato canônico para `AgentTemplateManifest`.
3. THE Kernel SHALL definir um contrato canônico para `ResolvedAgentConfig`.
4. THE contrato `ResolvedAgentConfig` SHALL incluir no mínimo os campos `agentId`, `templateId`, `name`, `slug`, `description`, `role`, `goal`, `personality`, `tone`, `responseStyle`, `systemInstructions`, `restrictions`, `securityRules`, `defaultLanguage`, `tags`, `status`, `visibility`, `sourceTemplateId`, `preferredModel` or `compatibleModelStrategy`, `allowedChannels`, `enabledCapabilities`, `operationalParameters`, `bindings`, `resolutionTrace` e `configHash`.
5. WHEN qualquer payload de agente, template ou resolução violar o contrato canônico, THE sistema SHALL rejeitar a operação antes da persistência ou carga do agente.

---

### Requisito 3: Criação e instanciação de agentes configuráveis

**User Story:** Como operador do sistema, quero criar agentes a partir de templates e overrides declarativos, para que eu possa instanciar comportamentos especializados sem modificar o código.

#### Critérios de Aceitação

1. THE sistema SHALL permitir criar um `AgentInstance` referenciando um template base existente.
2. THE sistema SHALL materializar na criação uma configuração inicial editável derivada do template de origem.
3. THE sistema SHALL permitir informar ao menos os grupos de parâmetros `Identidade`, `Papel e objetivo`, `Personalidade`, `Instruções`, `Modelo e execução`, `Capacidades`, `Canais e integração` e `Governança`.
4. IF o `templateId` informado não existir, THEN THE sistema SHALL rejeitar a criação com erro de validação descritivo.
5. WHEN a criação for concluída com sucesso, THE sistema SHALL persistir a instância do agente, manter o vínculo com o template de origem e torná-la consultável no registry de agentes.

---

### Requisito 4: Personalização e edição de agentes

**User Story:** Como operador do sistema, quero editar agentes existentes sem perder o vínculo com seus templates e herança, para que eu possa ajustar comportamento, regras e parâmetros ao longo do tempo.

#### Critérios de Aceitação

1. THE sistema SHALL validar toda edição por schema ou contrato antes de persistir.
2. THE sistema SHALL permitir atualizar na v1 todos os campos configuráveis do agente, exceto identificadores básicos imutáveis e metadados de criação.
3. WHEN um agente for editado, THE sistema SHALL recalcular sua configuração resolvida com a nova entrada declarativa.
4. IF a edição introduzir conflito inválido de contrato ou referência para template inexistente, THEN THE sistema SHALL rejeitar a alteração sem persistir estado parcial.
5. THE sistema SHALL registrar `updatedAt` e incrementar a versão lógica da instância a cada edição bem-sucedida.

---

### Requisito 5: Exclusão lógica de agentes

**User Story:** Como operador do sistema, quero excluir agentes configuráveis que não são mais necessários, para que o catálogo permaneça limpo e coerente.

#### Critérios de Aceitação

1. THE sistema SHALL permitir excluir logicamente um agente existente pelo seu identificador.
2. WHEN um agente existente for excluído logicamente, THE registry de agentes SHALL deixar de retorná-lo em listagens padrão e consultas ativas por ID.
3. WHEN a exclusão for solicitada para um agente inexistente, THE sistema SHALL retornar erro descritivo de não encontrado.
4. THE exclusão de uma instância de agente SHALL NOT remover templates declarativos do filesystem.
5. THE hard delete SHALL ficar fora do escopo da versão inicial.

---

### Requisito 6: Duplicação, ativação e desativação de agentes

**User Story:** Como operador do sistema, quero duplicar e ativar ou desativar agentes, para que eu possa reutilizar configurações e controlar disponibilidade sem recriar tudo do zero.

#### Critérios de Aceitação

1. THE sistema SHALL permitir duplicar um agente existente gerando nova identidade persistida.
2. THE agente duplicado SHALL preservar a configuração editável do original, exceto identificadores, timestamps e demais campos imutáveis.
3. THE sistema SHALL permitir ativar e desativar agentes existentes sem alterar seu histórico essencial.
4. WHEN um agente estiver desativado, THEN THE runtime SHALL bloquear sua carga para execução.
5. WHEN a duplicação ou mudança de status violar contrato, THEN THE sistema SHALL rejeitar a operação antes da persistência.

---

### Requisito 7: Descoberta e catálogo de templates por pasta

**User Story:** Como mantenedor do módulo, quero adicionar templates por pasta com manifesto declarativo, para que o sistema cresça por adição organizada e não por alterações espalhadas.

#### Critérios de Aceitação

1. THE sistema SHALL descobrir templates em `modules/agents/groups/*/variants/*/templates/*/template.manifest.yaml`.
2. THE descoberta SHALL validar cada manifesto de template antes de adicioná-lo ao catálogo.
3. THE catálogo de templates SHALL expor `templateId`, `group`, `variant`, `version`, `status`, `metadata`, `config`, `tests`, `scenarios` e parâmetros padrão declarados.
4. IF um manifesto de template estiver inválido, THEN THE sistema SHALL ignorar o template inválido, registrar erro com o caminho do arquivo e continuar a descoberta dos demais templates válidos.
5. IF dois templates válidos declararem o mesmo `templateId`, THEN THE sistema SHALL rejeitar o catálogo com erro de duplicidade determinístico.
6. THE alterações posteriores em um template SHALL NOT sobrescrever automaticamente agentes já instanciados a partir dele.

---

### Requisito 8: Resolução determinística da configuração final

**User Story:** Como desenvolvedor do runtime, quero uma resolução determinística e rastreável da configuração final do agente, para que o comportamento do agente seja previsível, testável e reproduzível.

#### Critérios de Aceitação

1. THE sistema SHALL resolver a configuração final de cada agente segundo a seguinte ordem fixa de precedência: `template base`, `parâmetros padrão do template`, `overrides do agente`, `parâmetros operacionais explícitos` e `bindings válidos` quando aplicável.
2. THE resolução SHALL produzir o mesmo `ResolvedAgentConfig` para a mesma entrada, na mesma ordem de fontes aplicadas.
3. THE resolução SHALL incluir `resolutionTrace` contendo a sequência exata de fontes aplicadas na composição final.
4. THE resolução SHALL NOT aplicar defaults implícitos fora dessa cadeia.
5. THE resolução SHALL combinar campos escalares, objetos e listas segundo regras explícitas de merge definidas no design técnico.
6. IF uma restrição declarada por template ou override entrar em conflito com a política de merge permitida, THEN THE sistema SHALL rejeitar a resolução antes da carga.

---

### Requisito 9: Carga estrita do agente para execução

**User Story:** Como orquestrador do kernel, quero carregar apenas agentes totalmente resolvidos e validados, para que cada agente execute estritamente dentro de sua personalidade, instruções, restrições e parâmetros finais.

#### Critérios de Aceitação

1. THE sistema SHALL expor uma operação de carga de agente que retorna o `ResolvedAgentConfig` validado.
2. THE runtime SHALL receber apenas o `ResolvedAgentConfig` e SHALL NOT depender de fragments soltos de template ou override durante a execução.
3. THE runtime SHALL refletir exatamente os campos resolvidos definidos em contrato.
4. WHEN um agente for carregado, THE sistema SHALL validar `systemInstructions`, `restrictions`, `securityRules`, `enabledCapabilities`, `operationalParameters` e `bindings` antes de disponibilizá-lo ao runtime.
5. IF o agente estiver desativado ou com configuração inválida, THEN THE sistema SHALL bloquear a carga do agente e registrar erro descritivo.
6. WHEN a carga for concluída com sucesso, THE sistema SHALL retornar o hash lógico da configuração resolvida para rastreabilidade.

---

### Requisito 10: Persistência e fallback compatíveis com o kernel

**User Story:** Como operador do kernel, quero que o módulo de agentes funcione com persistência principal em PostgreSQL e fallback em memória, para que o ambiente de desenvolvimento continue operando mesmo sem banco obrigatório.

#### Critérios de Aceitação

1. THE módulo de agentes SHALL expor uma interface `AgentRepository` desacoplada da implementação concreta.
2. THE sistema SHALL fornecer implementação em memória para testes e fallback local.
3. THE sistema SHALL fornecer implementação PostgreSQL para persistência principal.
4. THE seleção entre repositório em memória e PostgreSQL SHALL seguir a convenção já usada pelos módulos do kernel para fallback quando PostgreSQL não estiver disponível.
5. THE templates SHALL ser persistidos por manifesto e arquivos do módulo, podendo opcionalmente ser indexados no banco.
6. THE configuração resolvida SHALL ser calculada sob demanda e/ou persistida como snapshot versionado, desde que o resultado continue determinístico.
7. THE camada de aplicação SHALL NOT importar clientes de banco diretamente; ela SHALL depender apenas de `AgentRepository`.

---

### Requisito 11: Segurança, conformidade, API e testes do módulo de agentes

**User Story:** Como desenvolvedor, quero endpoints e testes automatizados para o módulo de agentes, para que CRUD, discovery, resolução e carga sejam verificáveis sem ambiguidade.

#### Critérios de Aceitação

1. THE Kernel SHALL expor endpoints HTTP para listar templates, criar agentes, listar agentes, obter agente por ID, editar agente, excluir logicamente agente, duplicar agente, ativar ou desativar agente e carregar agente resolvido.
2. THE módulo SHALL validar toda entrada por schema ou contrato antes de processar payload estrutural crítico.
3. THE runtime SHALL NOT executar agente com configuração inválida.
4. THE módulo SHALL conter testes unitários para discovery de templates, resolução determinística e regras de merge.
5. THE módulo SHALL conter testes unitários para `AgentRepositoryMemory` e para o serviço de aplicação de agentes.
6. THE módulo SHALL conter testes de integração HTTP cobrindo create, update, soft delete, duplicate, activate/deactivate, list templates e load resolved agent.
7. WHEN os testes do módulo forem executados, THE operações principais SHALL passar de forma reproduzível em ambiente local.
