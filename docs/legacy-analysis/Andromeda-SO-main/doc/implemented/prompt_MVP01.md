Você deve implementar o MVP v0.1 do projeto Andromeda OS.

A especificação completa está no arquivo:

* doc/Andromeda_PRD_MVP01.md

Leia esse documento inteiro antes de iniciar qualquer implementação.

---

# REGRAS OBRIGATÓRIAS

1. NÃO inventar features fora do escopo do MVP
2. NÃO alterar a arquitetura definida no documento
3. NÃO simplificar removendo componentes importantes
4. NÃO começar pelo frontend
5. NÃO ignorar TDD nas partes determinísticas

---

# PRIORIDADES ABSOLUTAS

1. funcionamento end-to-end
2. confiabilidade do fluxo
3. clareza de execução
4. observabilidade (logs e eventos)
5. uso de skills antes de LLM

---

# ORDEM DE IMPLEMENTAÇÃO (OBRIGATÓRIA)

Siga exatamente esta sequência:

## FASE 1 — CORE

* implementar Task Object
* implementar TaskRepository
* implementar TaskEvent
* implementar State Machine de Task
* criar endpoints básicos de Task

## FASE 2 — SKILLS

* implementar Skill Registry
* implementar Script Skill Runtime
* implementar Skill Resolver (capability-based)
* aplicar política "skill-first"

## FASE 3 — EXECUTION ENGINE

* implementar ExecutionStrategy
* implementar ExecutionStrategyFactory
* implementar pipeline de execução (Template Method)

## FASE 4 — AGENTS

* implementar Agent Registry
* implementar LLM Agent Executor
* implementar Script Agent Runtime

## FASE 5 — LLM ROUTER

* implementar Model Registry
* implementar Router v0
* respeitar override explícito do usuário

## FASE 6 — AUDITORIA

* implementar Audit Service
* implementar Auditor Agent
* garantir separação executor/auditor

## FASE 7 — MEMORY

* implementar Session Memory
* implementar Episodic Memory
* implementar Semantic Memory básica

## FASE 8 — RAG

* implementar upload de documentos
* implementar indexação
* implementar retrieval por agente

## FASE 9 — OPENCLAW COMPAT

* implementar parser de skills OpenClaw
* implementar adapter
* permitir execução mínima

## FASE 10 — PAINEL

* lista de tasks
* detalhe da task
* logs
* auditoria
* skills
* agents

---

# REGRA CRÍTICA DE EXECUÇÃO

Sempre seguir este fluxo:

criar tarefa
→ estruturar (task model)
→ resolver estratégia (skill ou LLM)
→ executar
→ auditar
→ registrar logs
→ atualizar estado

---

# REGRAS DE DESIGN (OBRIGATÓRIAS)

* usar arquitetura baseada em ports and adapters
* usar use cases para lógica principal
* usar strategy para execução
* usar factory para criação de executores
* usar state machine para tasks
* usar repository para persistência
* usar adapter para OpenClaw e LLM providers
* usar decorator para logging e métricas

---

# REGRAS DE TESTE

* TDD obrigatório para:

  * entities
  * policies
  * strategies
  * state machine
  * registries

* criar integration tests para:

  * fluxo completo de task
  * skill execution
  * auditoria

* criar eval tests para:

  * aderência ao pedido
  * respeito a restrições
  * comportamento do auditor

---

# CRITÉRIO DE CONCLUSÃO DO MVP

O MVP está pronto quando:

* uma task pode ser criada via API ou UI
* task é estruturada corretamente
* sistema escolhe skill quando disponível
* fallback para LLM funciona
* usuário pode definir modelo explicitamente
* executor gera resultado persistido
* auditor revisa resultado
* logs estão visíveis
* RAG funciona por agente
* uma skill OpenClaw roda com sucesso

---

# IMPORTANTE

* começar pelo backend/core
* só implementar frontend após fluxo completo funcionar
* priorizar simplicidade sobre abstração excessiva
* evitar overengineering

---

# OBJETIVO FINAL

Entregar um sistema funcional que prove:

* execução confiável
* skill-first funcionando
* auditoria independente
* agentes híbridos
* base sólida para evolução

Pare após atingir o MVP.

Não expandir além disso.
