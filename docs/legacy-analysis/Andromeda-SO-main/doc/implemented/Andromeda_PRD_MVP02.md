# Andromeda OS — MVP02
## Communication Gateway + Web Channel
## Spec canônica de implementação

Use este documento como instrução principal de implementação.

Também usar como base arquitetural os arquivos:
- mvp01.md
- nebula-unified-system.md

Esta spec existe para reduzir ambiguidade, evitar desvios de arquitetura e garantir fidelidade ao conceito do Andromeda OS.

---

# 1. CONTEXTO

Estou construindo o Andromeda OS, um sistema operacional de agentes de IA.

O MVP01 backend já existe e está funcional.

Estado atual:
- API REST com módulos de tasks
- skills com execução em sandbox
- agents
- política skill-first funcionando
- arquitetura baseada em Clean Architecture + Ports & Adapters

O MVP01 define claramente:
- Interface / Delivery
- Application / Orchestration
- Domain / Core
- Infrastructure

Também define como princípios:
- use cases explícitos
- ports/adapters
- observabilidade por eventos
- read model simples para painel
- evitar controller gordo
- evitar frontend consumindo entidades cruas do domínio
- começar pela espinha dorsal, não pelo frontend bonito

---

# 2. OBJETIVO REAL DO MVP02

O MVP02 NÃO é “fazer frontend bonito”.

O MVP02 é criar a camada de comunicação do Andromeda OS.

A interface web será apenas o primeiro canal.

O frontend NÃO deve se acoplar diretamente ao sistema de tasks.

O sistema deve ganhar uma nova camada de entrada pública:

## Communication Gateway

Essa camada:
- recebe mensagens de canais externos
- autentica o cliente do canal
- normaliza a mensagem
- resolve ou cria sessão
- converte mensagem em comando interno
- chama o task system atual
- devolve resposta unificada
- prepara o caminho para múltiplos canais futuros

---

# 3. DECISÃO ARQUITETURAL OBRIGATÓRIA

## Regra central

O frontend web NÃO pode chamar `/tasks` diretamente para operar como chat/interface conversacional.

`/tasks` continua existindo como API operacional/interna/read-side, mas a entrada pública conversacional deve ser:

## `POST /gateway/message`

O gateway será o ponto único de entrada para canais.

---

# 4. OBJETIVOS OBRIGATÓRIOS DESTE CICLO

Implementar:

1. módulo `communication`
2. endpoint `POST /gateway/message`
3. autenticação simples por token fixo por canal
4. canal inicial `web`
5. modelo unificado de mensagem
6. modelo simples de sessão
7. integração com task system atual por use case interno
8. resposta unificada
9. endpoints básicos de sessão/leitura
10. base estrutural para websocket futuro
11. compatibilidade futura com:
   - Telegram
   - Discord
   - CLI
   - Mobile / Nebula

---

# 5. O QUE NÃO FAZER AGORA

Não implementar agora:
- frontend visual bonito
- renderer Nebula
- partículas
- voz
- STT/TTS
- autenticação de usuário final completa
- JWT/OAuth
- múltiplos canais reais
- streaming token a token
- lógica multimodal
- memória conversacional avançada
- orchestration distribuída
- CQRS pesado
- fila obrigatória para esse fluxo, salvo se já existir e for simples

Este ciclo é espinha dorsal de comunicação, não experiência final.

---

# 6. PRINCÍPIOS DE IMPLEMENTAÇÃO

A implementação deve obedecer estritamente os princípios abaixo:

## 6.1. Núcleo preservado
O task system atual continua sendo o motor interno de execução.

## 6.2. Gateway é borda
O módulo `communication` é uma camada de borda/orquestração, não um segundo kernel.

## 6.3. Nada de duplicar lógica
O gateway não pode duplicar regras que já existem em tasks/execution/audit.

## 6.4. Auth na borda
Autenticação de cliente do canal deve ocorrer antes de criar sessão e antes de virar task.

## 6.5. Session simples
Sessão neste momento é operacional, não memória cognitiva avançada.

## 6.6. Contratos estáveis
`UnifiedMessage` e `UnifiedResponse` devem ser os contratos estáveis de comunicação.

