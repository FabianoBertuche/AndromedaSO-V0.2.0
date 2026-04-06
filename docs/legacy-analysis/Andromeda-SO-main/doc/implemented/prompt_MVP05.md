Você irá executar o documento:

/doc/Andromeda_PRD_MVP05.md

Contexto importante:
O projeto Andromeda OS já possui MVPs anteriores implementados e funcionando. O MVP05 NÃO é uma reescrita do sistema. Ele deve introduzir a base da arquitetura híbrida TypeScript + Python de forma incremental, preservando tudo que já funciona.

Objetivo central do MVP05:
Adicionar a fundação da camada cognitiva em Python sem quebrar:

- backend atual em TypeScript
- gateway de comunicação
- fluxo de sessões
- criação e execução de tasks
- timeline
- event bus
- realtime/websocket
- router/model center existente
- auditoria
- console/painel operacional
- integrações já implementadas

Diretriz arquitetural obrigatória:

- TypeScript continua sendo o núcleo operacional do sistema
- Python entra como camada de serviços cognitivos especializados
- não migrar o backend inteiro para Python
- não mover a lógica central de domínio para Python
- não quebrar contratos públicos já existentes
- não remover funcionalidades já entregues

Você deve seguir estas regras de execução:

1. Ler completamente o PRD do MVP05 antes de modificar qualquer arquivo.
2. Inspecionar a estrutura atual do repositório e identificar os módulos já existentes.
3. Mapear o que já foi implementado dos MVPs anteriores para evitar regressões.
4. Implementar o MVP05 de forma incremental e segura.
5. Antes de grandes mudanças, identificar dependências críticas.
6. Sempre preferir extensão por adapters, ports e interfaces em vez de substituição destrutiva.
7. Não alterar desnecessariamente código estável já validado.
8. Sempre documentar no próprio código e/ou em markdown as decisões relevantes.
9. Ao final, executar uma bateria de testes de regressão e validação funcional.
10. Se encontrar inconsistências no documento ou no código, corrigir com a solução mais conservadora e coerente com a arquitetura vigente.

--------------------------------------------------

ESCOPO DE IMPLEMENTAÇÃO DO MVP05
--------------------------------------------------

Implemente a fundação da arquitetura híbrida com os seguintes objetivos mínimos:

A. No lado TypeScript:

- manter gateway atual funcional
- manter task lifecycle funcional
- manter event bus funcional
- manter realtime funcional
- manter router/model center funcional
- manter auditoria funcional
- introduzir ports/interfaces para serviços cognitivos externos
- introduzir adapters para comunicação TS -> Python
- introduzir configuração segura para apontar para o serviço cognitivo Python
- introduzir health checks e tratamento de indisponibilidade do serviço Python
- introduzir timeout, retry controlado e tratamento de erro padronizado
- manter compatibilidade com contratos públicos existentes

B. No lado Python:

- criar serviço base `cognitive-python`
- expor API interna com FastAPI
- criar estrutura inicial de contratos
- criar pelo menos endpoints mínimos de:
  - healthcheck
  - readiness
  - ping de integração
  - endpoint cognitivo mínimo de teste
- estruturar diretórios para futura expansão:
  - rag
  - memory
  - eval
  - benchmark
  - planner
  - documents
- usar tipagem e contratos estáveis com Pydantic
- devolver respostas canônicas e previsíveis

C. Integração:

- criar adapter TS -> Python
- criar contrato base de request/response
- incluir correlationId/requestId/taskId/sessionId quando aplicável
- garantir que o kernel TS continue sendo o dono da decisão e da persistência
- garantir que o Python não responda diretamente à UI nem assuma domínio operacional
- garantir fallback seguro quando o serviço Python estiver indisponível

--------------------------------------------------

REGRAS DE SEGURANÇA DE IMPLEMENTAÇÃO
--------------------------------------------------

Estas regras são obrigatórias:

1. Não remover funcionalidades existentes sem necessidade explícita.
2. Não alterar rotas públicas existentes de forma incompatível.
3. Não quebrar websocket, timeline, sessions ou tasks.
4. Não introduzir dependência forte do Python para fluxos que antes funcionavam apenas em TS.
5. O sistema deve continuar operando mesmo se o serviço Python estiver offline, ao menos para os fluxos já existentes.
6. O serviço Python deve ser opcional nesta fase. O MVP05 é fundacional, não substitutivo.
7. Toda nova integração deve ser observável e testável.
8. Todo erro de integração TS/Python deve ser capturado e transformado em erro controlado, sem derrubar o core.

--------------------------------------------------

PLANO DE EXECUÇÃO ESPERADO
--------------------------------------------------

Siga esta ordem:

Fase 1 — Inspeção e planejamento

- ler o PRD
- analisar estrutura do repositório
- localizar módulos principais
- localizar pontos de integração seguros
- identificar contratos existentes
- mapear riscos de regressão

Fase 2 — Implementação da fundação híbrida

- criar ports no core
- criar adapters TS -> Python
- criar config/env para o serviço cognitivo
- criar client HTTP interno com timeout e error handling
- criar serviço FastAPI base
- criar contracts Pydantic
- criar health endpoints
- criar endpoint mínimo de processamento cognitivo de teste

Fase 3 — Integração controlada

- conectar um fluxo mínimo e não crítico ao adapter Python
- garantir que o fluxo antigo continue intacto
- garantir fallback
- registrar logs e métricas mínimas

Fase 4 — Testes e validação

- executar testes automatizados
- executar testes manuais guiados
- validar ausência de regressão
- documentar resultados

Fase 5 — Fechamento

- atualizar documentação
- listar arquivos criados/alterados
- listar riscos remanescentes
- listar próximos passos recomendados para MVP06

--------------------------------------------------

TESTES OBRIGATÓRIOS DE REGRESSÃO
--------------------------------------------------

Você deve obrigatoriamente validar que o MVP05 não quebrou o que já existia.

Crie e execute testes para os seguintes pontos:

1. Gateway de comunicação
Validar:

- recebimento de mensagem continua funcionando
- autenticação existente continua funcionando
- normalização de mensagem continua funcionando
- resposta unificada continua funcionando

1. Sessões
Validar:

- criação/resolução de sessão continua funcionando
- correlação entre mensagem e sessão permanece correta
- sessionId continua sendo propagado corretamente

1. Criação de task
Validar:

- mensagens ainda geram tasks corretamente
- task status inicial permanece correto
- task continua sendo persistida como antes

1. Lifecycle da task
Validar:

- transições de estado continuam funcionando
- execução não trava com Python desligado
- falhas de integração externa não corrompem a state machine

1. Event bus
Validar:

- eventos principais continuam sendo emitidos
- listeners atuais continuam funcionando
- criação e atualização de timeline continuam intactas

1. Realtime / websocket
Validar:

- eventos continuam chegando ao frontend/console
- timeline ao vivo continua funcionando
- criação e atualização de task continuam refletidas em tempo real

1. Router / Model Center
Validar:

- roteamento atual continua funcional
- seleção de modelo atual continua funcional
- weighted scoring atual não foi quebrado
- ausência do Python não impede rotações já existentes

1. Skills / workflows / agents
Validar:

- skill-first policy permanece funcional
- skills existentes continuam executando
- workflows existentes continuam executando
- agentes existentes continuam registráveis e acionáveis

1. Auditoria
Validar:

- auditoria oficial continua sendo produzida
- logs e rastreabilidade continuam presentes
- integração Python não substituiu nem contornou a auditoria do kernel

1. Painel / console operacional
Validar:

- painel continua carregando
- timeline continua aparecendo
- tasks continuam aparecendo
- estados operacionais continuam visíveis

1. Compatibilidade sem serviço Python
Validar explicitamente:

- sistema sobe normalmente sem o serviço Python
- endpoints existentes continuam funcionais
- criação e execução de task continuam operacionais
- erros do adapter Python ficam isolados e controlados

1. Compatibilidade com serviço Python ativo
Validar:

- healthcheck funciona
- readiness funciona
- chamada mínima TS -> Python funciona
- contrato de request/response está correto
- timeout e tratamento de erro funcionam

