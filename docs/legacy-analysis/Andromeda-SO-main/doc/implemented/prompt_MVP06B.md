Você irá implementar o subsistema de sandbox do projeto Andromeda com base na documentação oficial localizada em:

/doc/Andromeda_PRD_MVP06B.md

Leia esse arquivo como fonte principal de verdade e execute a implementação de forma completa, consistente e alinhada à arquitetura já existente do projeto.

## OBJETIVO

Implementar por completo o subsistema de **Sandbox** do Andromeda como uma fundação de segurança, governança e execução operacional de agentes.

A sandbox deve ser tratada como um subsistema central, e não como detalhe técnico isolado.

Ela deve garantir:

- isolamento de execução
- controle de capacidades operacionais
- restrições de filesystem, rede, processos e recursos
- auditoria completa
- suporte a aprovações humanas
- integração com agentes, skills e políticas de capability
- base para runners `process`, `container` e estrutura preparada para `remote`

---

## ARQUIVO DE REFERÊNCIA OBRIGATÓRIO

Use como base principal:

/doc/Andromeda_PRD_MVP06B.md

Não invente arquitetura paralela.
Não simplifique a modelagem central.
Siga o documento como PRD técnico oficial.

Se encontrar algum ponto ambíguo, preserve os princípios do documento:

- deny by default
- capability-first
- sandbox-first
- most restrictive wins
- auditability by default

---

## ESCOPO DE IMPLEMENTAÇÃO

Implemente os blocos abaixo.

### 1. Domínio Sandbox

Criar as entidades, value objects e serviços de domínio necessários para o subsistema, incluindo no mínimo:

#### Entidades
- SandboxProfile
- AgentSandboxConfig
- SandboxExecution
- SandboxArtifact
- ApprovalRequest

#### Value Objects
- FilesystemPolicy
- NetworkPolicy
- ResourceLimits
- ExecutionPolicy
- EnvironmentPolicy
- SecurityPolicy
- IOPolicy
- AuditPolicy
- ApprovalPolicy

#### Serviços de domínio
- CapabilityPolicyEngine
- SandboxPolicyResolver
- SandboxValidator
- RiskLevelCalculator

---

### 2. Regras obrigatórias

Implementar as regras centrais descritas no documento, incluindo:

- capabilities operacionais exigem sandbox
- deny by default
- validação de policy antes da execução
- consolidação de policy com regra “mais restritiva vence”
- bloqueio de binários proibidos
- bloqueio de escrita fora do escopo sem autorização
- bloqueio de execução privilegiada
- não herdar segredos do host por padrão
- auditoria obrigatória para execuções operacionais

---

### 3. Perfis de Sandbox

Implementar suporte a perfis reutilizáveis (`SandboxProfile`) com presets oficiais.

Criar presets iniciais conforme o documento, como:

- Safe Readonly
- Research
- Code Runner
- Automation Restricted
- Operator Elevated

Esses presets devem poder ser atribuídos a agentes e receber overrides controlados.

---

### 4. Configuração por agente

Implementar a configuração de sandbox por agente com:

- `enabled`
- `profileId`
- `overrides`
- `enforcement`
- capabilities obrigatórias que exigem sandbox
- comportamento fallback em caso de ausência de sandbox

---

### 5. Resolvedor de policy efetiva

Implementar a lógica para compor a política final a partir de:

1. política global
2. perfil da sandbox
3. configuração do agente
4. requisitos da skill
5. overrides temporários permitidos
6. restrições do ambiente

A saída deve ser uma **effective policy** consolidada e validável.

---

### 6. Validação

Implementar um validador robusto que impeça configurações inválidas ou perigosas.

Validar, entre outros:

- paths inválidos
- conflito entre allowed e blocked binaries
- `mode=none` fora de desenvolvimento
- `network.mode=full` sem autorização especial
- `allowShell=true` elevando risco
- limites de memória, cpu, disco e timeout
- diretório de trabalho fora da área controlada
- ausência de write paths quando a capability exigir escrita

---

### 7. Runners

Implementar ao menos:

#### ProcessSandboxRunner
Runner funcional para desenvolvimento/MVP avançado.