## 6.7. Compatibilidade futura
A estrutura deve preparar mobile/Nebula, WebSocket e múltiplos canais sem exigir refatoração grande.

## 6.8. Sem overengineering
Implementar o suficiente para sustentar evolução, sem criar microarquitetura desnecessária.

---

# 7. DESENHO CONCEITUAL OBRIGATÓRIO

## Fluxo macro

Client Channel
-> Gateway Auth
-> Communication Controller
-> Message Normalizer
-> Session Resolver
-> Task Ingress Use Case
-> Task System atual
-> Execution Engine atual
-> Audit atual
-> Gateway Response Mapper
-> Client Channel

## Interpretação correta
- gateway traduz e orquestra entrada/saída
- kernel continua decidindo execução
- frontend vira só mais um canal
- tasks deixam de ser a interface pública de conversa

---

# 8. RESPONSABILIDADES DO COMMUNICATION GATEWAY

## Deve fazer
- receber mensagens de canal
- autenticar cliente do canal
- validar DTO de entrada
- normalizar payload
- resolver ou criar sessão
- persistir mensagem normalizada
- converter mensagem em comando interno
- chamar use case interno do task system
- montar resposta unificada
- expor leitura mínima de sessão
- emitir eventos de comunicação

## Não deve fazer
- executar skill diretamente
- escolher modelo
- decidir skill-first
- executar agente
- auditar
- decidir roteamento de execution strategy
- virar dono das regras de domínio centrais
- usar HTTP interno para chamar `/tasks`

---

# 9. ESTRUTURA DE PASTAS OBRIGATÓRIA

Criar o módulo `communication` respeitando a organização em camadas do MVP01.

