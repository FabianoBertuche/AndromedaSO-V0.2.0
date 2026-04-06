PRD — MVP 01
Andromeda OS
Documento de Product Requirements
Versão 0.1 · Março de 2026
Propósito do documento Definir o escopo, os objetivos, os requisitos e os critérios de sucesso do primeiro MVP do Andromeda OS, convertendo o material-base em um PRD mais executivo e orientado à entrega.


Produto	Andromeda OS
Release	MVP 01 / v0.1
Status	Draft operacional
Base de referência	Documento completo do MVP v0.1

1. Resumo executivo
O MVP 01 do Andromeda OS existe para validar a tese central do produto: um kernel novo, centrado em task model, skills, memória básica, agentes híbridos, auditoria e observabilidade, pode executar tarefas com mais confiabilidade e previsibilidade do que arranjos improvisados inspirados no modelo tradicional de agentes conversacionais.
Este MVP não busca amplitude máxima. Busca prova de arquitetura, evidência operacional e uma primeira experiência completa de ponta a ponta: criar tarefa, estruturar, escolher rota, executar, auditar, registrar memória e expor tudo em um painel mínimo.
2. Contexto e problema
Sistemas de agentes no estilo OpenClaw/PicoClaw tendem a apresentar fragilidades recorrentes que reduzem previsibilidade e valor operacional: memória fraca, pouco reaproveitamento estrutural, baixa aderência exata ao pedido, uso excessivo de LLM em tarefas determinísticas, auditoria insuficiente e baixa observabilidade.
O Andromeda OS nasce para substituir improvisação por uma arquitetura com contratos claros, execução rastreável e preferência explícita por mecanismos determinísticos quando eles forem mais adequados do que uma chamada generativa.
3. Visão do produto
Andromeda OS é um sistema operacional de agentes de IA orientado a execução confiável, memória útil, skills reutilizáveis, auditoria independente e roteamento inteligente de capacidade.
4. Objetivo do MVP
O MVP deve provar que o sistema consegue completar um ciclo operacional confiável com os seguintes resultados observáveis:
receber uma tarefa e estruturá-la corretamente
selecionar a melhor rota de execução
preferir skill ou script quando isso fizer mais sentido do que usar LLM
executar com rastreabilidade, registrar evidências e gerar eventos
submeter o resultado a uma auditoria independente
persistir memória básica útil para tarefas futuras
oferecer visibilidade operacional em um painel mínimo
5. Metas do release
Negócio / Produto	Técnico	Operacional
Validar a arquitetura central	Consolidar contratos e modelo de dados	Completar fluxo ponta a ponta de task → audit
Provar redução de custo e latência via skill-first	Reduzir improvisação no fluxo de execução	Garantir rastreabilidade com logs e eventos
Melhorar confiabilidade com auditoria cruzada	Estabelecer base de testes, regressão e evals	Viabilizar operação mínima sem depender de CLI
6. Escopo do MVP 01
O release contempla nove blocos funcionais. Eles formam o escopo fechado do MVP e servem como referência para priorização e corte de backlog:
Kernel mínimo funcional
Task Object
Skill Registry
Agentes híbridos
Memória mínima em camadas
RAG por agente v0
LLM Router v0
Auditoria independente
Painel operacional mínimo
7. Fora de escopo
marketplace avançado de agentes e skills
aprendizado autônomo sofisticado
memória reflexiva completa
RBAC complexo e governança multi-tenant avançada
automações distribuídas long-running e execução em cluster
benchmarking massivo entre dezenas de modelos
compatibilidade total com todo o ecossistema OpenClaw desde o dia 1
painel altamente polido com foco estético acima da operação
8. Princípios inegociáveis
Confiabilidade operacional antes de eloquência.
Skill antes de LLM sempre que possível.
O pedido do usuário manda, inclusive quando há override explícito de modelo.
Toda tarefa relevante deve deixar trilha auditável.
Executor e auditor devem ser entidades diferentes.
Memória é infraestrutura nativa, não plugin opcional.
Agente é abstração de capacidade, não sinônimo de chamada de LLM.
A UI deve servir operação real.
9. Hipóteses a validar
Hipótese	Sinal esperado
Task model estruturado melhora aderência e reduz retrabalho	Menos reprocessamento e mais conformidade com o pedido
Política skill-first reduz custo e latência	Maior taxa de tarefas resolvidas sem LLM
Agentes híbridos são mais eficientes do que agentes puramente conversacionais	Melhor equilíbrio entre qualidade, tempo e custo
Auditoria independente aumenta detecção de falhas	Mais inconsistências detectadas antes do fechamento da tarefa
LLM Router simples já produz ganho real	Roteamento melhor do que escolha fixa de modelo
Painel mínimo reduz dependência de CLI	Maior visibilidade e operação mais fluida
10. Requisitos funcionais
10.1 Tasks e kernel
Criar, listar, consultar e reexecutar tarefas.
Persistir Task Object, estados e eventos da tarefa.
Resolver estratégia de execução com política skill-first.
10.2 Skills e agentes
Cadastrar, listar e executar skills.
Executar agentes híbridos com suporte a LLM e script runtime.
Importar ao menos uma skill compatível com OpenClaw.
10.3 Memória, RAG e auditoria
Persistir memória de sessão, episódica e semântica básica.
Associar coleção RAG a agentes e consultar apenas a base autorizada.
Auditar o resultado com agente distinto do executor e registrar parecer estruturado.
10.4 Operação e observabilidade
Registrar logs, eventos e decisão de roteamento.
Expor painel mínimo com tarefas, skills, agentes, auditoria e RAG.
Tornar a execução auditável e inspecionável sem depender exclusivamente de CLI.
11. Arquitetura proposta
A arquitetura do MVP deve seguir uma separação em camadas e padrões que maximizem clareza, testabilidade e capacidade de evolução:
Camada	Responsabilidade	Padrões dominantes
Interface / Delivery	Painel web, API HTTP, autenticação básica e validação	Controller, DTO, Validation
Application / Orchestration	Casos de uso, coordenação, execução e auditoria	Use Case, Factory, Strategy
Domain / Core	Regras centrais, Task Object, policies e estados	State Machine, Policy, Specification
Infrastructure	Banco, fila, vector store, providers e adaptadores	Ports & Adapters, Repository, Adapter
12. Jornada operacional do MVP
Usuário cria uma tarefa.
Kernel interpreta a intenção, restrições e contexto.
Sistema resolve a melhor rota de execução.
Skill ou agente executor produz o resultado e persiste evidências.
Auditor independente revisa o resultado.
Estado da tarefa é atualizado e a memória relevante é registrada.
Painel exibe status, eventos, resultado e parecer de auditoria.
13. Critérios de aceite do MVP
Uma tarefa pode ser criada e acompanhada no painel.
O kernel estrutura a tarefa e resolve uma estratégia de execução.
O sistema prefere skill ou script quando apropriado.
Quando necessário, o LLM Router escolhe um modelo válido e registra a decisão.
O usuário pode fixar explicitamente o modelo e isso é respeitado.
O executor produz um resultado persistido e auditável.
Um auditor independente aprova ou reprova o resultado.
Logs e eventos podem ser inspecionados por tarefa.
Ao menos uma skill compatível com OpenClaw é importada e executada.
A suíte crítica de testes e a suíte mínima de evals passam sem regressões graves.
14. Métricas de sucesso
Categoria	Métrica	Objetivo do MVP
Funcional	Taxa de tarefas concluídas com aprovação do auditor	Mostrar viabilidade operacional do fluxo
Custo	Percentual de tarefas resolvidas por skill/script sem LLM	Evidenciar eficiência da abordagem skill-first
Custo	Tokens médios por tarefa	Reduzir gasto desnecessário em rotas determinísticas
Qualidade	Aderência ao pedido e às restrições	Demonstrar previsibilidade e conformidade
Qualidade	Precisão do auditor em detectar falhas nos evals	Medir efetividade da auditoria independente
Operação	Tempo até o primeiro resultado útil	Mostrar valor perceptível no uso real
15. Riscos e mitigação
Escopo inflado: Congelar os nove blocos do MVP e cortar extras.
Excesso de dependência de LLM cedo demais: Aplicar política skill-first obrigatória e script-agents para tarefas determinísticas.
Compatibilidade OpenClaw virar buraco negro: Começar com suporte parcial, incremental e orientado ao formato mínimo útil.
Painel consumir tempo demais: Manter UI funcional mínima, sem perseguir acabamento visual prematuro.
Memória ficar sofisticada cedo demais: Limitar o MVP a sessão, episódica e semântica básica.
Auditoria custosa demais: Permitir auditoria configurável por criticidade e heurísticas simples.
16. Roadmap resumido
Sprint 0 — Setup do repositório, banco, Redis, estrutura, CI e testes.
Sprint 1 — Task Object, Task Service, estados e eventos.
Sprint 2 — Skill Registry, execução skill-first e script skills.
Sprint 3 — Agent Runtime, executor LLM e LLM Router v0.
Sprint 4 — Auditoria independente.
Sprint 5 — Memória básica.
Sprint 6 — RAG por agente.
Sprint 7 — Compatibilidade OpenClaw mínima.
Sprint 8 — Painel operacional mínimo.
Sprint 9 — End-to-end, regressão, hardening e polimento técnico.
17. Definição de pronto
código implementado
testes unitários e integrados relevantes criados
logs e erros tratados minimamente
comportamento documentado
feature visível via UI ou API
nenhuma regressão crítica introduzida
18. Entrega esperada
Ao final do MVP, o time deve entregar uma base funcional para continuação do produto, incluindo:
monorepo funcional
backend modular com APIs principais
schema das entidades centrais
painel web operacional mínimo
Skill Registry funcional
execução skill-first
executor e auditor LLM
script-agent runtime
LLM Router v0
memória básica
RAG por agente
adaptador inicial OpenClaw
suíte de testes crítica e conjunto inicial de evals
19. Decisão de produto
O MVP não precisa provar perfeição. Precisa provar espinha dorsal. Se o sistema demonstrar task model sólido, skill-first execution, agentes híbridos, auditoria independente, memória básica útil, roteamento correto e painel mínimo operacional, o produto já valida sua tese central.

Fonte de base: Documento “Andromeda OS — Documento Completo do MVP v0.1”, reorganizado em formato de PRD.