#### ContainerSandboxRunner
Estrutura pronta e preferencialmente funcional se a stack atual já suportar isso sem remendos.

#### RemoteSandboxRunner
Pode ficar inicialmente como interface/adapter preparado, sem implementação completa se o documento permitir isso nesta fase.

---

### 8. Orquestração de execução

Implementar o fluxo completo de execução sandbox:

- valida capability
- resolve policy
- valida policy
- checa aprovação
- provisiona ambiente
- executa runner
- coleta logs
- coleta artefatos
- registra métricas e status
- persiste auditoria
- retorna resultado padronizado

---

### 9. Auditoria

Implementar auditoria completa para execuções sandbox, incluindo quando aplicável:

- agentId
- taskId
- skillId
- capability
- command
- policySnapshot
- stdout
- stderr
- exitCode
- duration
- uso de recursos
- artefatos gerados
- erros
- bloqueios por policy

---

### 10. Artefatos

Implementar gerenciamento de artefatos com:

- persistência opcional conforme policy
- hash SHA-256
- metadados
- retenção
- listagem por execução
- limites de tamanho

---

### 11. Aprovações humanas

Implementar `ApprovalRequest` e fluxo de aprovação para ações sensíveis, como:

- execuções que exigem approval
- escrita fora do workspace
- uso de rede quando configurado
- artefatos grandes quando configurado

Criar endpoints e estrutura para aprovar/rejeitar.

---

### 12. API REST

Implementar os endpoints descritos no PRD.

No mínimo:

#### Perfis
- GET /sandbox/profiles
- POST /sandbox/profiles
- GET /sandbox/profiles/:id
- PUT /sandbox/profiles/:id
- DELETE /sandbox/profiles/:id

#### Configuração por agente
- GET /agents/:id/sandbox
- PUT /agents/:id/sandbox

#### Validação e simulação
- POST /sandbox/validate
- POST /sandbox/dry-run

#### Execuções
- GET /sandbox/executions
- GET /sandbox/executions/:id
- GET /sandbox/executions/:id/logs
- GET /sandbox/executions/:id/artifacts
- POST /sandbox/executions/:id/cancel

#### Aprovações
- GET /approvals
- POST /approvals/:id/approve
- POST /approvals/:id/reject

---

### 13. Persistência

Criar as estruturas de banco necessárias conforme o documento:

- sandbox_profiles
- agent_sandbox_configs
- sandbox_executions
- sandbox_artifacts
- approval_requests

Criar migrations, models e repositories compatíveis com a stack atual do projeto.

---

### 14. Frontend / interface web

Implementar a aba/área de Sandbox na gestão de agentes.

A interface deve incluir:

- estado geral
- seleção de preset
- filesystem
- rede
- recursos
- execução
- segurança
- auditoria
- aprovações
- visualização da effective policy
- badge de risco
- validação antes de salvar
- dry-run
- histórico de execuções

Se necessário, implemente progressivamente, mas preserve a estrutura final.

---

## REQUISITOS DE QUALIDADE

Ao implementar:

- preserve Clean Architecture / Ports & Adapters do projeto
- evite acoplamento indevido
- não crie atalhos inseguros
- não coloque regra de negócio importante em controller
- mantenha separação clara entre domínio, aplicação, infraestrutura e interface
- mantenha código legível, modular e extensível
- documente decisões importantes inline quando necessário

---

## RESULTADO ESPERADO

Ao final, entregar:

1. código implementado
2. estrutura de domínio completa
3. endpoints funcionando
4. persistência criada
5. sandbox policy resolver funcional
6. validator funcional
7. runner process funcional
8. UI inicial funcional da sandbox
9. auditoria funcional
10. aprovações estruturadas
11. presets iniciais disponíveis
12. documentação técnica complementar atualizada se necessário

---

## INSTRUÇÃO FINAL

Comece lendo:

/doc/Andromeda_PRD_MVP06B.md

Depois implemente de forma incremental, mas já deixando o resultado final coerente com a visão completa do subsistema.

Sempre que houver dúvida de design, priorize a segurança, a auditabilidade e a coerência arquitetural descritas no documento.