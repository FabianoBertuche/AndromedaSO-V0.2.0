Use o arquivo de referência abaixo como fonte canônica desta implementação:

`/doc/Andromeda_PRD_MVP03.md`

Execute o MVP03 do Andromeda OS com base nos documentos já definidos neste projeto, especialmente mvp01.md, DOCUMENTACAO_TECNICA_mvp02.md e nebula-unified-system.md.

Contexto:
- MVP01 backend concluído e validado
- MVP02 Communication Gateway concluído
- arquitetura baseada em Clean Architecture + Ports & Adapters
- gateway como borda pública
- kernel/task system como motor interno
- auth por bearer token simples já prevista
- alinhamento futuro com Nebula já definido

Objetivo do MVP03:
Implementar a primeira console operacional em tempo real do Andromeda OS.

Diretrizes obrigatórias:
- o frontend deve falar com o gateway, nunca diretamente com o domínio interno
- manter separação entre gateway e kernel
- implementar WebSocket no gateway
- criar normalização de eventos para o frontend
- criar timeline por sessão e por task
- criar read models próprios para a UI
- criar a web console oficial com visão operacional
- exibir sessão, mensagens, task, timeline, auditoria, logs e estado visual em tempo real
- preparar compatibilidade com os estados cognitivos do Nebula:
  idle, listening, thinking, tool_execution, speaking, success, error
- não implementar Nebula visual completo ainda
- não reescrever a base já validada

Escopo esperado:
1. endpoint WebSocket oficial no gateway
2. autenticação no handshake
3. registry de conexões por sessão
4. contrato de eventos em tempo real desacoplado do domínio cru
5. Session Timeline
6. Task Timeline
7. endpoints de leitura para timeline/status
8. read side operacional para frontend
9. web app operacional inicial
10. camada visual simples baseada em estados cognitivos

Telas mínimas da web:
- console principal
- lista de sessões
- detalhe da sessão
- detalhe da task
- painel de timeline

Endpoints esperados:
- POST /gateway/message
- GET /gateway/sessions/:id
- GET /gateway/sessions/:id/messages
- GET /gateway/sessions/:id/timeline
- GET /gateway/tasks/:taskId/status
- GET /gateway/tasks/:taskId/timeline
- GET /tasks/:id
- GET /tasks/:id/events
- GET /audits/:taskId
- WS /gateway/ws

Forma de trabalho:
- primeiro leia a arquitetura atual com base nos documentos
- depois proponha a arquitetura técnica final do MVP03
- depois defina o plano incremental de implementação
- depois liste os arquivos e módulos que serão criados/alterados
- depois comece a implementação real

Importante:
- não responder só com teoria
- não fazer apenas sugestões abstratas
- entregar estrutura concreta
- entregar contratos
- entregar código real
- preservar Clean Architecture
- preservar Ports & Adapters
- preservar compatibilidade com MVP01 e MVP02

Comece agora pelo diagnóstico da arquitetura atual e em seguida já proponha a estrutura técnica e os primeiros arquivos da implementação do MVP03.