--------------------------------------------------

TESTES NOVOS ESPECÍFICOS DO MVP05
--------------------------------------------------

Implemente testes para a nova fundação híbrida:

1. Teste de healthcheck do serviço Python
2. Teste de integração TS -> Python bem-sucedida
3. Teste de timeout do serviço Python
4. Teste de indisponibilidade do serviço Python
5. Teste de fallback controlado
6. Teste de contrato de request/response
7. Teste de propagação de correlationId/requestId/taskId
8. Teste de isolamento de erro sem derrubar o kernel
9. Teste de logs mínimos de integração
10. Teste de configuração por ambiente

--------------------------------------------------

TIPOS DE TESTE QUE DEVEM SER EXECUTADOS
--------------------------------------------------

Execute e/ou crie, conforme aplicável:

- testes unitários
- testes de integração
- testes de contrato
- testes de regressão
- smoke tests de inicialização
- testes manuais guiados para fluxos críticos

Se já existir framework de testes no projeto, reutilize-o.
Não introduza uma stack de testes caótica.
Siga o padrão já usado no repositório.

--------------------------------------------------

CENÁRIOS MÍNIMOS DE TESTE MANUAL
--------------------------------------------------

Execute manualmente e documente o resultado destes cenários:

Cenário 1:

- subir sistema TS sem Python
- enviar mensagem pelo gateway
- validar task criada
- validar execução
- validar timeline
- validar resposta final

Cenário 2:

- subir sistema TS com Python
- executar healthcheck
- chamar endpoint cognitivo mínimo
- validar retorno
- validar logs
- validar que a task não quebrou o fluxo normal

Cenário 3:

- desligar Python com o sistema em execução
- enviar nova requisição
- validar que o sistema principal continua estável
- validar fallback e erro controlado

Cenário 4:

- provocar timeout na chamada TS -> Python
- validar tratamento sem crash
- validar auditoria e rastreabilidade do erro

Cenário 5:

- executar fluxo antigo que não depende do Python
- garantir que continua exatamente funcional

--------------------------------------------------

CRITÉRIOS DE ACEITAÇÃO DO MVP05
--------------------------------------------------

Considere o MVP05 aceito apenas se todos estes critérios forem atendidos:

1. O backend TypeScript continua operacional.
2. O gateway continua funcional.
3. O lifecycle de tasks não foi quebrado.
4. O event bus continua íntegro.
5. O realtime continua íntegro.
6. O router/model center atual continua funcionando.
7. O sistema opera mesmo sem o serviço Python.
8. O serviço Python sobe corretamente quando habilitado.
9. A integração TS -> Python funciona por contrato estável.
10. Falhas no Python não derrubam o sistema principal.
11. Existe cobertura de testes para regressão e integração.
12. A documentação foi atualizada.
13. Os arquivos alterados foram claramente identificados.
14. Os riscos remanescentes foram listados.

--------------------------------------------------

FORMATO DA ENTREGA ESPERADA
--------------------------------------------------

Ao final da execução, entregue:

1. Resumo do que foi implementado
2. Lista de arquivos criados
3. Lista de arquivos alterados
4. Explicação objetiva das decisões arquiteturais tomadas
5. Lista dos testes executados
6. Resultado dos testes
7. Regressões encontradas e correções aplicadas
8. Limitações ainda existentes
9. Próximos passos recomendados para MVP06

--------------------------------------------------

ESTILO DE EXECUÇÃO
--------------------------------------------------

- Seja conservador com o que já funciona
- Seja explícito ao mexer em contratos
- Priorize compatibilidade retroativa
- Não faça refatorações cosméticas desnecessárias
- Não troque stack por preferência pessoal
- Respeite a arquitetura do Andromeda
- Trabalhe com disciplina de sistema operacional de agentes, não como simples app CRUD
- Sempre prefira extensão controlada a substituição radical

Comece agora pela leitura completa de `/doc/Andromeda_PRD_MVP05.md`, inspeção da estrutura atual do projeto e mapeamento de riscos de regressão antes de alterar qualquer arquivo.