```txt
apps/api/src/modules/
  communication/
    domain/
      entities/
        unified-message.entity.ts
        communication-session.entity.ts
      value-objects/
        channel.vo.ts
        sender.vo.ts
        message-content.vo.ts
      repositories/
        communication-session.repository.ts
        communication-message.repository.ts
      services/
        session-resolver.service.ts
        channel-auth.service.ts
      events/
        gateway-message-received.event.ts
        gateway-message-normalized.event.ts
        communication-session-opened.event.ts
        communication-session-resumed.event.ts
        gateway-task-dispatched.event.ts
        gateway-response-created.event.ts
        gateway-auth-failed.event.ts

    application/
      dto/
        gateway-message.request.dto.ts
        gateway-message.response.dto.ts
        get-session.response.dto.ts
        list-session-messages.response.dto.ts
      use-cases/
        authenticate-channel-client.use-case.ts
        receive-gateway-message.use-case.ts
        resolve-session.use-case.ts
        create-task-from-message.use-case.ts
        get-session.use-case.ts
        list-session-messages.use-case.ts
        get-gateway-task-status.use-case.ts
      mappers/
        unified-message.mapper.ts
        task-command.mapper.ts
        gateway-response.mapper.ts

    infrastructure/
      auth/
        static-token-channel-auth.adapter.ts
      persistence/
        prisma-communication-session.repository.ts
        prisma-communication-message.repository.ts
      channels/
        web/
          web-channel.adapter.ts
      telemetry/
        communication-logger.ts

    interfaces/
      http/
        communication.controller.ts
        communication.routes.ts
        middlewares/
          gateway-auth.middleware.ts
      websocket/
        communication.ws-gateway.ts
10. CONTRATOS CENTRAIS
10.1. UnifiedMessage

Este é o contrato interno obrigatório para toda mensagem recebida de qualquer canal.

export type ChannelType =
  | "web"
  | "telegram"
  | "discord"
  | "cli"
  | "mobile"
  | "system";

export type MessageRole =
  | "user"
  | "assistant"
  | "system";

export type MessageContentType =
  | "text"
  | "json"
  | "event"
  | "command";

export interface UnifiedMessage {
  id: string;
  channel: ChannelType;
  role: MessageRole;

  sender: {
    externalUserId?: string;
    internalUserId?: string;
    displayName?: string;
    isAuthenticated: boolean;
  };

  session: {
    id: string;
    externalSessionId?: string;
    channelSessionId?: string;
    isNew?: boolean;
  };

  content: {
    type: MessageContentType;
    text?: string;
    payload?: Record<string, unknown>;
  };

  metadata: {
    requestId?: string;
    correlationId?: string;
    messageIdempotencyKey?: string;
    timestamp: string;
    locale?: string;
    timezone?: string;
    client?: {
      platform?: string;
      version?: string;
      ip?: string;
      userAgent?: string;
    };
    auth?: {
      clientId: string;
      scopes: string[];
    };
    capabilities?: {
      supportsStreaming?: boolean;
      supportsVoice?: boolean;
      supportsVisualState?: boolean;
    };
    attachments?: Array<{
      id: string;
      type: string;
      url?: string;
      mimeType?: string;
      name?: string;
      sizeBytes?: number;
    }>;
    context?: Record<string, unknown>;
  };
}
Regras obrigatórias do UnifiedMessage

todo payload externo deve virar UnifiedMessage

channel é obrigatório

content.type é obrigatório

toda mensagem deve ganhar id

toda mensagem deve ganhar timestamp

requestId deve ser preservado se vier do cliente

correlationId deve ser preservado se vier do cliente; se não vier, gerar

metadata.auth deve ser preenchido depois da autenticação

session.id deve sempre existir ao final da resolução de sessão

10.2. CommunicationSession
export type SessionChannel =
  | "web"
  | "telegram"
  | "discord"
  | "cli"
  | "mobile";

export type SessionStatus =
  | "active"
  | "idle"
  | "closed";

export interface CommunicationSession {
  id: string;
  channel: SessionChannel;

  externalSessionId?: string;
  internalUserId?: string;
  externalUserId?: string;

  status: SessionStatus;

  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;

  context: {
    currentTaskId?: string;
    currentAgentId?: string;
    lastMessageId?: string;
    conversationTitle?: string;
  };

  metadata?: {
    locale?: string;
    timezone?: string;
    client?: Record<string, unknown>;
  };
}
Regras obrigatórias de sessão

sessão é operacional

sessão não é memória inteligente ainda

se o request trouxer session.id, tentar reutilizar

se não trouxer, criar nova

lastMessageAt deve ser atualizado

deve existir ligação entre sessão e tasks criadas

10.3. UnifiedResponse
export type ResponseStatus =
  | "accepted"
  | "processing"
  | "completed"
  | "failed";

export type VisualState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "tool_execution"
  | "success"
  | "error";

export interface UnifiedResponse {
  messageId: string;
  sessionId: string;
  channel: ChannelType;
  status: ResponseStatus;

  response: {
    role: "assistant" | "system";
    text?: string;
    payload?: Record<string, unknown>;
  };

  task?: {
    id: string;
    status: string;
  };

  visual?: {
    state: VisualState;
    intensity?: number;
    semanticHint?: string;
  };

  events?: Array<{
    type: string;
    timestamp: string;
    data?: Record<string, unknown>;
  }>;

  meta?: {
    requestId?: string;
    correlationId?: string;
    durationMs?: number;
  };
}
Regra obrigatória

A UI conversacional deve consumir UnifiedResponse, não entidade crua de task.

11. MODELO DE AUTH OBRIGATÓRIO
Objetivo

Permitir que apenas interfaces/clientes autorizados consigam falar com o gateway.

Fase inicial

Usar token fixo por canal.

Header padrão
Authorization: Bearer <token>
Variáveis de ambiente mínimas
GATEWAY_AUTH_ENABLED=true
GATEWAY_WEB_TOKEN=andromeda_dev_web_token
GATEWAY_CLI_TOKEN=andromeda_dev_cli_token
GATEWAY_MOBILE_TOKEN=andromeda_dev_mobile_token
Regra de negócio

channel=web só aceita token web

channel=cli só aceita token cli

channel=mobile só aceita token mobile

ausência de token => 401

token inválido => 401

Importante

Separar:

autenticação do cliente do canal

identidade do usuário humano

Neste MVP:

cliente do canal é autenticado por token

usuário humano pode continuar simples

12. PORTS OBRIGATÓRIOS
export interface CommunicationSessionRepository {
  findById(id: string): Promise<CommunicationSession | null>;
  findByExternalSession(
    channel: string,
    externalSessionId: string
  ): Promise<CommunicationSession | null>;
  save(session: CommunicationSession): Promise<void>;
}

export interface CommunicationMessageRepository {
  save(message: UnifiedMessage): Promise<void>;
  findBySessionId(sessionId: string): Promise<UnifiedMessage[]>;
  existsByIdempotencyKey(key: string): Promise<boolean>;
}

export interface ChannelAdapterPort {
  channel: string;
  normalize(input: unknown): Promise<UnifiedMessage>;
  buildResponse(output: UnifiedResponse): Promise<unknown>;
}

export interface ChannelAuthPort {
  authenticate(input: {
    channel: string;
    token?: string;
  }): Promise<{
    authenticated: boolean;
    clientId?: string;
    scopes?: string[];
  }>;
}

export interface TaskIngressPort {
  createFromMessage(input: {
    sessionId: string;
    message: UnifiedMessage;
  }): Promise<{
    taskId: string;
    status: string;
    outputText?: string;
  }>;
}
Regra obrigatória

O gateway conversa com o task system por TaskIngressPort, nunca por chamada HTTP interna para /tasks.

13. USE CASES OBRIGATÓRIOS

Implementar ao menos:

AuthenticateChannelClientUseCase

ResolveSessionUseCase

ReceiveGatewayMessageUseCase

CreateTaskFromMessageUseCase

GetSessionUseCase

ListSessionMessagesUseCase

GetGatewayTaskStatusUseCase

Regras

controller não pode conter regra central

controller apenas valida, chama use case e serializa resposta

toda orquestração deve ficar em use cases

14. INTEGRAÇÃO COM O TASK SYSTEM ATUAL
Regra obrigatória

O gateway não pode duplicar a lógica do task system.

Ele deve chamar um caso de uso interno que:

recebe mensagem

a mapeia para input de task

aciona o fluxo atual do kernel

Assinatura sugerida
export interface CreateTaskFromMessageInput {
  sessionId: string;
  channel: string;
  userId?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskFromMessageOutput {
  taskId: string;
  taskStatus: string;
  responseText?: string;
}
Mapeamento obrigatório Message -> Task
UnifiedMessage.content.text
  -> Task.input

UnifiedMessage.sender.internalUserId
  -> Task.userId

UnifiedMessage.session.id
  -> Task.sessionId

UnifiedMessage.channel
  -> Task.sourceChannel

UnifiedMessage.metadata.requestId
  -> Task.requestId

UnifiedMessage.metadata.correlationId
  -> Task.correlationId

UnifiedMessage.id
  -> Task.originMessageId

UnifiedMessage.metadata.context
  -> Task.inputContext
Campos novos obrigatórios em Task se ainda não existirem
sourceChannel: "web" | "telegram" | "discord" | "cli" | "mobile";
sessionId?: string;
correlationId?: string;
originMessageId?: string;
requestId?: string;
15. ENDPOINTS OBRIGATÓRIOS DO MVP02
15.1. POST /gateway/message

Entrada pública principal para canais.

15.2. GET /gateway/sessions/:id

Retorna sessão operacional.

15.3. GET /gateway/sessions/:id/messages

Retorna mensagens normalizadas da sessão.

15.4. GET /gateway/tasks/:taskId/status

Retorna status simplificado da task associada ao fluxo do gateway.

16. DTO DE ENTRADA OBRIGATÓRIO
export interface GatewayMessageRequestDto {
  channel: "web" | "telegram" | "discord" | "cli" | "mobile";
  sender: {
    externalUserId?: string;
    internalUserId?: string;
    displayName?: string;
    isAuthenticated?: boolean;
  };
  session?: {
    id?: string;
    externalSessionId?: string;
    channelSessionId?: string;
  };
  content: {
    type: "text" | "json" | "event" | "command";
    text?: string;
    payload?: Record<string, unknown>;
  };
  metadata?: {
    requestId?: string;
    correlationId?: string;
    messageIdempotencyKey?: string;
    locale?: string;
    timezone?: string;
    client?: {
      platform?: string;
      version?: string;
    };
    context?: Record<string, unknown>;
  };
}
Validações obrigatórias

channel obrigatório

content obrigatório

content.type obrigatório

se content.type = text, content.text não pode ser vazio

se content.type = json/event/command, payload deve existir

rejeitar request inválido com 400

17. DTO DE SAÍDA OBRIGATÓRIO
export interface GatewayMessageResponseDto {
  messageId: string;
  sessionId: string;
  channel: string;
  status: "accepted" | "processing" | "completed" | "failed";
  response: {
    role: "assistant" | "system";
    text?: string;
    payload?: Record<string, unknown>;
  };
  task?: {
    id: string;
    status: string;
  };
  visual?: {
    state:
      | "idle"
      | "listening"
      | "thinking"
      | "speaking"
      | "tool_execution"
      | "success"
      | "error";
    intensity?: number;
    semanticHint?: string;
  };
  meta?: {
    requestId?: string;
    correlationId?: string;
    durationMs?: number;
  };
}
18. EXEMPLOS CANÔNICOS
18.1. Request de sucesso
POST /gateway/message
Authorization: Bearer andromeda_dev_web_token
Content-Type: application/json
{
  "channel": "web",
  "sender": {
    "externalUserId": "user_123",
    "displayName": "Fabiano",
    "isAuthenticated": true
  },
  "session": {
    "id": "sess_web_001"
  },
  "content": {
    "type": "text",
    "text": "Liste as skills disponíveis para automação."
  },
  "metadata": {
    "requestId": "req_001",
    "correlationId": "corr_001",
    "locale": "pt-BR",
    "timezone": "America/Sao_Paulo",
    "client": {
      "platform": "web",
      "version": "0.2.0"
    }
  }
}
18.2. Response de sucesso
{
  "messageId": "msg_001",
  "sessionId": "sess_web_001",
  "channel": "web",
  "status": "completed",
  "response": {
    "role": "assistant",
    "text": "Encontrei 12 skills disponíveis."
  },
  "task": {
    "id": "task_789",
    "status": "completed"
  },
  "visual": {
    "state": "success",
    "intensity": 0.5,
    "semanticHint": "completed"
  },
  "meta": {
    "requestId": "req_001",
    "correlationId": "corr_001",
    "durationMs": 412
  }
}
18.3. Response de erro de autenticação
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing gateway token"
  },
  "meta": {
    "requestId": "req_001"
  }
}
18.4. Response de erro de validação
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid gateway message payload"
  },
  "details": [
    "content.text is required when content.type is text"
  ]
}
19. MIDDLEWARE DE AUTH OBRIGATÓRIO

Criar middleware HTTP de autenticação para o gateway.

Comportamento obrigatório

ler Authorization

extrair Bearer token

ler channel do body

autenticar usando ChannelAuthPort

se falhar, responder 401

se passar, injetar contexto autenticado no request

Estrutura sugerida
export async function gatewayAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  const channel = req.body?.channel;

  const result = await channelAuthPort.authenticate({
    channel,
    token
  });

  if (!result.authenticated) {
    return res.status(401).send({
      error: {
        code: "UNAUTHORIZED",
        message: "Invalid or missing gateway token"
      }
    });
  }

  req.auth = {
    authenticated: true,
    clientId: result.clientId,
    scopes: result.scopes ?? []
  };

  next();
}
Segurança mínima obrigatória

não logar token completo

logar apenas falha com requestId/channel/origem

comparação segura de token

erro genérico sem detalhes sensíveis

20. WEB CHANNEL ADAPTER OBRIGATÓRIO

Implementar WebChannelAdapter como primeiro adapter concreto.

Responsabilidades

transformar GatewayMessageRequestDto em UnifiedMessage

preencher defaults

normalizar sender, session, metadata

construir resposta para canal web se necessário

Regra

Nenhum controller deve montar UnifiedMessage manualmente.

21. SESSION RESOLVER OBRIGATÓRIO

Implementar serviço/use case para resolver sessão.

Regras obrigatórias

se session.id vier e existir, reutilizar

se externalSessionId vier e existir, reutilizar

se nada existir, criar nova

atualizar lastMessageAt

atualizar lastMessageId

marcar isNew corretamente no UnifiedMessage.session

Não fazer

memória cognitiva

sumarização de conversa

retrieval contextual complexo

22. RECEIVE GATEWAY MESSAGE USE CASE OBRIGATÓRIO

Esse é o caso de uso principal.

Ordem obrigatória do fluxo

receber DTO

receber contexto auth

normalizar payload em UnifiedMessage

anexar metadata.auth

resolver ou criar sessão

persistir mensagem

chamar TaskIngressPort.createFromMessage

montar UnifiedResponse

retornar DTO final

Pseudocódigo canônico
export class ReceiveGatewayMessageUseCase {
  async execute(
    input: GatewayMessageRequestDto,
    auth: { clientId: string; scopes: string[] }
  ): Promise<GatewayMessageResponseDto> {
    const normalized = await this.channelAdapter.normalize(input);

    normalized.metadata.auth = {
      clientId: auth.clientId,
      scopes: auth.scopes
    };

    const session = await this.sessionResolver.resolve(normalized);

    await this.messageRepository.save(normalized);

    const taskResult = await this.taskIngressPort.createFromMessage({
      sessionId: session.id,
      message: normalized
    });

    return this.gatewayResponseMapper.fromTaskResult({
      message: normalized,
      session,
      taskResult
    });
  }
}
23. MAPEAMENTO DE VISUAL STATE

Mesmo sem renderer Nebula agora, a resposta do gateway já deve mapear estado visual básico, porque o Nebula define estados cognitivos claros e um event model simples para a interface futura.

Estados obrigatórios

idle

listening

thinking

speaking

tool_execution

success

error

Mapeamento inicial obrigatório

mensagem recebida -> listening

task criada/processando -> thinking

skill/agent em execução -> tool_execution

resposta pronta -> speaking

concluído com sucesso -> success

falha -> error

Regra

Esse estado visual pertence ao response mapper do gateway, não ao domínio central.

24. EVENTOS OBRIGATÓRIOS
Eventos do módulo communication

GatewayMessageReceived

GatewayMessageNormalized

CommunicationSessionOpened

CommunicationSessionResumed

GatewayTaskDispatched

GatewayResponseCreated

GatewayAuthFailed

Reaproveitar observabilidade do core sempre que possível

A execução de tasks já deve continuar emitindo seus próprios eventos no kernel.

Objetivo

Permitir rastreabilidade entre:

mensagem de entrada

sessão

task criada

resultado final

25. READ SIDE MÍNIMO

Seguir a filosofia de read/write side leve do MVP01.

Conversa / canal

Consumido pela interface:

POST /gateway/message

GET /gateway/sessions/:id

GET /gateway/sessions/:id/messages

Operação / painel

Pode continuar usando:

/tasks

/tasks/:id

/tasks/:id/events

Regra

A interface conversacional não deve depender do modelo cru de task.

26. WEBSOCKET: APENAS PREPARAÇÃO ESTRUTURAL

O Nebula prevê backend bridge com HTTP API, WebSocket, Event Normalizer e Session Manager. Portanto, preparar o esqueleto, mas sem implementar complexidade total agora.

Fazer agora

criar arquivo communication.ws-gateway.ts

definir contrato futuro de eventos

deixar preparado para auth por token

Não fazer agora

streaming token a token

multiplexação complexa

voice pipeline

sincronização multimodal

Eventos futuros previstos

session.opened

message.accepted

task.updated

task.completed

audit.completed

visual.state

27. REPOSITÓRIOS E PERSISTÊNCIA

Persistir ao menos:

sessão

mensagem normalizada

Requisitos mínimos

recuperar sessão por id

recuperar sessão por externalSessionId

listar mensagens por sessão

verificar idempotency key se disponível

Observação

Se a infraestrutura atual já usa Prisma/PostgreSQL, seguir o mesmo padrão.

28. REGRAS DE IDPOTÊNCIA E CORRELAÇÃO
Idempotência

Se metadata.messageIdempotencyKey vier:

verificar se já foi processada

evitar duplicação acidental

Correlação

Sempre garantir:

requestId

correlationId

messageId

sessionId

taskId

Isso é obrigatório para rastreabilidade e debug.

29. ANTI-PATTERNS PROIBIDOS

Não fazer:

controller com regra de negócio

gateway chamando /tasks via HTTP interno

duplicar lógica de execução no módulo communication

frontend usando /tasks como API de conversa

sessão virando memória cognitiva cedo demais

auth dentro do kernel

UI consumindo entidade crua de domínio

if/else gigante por canal espalhado em controller

logs misturados com regra central

inventar frontend avançado antes do fluxo estar sólido

30. ORDEM OBRIGATÓRIA DE IMPLEMENTAÇÃO
Etapa 1 — Contratos e espinha dorsal

criar estrutura de pastas do módulo

criar UnifiedMessage

criar CommunicationSession

criar DTOs

criar ports

Etapa 2 — Auth

criar ChannelAuthPort

implementar StaticTokenChannelAuthAdapter

criar gateway-auth.middleware.ts

Etapa 3 — Canal web

criar WebChannelAdapter

criar SessionResolver

persistir sessões e mensagens

Etapa 4 — Fluxo principal

criar ReceiveGatewayMessageUseCase

criar CreateTaskFromMessageUseCase

integrar com task system atual

expor POST /gateway/message

Etapa 5 — Leitura mínima

criar GET /gateway/sessions/:id

criar GET /gateway/sessions/:id/messages

criar GET /gateway/tasks/:taskId/status

Etapa 6 — Preparação futura

criar contratos de eventos

criar esqueleto de websocket

expor visual.state

31. CRITÉRIOS DE ACEITE OBRIGATÓRIOS
Story A — Gateway autenticado

request com token válido entra

request sem token retorna 401

request com token inválido retorna 401

Story B — Mensagem normalizada

request web vira UnifiedMessage

ids e timestamps são gerados corretamente

correlationId é preservado/gerado

Story C — Sessão resolvida

sessão existente é reutilizada

nova sessão é criada quando necessário

lastMessageAt é atualizado

Story D — Integração com kernel

gateway chama use case interno

task é criada

task recebe sourceChannel, sessionId, originMessageId

Story E — Resposta unificada

resposta contém messageId

contém sessionId

contém task.id

contém status

contém response.text

contém visual.state

Story F — Leitura mínima

sessão pode ser consultada

mensagens da sessão podem ser listadas

status simplificado da task pode ser consultado

Story G — Observabilidade

fluxo é rastreável do request até a task

auth failure é logada sem vazar segredo

correlationId aparece no fluxo

32. DEFINIÇÃO DE PRONTO

Considerar MVP02 base concluído quando:

web consegue enviar mensagem autenticada ao gateway

gateway normaliza e resolve sessão

gateway cria task no sistema atual sem HTTP interno

task roda no kernel atual

resposta volta em formato unificado

sessão e mensagens ficam consultáveis

contratos estão estáveis

base está pronta para web UI simples e canais futuros

33. RESULTADO ESPERADO

Ao final desta implementação, o Andromeda OS deve deixar de ser apenas um backend de tasks exposto por REST e passar a ter uma verdadeira camada de comunicação de sistema operacional de agentes.

O resultado esperado é:

gateway como entrada pública dos canais

web como primeiro channel

task system preservado como kernel interno

autenticação simples na borda

sessão operacional leve

resposta unificada

compatibilidade estrutural com Nebula

base correta para Telegram, Discord, CLI e Mobile depois

34. INSTRUÇÃO FINAL DE IMPLEMENTAÇÃO

Implementar estritamente esta arquitetura.

Prioridade absoluta:
fazer o fluxo completo funcionar:

web
-> gateway
-> task system
-> execution
-> auditoria
-> resposta

Sem inventar camada desnecessária.
Sem pular para frontend bonito.
Sem acoplar web diretamente em /tasks.

Se houver dúvida entre duas opções:
preferir a que:

mantém o kernel limpo

concentra integração na borda

preserva ports/adapters

reduz acoplamento

prepara múltiplos canais


---

