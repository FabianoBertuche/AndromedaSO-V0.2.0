



Estou construindo o Andromeda OS, um sistema operacional de agentes de IA.

📄 Documento principal:
[mvp01.md]
(usar como base arquitetural)

📄 Documento de interface futura:
[nebula-unified-system.md]

---

## 📌 ESTADO ATUAL

- MVP01 backend implementado e funcional
- API REST com:
  - tasks
  - skills (script sandbox)
  - agents
- execução com política skill-first funcionando
- arquitetura baseada em Clean Architecture + Ports & Adapters

---

## 🎯 OBJETIVO ATUAL (MVP02)

Quero iniciar a construção da **interface web (frontend)**

MAS com uma decisão estratégica importante:

👉 o frontend NÃO será acoplado diretamente ao sistema de tasks

👉 quero criar desde agora uma camada de comunicação unificada inspirada no Nebula

---

## 🧠 DECISÃO DE ARQUITETURA

Vou implementar primeiro:

### 1. Communication Gateway (backend)

- ponto único de entrada (estilo API Gateway)
- recebe mensagens de qualquer canal (web agora, outros depois)
- normaliza mensagens
- converte em Task
- chama o kernel atual

### 2. Canal inicial: WEB

- frontend será apenas um "channel"
- comunicação via gateway (não direto /tasks)

---

## 📦 OBJETIVO TÉCNICO

Quero projetar:

### A. Modelo unificado de mensagem

algo como:

- channel
- sender
- session
- content
- metadata

---

### B. Gateway endpoint

POST /gateway/message

---

### C. Fluxo

Web UI
→ Gateway
→ Task System
→ Execution Engine
→ Auditoria
→ Resposta

---

### D. Estrutura backend

novo módulo:

modules/communication

com:

- gateway
- message model
- router
- session

---

## 🔮 FUTURO (IMPORTANTE)

Isso deve ser compatível com:

- Telegram
- Discord
- CLI
- Mobile (Nebula)

Sem refatoração grande depois

---

## 🎯 O QUE EU QUERO AGORA

1. Arquitetura completa do Communication Gateway (Andromeda)
2. Estrutura de pastas
3. Modelos (Message, Session)
4. Endpoints
5. Integração com Task System atual
6. Fluxo completo de execução

---

## ⚠️ IMPORTANTE

- não quero overengineering
- não quero UI bonita ainda
- foco total em:
  - desacoplamento
  - extensibilidade
  - compatibilidade com Nebula

---

Vamos projetar isso como base do MVP02.

Vou consolidar isso em uma proposta arquitetural pragmática para o MVP02, alinhando o núcleo task-first do MVP01 com a camada unificada inspirada no Nebula.

Já tenho a base: o desenho certo aqui é tratar a Web UI como apenas mais um canal, e não como cliente do Task System. Agora vou fechar o contrato de mensagem, os módulos e o fluxo end-to-end.

Pensou por 27s
Perfeito. A decisão certa para o MVP02 é não ligar o frontend diretamente em /tasks.

Isso preserva a espinha dorsal do Andromeda como kernel orientado a execução, e coloca a interface web já no papel correto: um canal de entrada. Isso também fica alinhado com a direção do Nebula, onde existe um backend-bridge responsável por normalizar eventos, gerenciar sessões e servir de ponte entre interface e runtime 

, enquanto o MVP01 já pede uma arquitetura em camadas, com controller fino, use cases explícitos, ports/adapters, eventos e read/write side leve 

.

Abaixo está o desenho que eu recomendo para virar a base do MVP02.

1. Princípio arquitetural do MVP02
Decisão central
O Andromeda passa a ter duas entradas diferentes:

Task API interna

continua existindo

continua sendo o contrato operacional do kernel

Communication Gateway externo

vira a porta padrão para canais

recebe mensagens

normaliza

resolve sessão

transforma em task ou comando interno

chama o sistema atual

Em outras palavras:

tasks deixam de ser a interface pública primária
e passam a ser o mecanismo interno de execução

Isso é consistente com o MVP01, que já separa Interface/Delivery, Application/Orchestration, Domain/Core e Infrastructure, evitando regra de negócio no controller e acoplamento acidental 

.

2. Visão macro
Fluxo-alvo
Web UI
→ Communication Gateway
→ Message Normalizer
→ Session Resolver
→ Task Mapper
→ Kernel / Task System atual
→ Execution Engine
→ Audit / Events / Memory
→ Gateway Response Mapper
→ Web UI

Interpretação
O gateway não substitui o kernel.
Ele funciona como uma camada de tradução e orquestração de entrada/saída.

Isso bate diretamente com a ideia do Nebula Bridge, que no documento futuro já é descrito como um backend leve com responsabilidades de proxy, normalização de eventos, gestão de sessões e suporte a HTTP/WebSocket 

.

3. Responsabilidades do Communication Gateway
O módulo communication deve ter responsabilidades bem limitadas:

Faz
receber mensagens de canais

validar contrato de entrada

normalizar payloads

resolver identidade do remetente

resolver ou criar sessão

transformar mensagem em comando interno

disparar caso de uso que cria/executa task

acompanhar resultado

devolver resposta unificada

publicar eventos de canal/sessão/mensagem

Não faz
decidir estratégia de execução

escolher skill/modelo/agente

executar skill

fazer auditoria

persistir regra de negócio de task

conter lógica pesada de domínio

Ou seja: ele é bridge + adapter + orchestration edge, não um segundo kernel.

4. Modelo unificado de mensagem
Seu modelo base está correto. Eu fecharia assim:

type ChannelType =
  | "web"
  | "telegram"
  | "discord"
  | "cli"
  | "mobile"
  | "system";

type MessageRole =
  | "user"
  | "assistant"
  | "system";

type MessageContentType =
  | "text"
  | "json"
  | "event"
  | "command";

interface UnifiedMessage {
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
    messageIdempotencyKey?: string;
    requestId?: string;
    correlationId?: string;
    timestamp: string;
    locale?: string;
    timezone?: string;
    client?: {
      platform?: string;
      version?: string;
      ip?: string;
      userAgent?: string;
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
Por que esse formato funciona
Ele é bom para o MVP porque:

já suporta Web agora

suporta Telegram/Discord/CLI/Mobile depois

separa claramente quem enviou, qual sessão, o conteúdo e metadados de canal

permite que o gateway continue estável mesmo se a UI mudar muito depois

O que evitar agora
Não coloque no UnifiedMessage:

estado de task

resultado de auditoria

routing decision

memória recuperada

detalhes internos de skill execution

Essas coisas pertencem ao kernel e aos eventos internos, não ao contrato de borda.

5. Modelo de Session
Eu faria Session como entidade própria, leve, mas real.

type SessionChannel = "web" | "telegram" | "discord" | "cli" | "mobile";

type SessionStatus = "active" | "idle" | "closed";

interface CommunicationSession {
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
Papel da session no MVP02
No MVP02, a sessão não precisa ser “memória inteligente”.
Ela só precisa resolver:

continuidade conversacional

associação entre mensagens do mesmo canal

correlação com tasks criadas

base para streaming/eventos

Depois você expande isso para memória de sessão real no kernel.

6. Modelo de resposta unificada
Você precisa de um contrato de saída tão importante quanto o de entrada.

type ResponseStatus = "accepted" | "processing" | "completed" | "failed";

interface UnifiedResponse {
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
Benefício
Isso desacopla a Web UI do modelo cru de Task.
A UI pode consumir um contrato de canal, e uma tela operacional pode continuar consumindo /tasks.

Esse ponto é importante porque o MVP01 já alerta para evitar a UI consumindo entidades cruas de domínio e recomenda um read model simples para painel 

.

7. Estrutura de pastas recomendada
Seguindo o espírito do MVP01, eu adicionaria modules/communication sem quebrar sua organização atual:

src/
  modules/
    communication/
      domain/
        entities/
          communication-session.entity.ts
          unified-message.entity.ts
        value-objects/
          channel.vo.ts
          sender.vo.ts
        events/
          message-received.event.ts
          message-normalized.event.ts
          session-opened.event.ts
          gateway-response-created.event.ts
        repositories/
          communication-session.repository.ts
          communication-message.repository.ts
        services/
          message-normalizer.service.ts
          session-resolver.service.ts
          channel-capability.service.ts

      application/
        dto/
          gateway-message.request.dto.ts
          gateway-message.response.dto.ts
        use-cases/
          receive-gateway-message.use-case.ts
          resolve-session.use-case.ts
          map-message-to-task.use-case.ts
          build-gateway-response.use-case.ts
        mappers/
          unified-message.mapper.ts
          task-command.mapper.ts
          gateway-response.mapper.ts

      infrastructure/
        persistence/
          prisma-communication-session.repository.ts
          prisma-communication-message.repository.ts
        channels/
          web/
            web-channel.adapter.ts
          telegram/
            telegram-channel.adapter.ts
          discord/
            discord-channel.adapter.ts
          cli/
            cli-channel.adapter.ts
          mobile/
            mobile-channel.adapter.ts
        telemetry/
          communication-logger.ts

      interfaces/
        http/
          communication.controller.ts
          communication.routes.ts
        websocket/
          communication.ws-gateway.ts

    tasks/
    skills/
    agents/
    audit/
    memory/
    rag/
Regra importante
communication depende de casos de uso do kernel.
O kernel não depende de communication.

Essa direção de dependência precisa ficar sagrada.

8. Ports que eu adicionaria
Além dos ports já sugeridos no MVP01, eu criaria alguns específicos de comunicação:

interface CommunicationSessionRepository {
  findById(id: string): Promise<CommunicationSession | null>;
  findByExternalSession(
    channel: string,
    externalSessionId: string
  ): Promise<CommunicationSession | null>;
  save(session: CommunicationSession): Promise<void>;
}

interface CommunicationMessageRepository {
  save(message: UnifiedMessage): Promise<void>;
  existsByIdempotencyKey(key: string): Promise<boolean>;
}

interface ChannelAdapterPort {
  channel: string;
  normalize(input: unknown): Promise<UnifiedMessage>;
  buildResponse(output: UnifiedResponse): Promise<unknown>;
}

interface TaskIngressPort {
  createFromMessage(input: {
    sessionId: string;
    message: UnifiedMessage;
  }): Promise<{
    taskId: string;
    status: string;
    outputText?: string;
  }>;
}
Observação
Esse TaskIngressPort é importante porque evita o gateway chamar diretamente controller ou rota /tasks.
Ele chama um caso de uso interno do sistema atual.

9. Endpoint principal
MVP mínimo
POST /gateway/message
Request:

{
  "channel": "web",
  "sender": {
    "externalUserId": "user_123",
    "displayName": "Douglas",
    "isAuthenticated": true
  },
  "session": {
    "id": "sess_abc"
  },
  "content": {
    "type": "text",
    "text": "Crie um resumo deste documento"
  },
  "metadata": {
    "timestamp": "2026-03-17T20:00:00Z",
    "requestId": "req_001",
    "client": {
      "platform": "web",
      "version": "0.2.0"
    }
  }
}
Response:

{
  "messageId": "msg_001",
  "sessionId": "sess_abc",
  "channel": "web",
  "status": "completed",
  "response": {
    "role": "assistant",
    "text": "Resumo gerado com sucesso."
  },
  "task": {
    "id": "task_789",
    "status": "approved"
  },
  "meta": {
    "requestId": "req_001",
    "correlationId": "corr_999",
    "durationMs": 412
  }
}
10. Endpoints complementares úteis
Para o MVP02, eu sugiro só estes:

HTTP
POST /gateway/message

GET /gateway/sessions/:id

GET /gateway/sessions/:id/messages

GET /gateway/tasks/:taskId/status

WebSocket
GET /gateway/ws ou upgrade em /gateway/stream

eventos:

session.opened

message.accepted

task.updated

task.completed

audit.completed

visual.state

Por que já pensar em WebSocket
Porque o Nebula futuro depende de eventos e estado vivo, não só request/response. O documento de interface futura já coloca WebSocket, Session Manager, Event Normalizer e um modelo de evento visual como parte central do bridge 

.

Mesmo que a Web UI inicial seja simples, o gateway já deve nascer com isso previsto.

11. Fluxo interno completo
Fluxo síncrono simplificado
Web envia POST /gateway/message

CommunicationController valida DTO

ReceiveGatewayMessageUseCase é chamado

ChannelAdapter(web) normaliza payload para UnifiedMessage

SessionResolver encontra ou cria CommunicationSession

gateway salva mensagem recebida

TaskIngressPort.createFromMessage() chama o sistema atual

kernel cria task

kernel faz parse

kernel resolve estratégia skill-first

kernel executa

kernel audita

kernel persiste eventos/logs

gateway monta UnifiedResponse

resposta volta para a Web

Fluxo com streaming depois
gateway aceita mensagem

devolve accepted

task processa

gateway recebe eventos do kernel

repassa por WebSocket para UI

UI renderiza texto, estados e no futuro estados visuais Nebula

12. Integração com o Task System atual
Esse é o ponto mais importante do desenho.

Não faça isso
controller do gateway chamando /tasks por HTTP interno

duplicar lógica de criação de task dentro do gateway

criar “task-lite” paralelo no módulo de comunicação

Faça isso
Crie um caso de uso interno do kernel, algo como:

CreateTaskFromMessageUseCase
ou

IngressMessageUseCase
Esse caso de uso:

recebe UnifiedMessage

extrai o texto

monta o TaskInput

chama o fluxo atual do kernel

retorna { taskId, status, result }

Sugestão de assinatura
interface CreateTaskFromMessageInput {
  sessionId: string;
  channel: string;
  userId?: string;
  content: string;
  metadata?: Record<string, unknown>;
}

interface CreateTaskFromMessageOutput {
  taskId: string;
  taskStatus: string;
  responseText?: string;
}
13. Mapeamento Message → Task
Esse mapeamento precisa ser explícito.

Regra do MVP02
Toda mensagem textual de usuário vira uma task executável.

Mapeamento inicial:

UnifiedMessage.content.text
  -> Task.input

UnifiedMessage.sender.internalUserId
  -> Task.userId

UnifiedMessage.session.id
  -> Task.sessionId

UnifiedMessage.channel
  -> Task.sourceChannel

UnifiedMessage.metadata.requestId
  -> Task.correlationId

UnifiedMessage.metadata.context
  -> Task.inputContext
Campo novo útil na Task
Se ainda não existir, adicione:

sourceChannel: "web" | "telegram" | "discord" | "cli" | "mobile";
sessionId?: string;
correlationId?: string;
originMessageId?: string;
Isso melhora rastreabilidade e auditoria.

14. Eventos recomendados
Como o MVP01 já pede eventos de domínio para tudo que importa 

, no módulo communication eu criaria estes:

GatewayMessageReceived

GatewayMessageNormalized

CommunicationSessionOpened

CommunicationSessionResumed

GatewayTaskDispatched

GatewayResponseBuilt

E continuaria reaproveitando os eventos internos já existentes do task system:

TaskCreated

TaskParsed

ExecutionStrategyResolved

SkillExecuted

AgentExecuted

AuditCompleted

Ganho
Isso te dá duas timelines:

timeline de canal/conversa

timeline de execução do kernel

Depois você une as duas no painel.

15. Estado visual compatível com Nebula
Mesmo sem UI bonita agora, eu já colocaria uma camada opcional de “visual state” na saída do gateway.

type VisualState =
  | "idle"
  | "listening"
  | "thinking"
  | "tool_execution"
  | "speaking"
  | "success"
  | "error";
Isso é diretamente compatível com o modelo cognitivo do Nebula, que já define esses estados primários para a interface futura 

.

Mapeamento simples
mensagem recebida → listening

parsing/planning → thinking

skill/agent em execução → tool_execution

resposta emitida → speaking

task aprovada → success

task falhou/rejeitada → error

Importante
Esse estado visual não pertence ao domínio central.
Ele pertence ao Response Mapper do gateway.

Assim você mantém compatibilidade com Nebula sem poluir o kernel.

16. Session strategy para o MVP02
Mantenha simples.

Regras
se session.id vier no payload, reutiliza

se não vier, cria uma nova

por enquanto, 1 sessão = 1 fluxo de conversa por canal

associe tasks à sessão

guarde lastTaskId e lastMessageAt

não implemente memória conversacional complexa ainda

Por quê
Porque no MVP02 a sessão é principalmente:

continuidade operacional

correlação

canal de streaming

ponte para memória futura

Não precisa virar LLM memory antes da hora.

17. Leitura para frontend
Você comentou que não quer UI bonita ainda. Ótimo.

Então a UI web deve consumir dois tipos de dado:

A. Canal conversacional
POST /gateway/message

GET /gateway/sessions/:id/messages

WS /gateway/stream

B. Painel operacional
/tasks

/tasks/:id

/tasks/:id/events

/events

Isso segue a recomendação do próprio MVP01 de manter read model simples para consumo do painel, sem obrigar o frontend a remontar o sistema a partir de logs crus 

.

18. O que eu implementaria agora no backend
Fase 1 do MVP02
Módulo communication
entidade UnifiedMessage

entidade CommunicationSession

ReceiveGatewayMessageUseCase

SessionResolverService

TaskIngressPort

WebChannelAdapter

POST /gateway/message

Integração mínima com kernel
CreateTaskFromMessageUseCase

grava sourceChannel, sessionId, originMessageId

retorna resposta textual + task id

Observabilidade
eventos do gateway

correlationId fim a fim

idempotency key opcional

Ainda não precisa
Telegram

Discord

streaming token a token

voz

renderização Nebula

multimodal pesado

19. Exemplo de fluxo em código
// interfaces/http/communication.controller.ts
async postMessage(req, res) {
  const output = await receiveGatewayMessageUseCase.execute(req.body);
  return res.status(200).send(output);
}
// application/use-cases/receive-gateway-message.use-case.ts
async execute(input: GatewayMessageRequestDto): Promise<GatewayMessageResponseDto> {
  const normalized = await channelAdapter.normalize(input);
  const session = await sessionResolver.resolve(normalized);
  await communicationMessageRepository.save(normalized);

  const taskResult = await taskIngressPort.createFromMessage({
    sessionId: session.id,
    message: normalized,
  });

  return gatewayResponseMapper.fromTaskResult({
    message: normalized,
    session,
    taskResult,
  });
}
// application/mappers/task-command.mapper.ts
toTaskInput(message: UnifiedMessage) {
  return {
    input: message.content.text ?? "",
    sessionId: message.session.id,
    sourceChannel: message.channel,
    correlationId: message.metadata.correlationId,
    originMessageId: message.id,
    userId: message.sender.internalUserId,
  };
}
20. Decisões arquiteturais finais
Eu bateria o martelo nestes pontos
1. O gateway será a entrada pública dos canais
Não /tasks.

2. O task system continua sendo o motor interno
Sem duplicação de regras.

3. Session é entidade operacional, não memória inteligente
Por enquanto.

4. UnifiedMessage e UnifiedResponse são contratos de borda
Não entidades centrais do kernel.

5. Visual state entra no gateway, não no domínio
Para manter compatibilidade futura com Nebula.

6. A Web UI terá dois modos de consumo
Conversa pelo gateway, operação pelo painel/read model.

21. Estrutura final recomendada
Backend
modules/
  communication/
    domain/
    application/
    infrastructure/
    interfaces/
Endpoint principal
POST /gateway/message
Entidades novas
UnifiedMessage

CommunicationSession

Caso de uso novo no kernel
CreateTaskFromMessageUseCase

Campos novos úteis em Task
sourceChannel

sessionId

originMessageId

correlationId

Compatibilidade futura
Web

Telegram

Discord

CLI

Mobile

Nebula visual states

WebSocket/streaming

22. Minha recomendação objetiva
Para o MVP02, eu adotaria este nome e escopo:

Nome do bloco
Andromeda Communication Gateway

Escopo real
bridge unificada de canais

HTTP primeiro

Web como primeiro adapter

task system como backend interno

resposta padronizada

sessão operacional

eventos preparados para streaming

Esse desenho respeita exatamente o que o MVP01 quer: camadas claras, controller fino, use cases, policies, eventos, ports/adapters e extensibilidade sem barroquismo 

. E ao mesmo tempo prepara o terreno para o Nebula, que já pressupõe bridge backend, sessions, event normalization e comunicação em tempo real entre frontend e runtime 

.

Se você quiser, no próximo passo eu transformo isso em um documento técnico de implementação do MVP02 já no formato de spec com:

árvore de pastas completa

contratos TypeScript

endpoints

stories por módulo

ordem de implementação.


importante tbm ja pensar em alguma forma de autentificação para por exemplo apenas interfaces com token consiga comunicar... incialmente pode ser um token fixo na faze de testes depois mudamos

Boa adição. Isso entra muito bem no gateway: autenticação deve ser uma preocupação da borda, antes de sessão e antes de virar task.

Pensou por 10s
Sim — e o lugar certo para isso é no próprio Communication Gateway, não no Task System.

Isso combina com o MVP01, que coloca autenticação básica, validação e serialização na camada de Interface/Delivery, enquanto a orquestração e o core ficam separados 

. Também encaixa com o Nebula, que já prevê API tokens e uma auth layer opcional no bridge/backend 

.

Eu adicionaria isso ao desenho assim:

1. Regra arquitetural
Autenticação fica na borda
Fluxo atualizado:

Web / Mobile / CLI / Discord / Telegram
→ Auth Middleware / Channel Auth
→ Communication Gateway
→ Session Resolver
→ Task Mapper
→ Kernel

Ou seja:

o gateway rejeita chamadas não autorizadas antes de criar sessão

o task system não precisa conhecer token de canal

o kernel recebe só requisições já confiáveis

Isso evita acoplamento e mantém o core limpo, como o MVP01 recomenda para controllers e adapters 

.

2. O que implementar agora no MVP02
Fase inicial: token fixo por canal
Para teste, um modelo simples resolve bem:

header Authorization: Bearer <token>

ou header X-Andromeda-Token: <token>

Eu prefiro:

Authorization: Bearer andromeda_dev_web_token
Porque depois a migração para JWT, API key ou auth por client fica natural.

Regra inicial
cada interface cliente manda um token

o gateway valida contra config/env

se bater, a requisição entra

se não bater, 401 Unauthorized

3. Modelo recomendado de credencial
Mesmo começando simples, já desenhe como “client auth”, não só “token solto”.

Estrutura conceitual
interface ChannelClientCredential {
  id: string;                // web-dev, cli-local, nebula-mobile-alpha
  channel: "web" | "cli" | "mobile" | "telegram" | "discord";
  tokenHash: string;
  status: "active" | "revoked";
  scopes: string[];          // gateway:message, gateway:session:read
  metadata?: {
    environment?: "dev" | "staging" | "prod";
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}
No MVP02 real
Você não precisa persistir isso em banco ainda.
Pode começar com config:

GATEWAY_WEB_TOKEN=andromeda_dev_web_token
GATEWAY_CLI_TOKEN=andromeda_dev_cli_token
Mas a abstração já deve existir.

4. Port de autenticação
Eu criaria um port específico:

interface ChannelAuthPort {
  authenticate(input: {
    channel: string;
    token?: string;
  }): Promise<{
    authenticated: boolean;
    clientId?: string;
    scopes?: string[];
  }>;
}
Implementações:

StaticTokenChannelAuthAdapter

depois:

DatabaseApiKeyChannelAuthAdapter

JwtChannelAuthAdapter

InternalServiceAuthAdapter

Assim você segue a linha de Ports & Adapters do MVP01 sem overengineering 

.

5. Middleware / Use case
Estrutura
modules/communication/
  application/
    use-cases/
      authenticate-channel-client.use-case.ts
      receive-gateway-message.use-case.ts
  domain/
    services/
      channel-auth.service.ts
  infrastructure/
    auth/
      static-token-channel-auth.adapter.ts
  interfaces/
    http/
      middlewares/
        gateway-auth.middleware.ts
Regra
O middleware:

lê Authorization

extrai bearer token

identifica canal

valida token

injeta no request:

clientId

scopes

authenticated = true

Depois o controller chama o use case normal.

6. Como o request muda
Eu incluiria no contexto autenticado:

interface AuthContext {
  clientId: string;
  channel: string;
  scopes: string[];
  authenticated: boolean;
}
E o UnifiedMessage pode ganhar isso em metadata interna, sem expor para o frontend como domínio principal:

metadata: {
  ...
  auth?: {
    clientId: string;
    scopes: string[];
  }
}
Importante: isso é contexto técnico, não identidade final do usuário.

7. Separar “client auth” de “user identity”
Esse ponto é importante.

Client auth
Quem está chamando a API?

Exemplo:

web app oficial

app mobile oficial

cli oficial

User identity
Qual usuário humano está usando esse cliente?

Exemplo:

internalUserId

externalUserId

No MVP02, você pode ter:

cliente autenticado por token fixo

usuário ainda simples, vindo do payload ou de sessão local

Mais pra frente:

cliente autenticado

usuário autenticado por login/session/JWT

Essa separação vai te salvar depois.

8. Endpoints com auth
Obrigatórios com token
POST /gateway/message

GET /gateway/sessions/:id

GET /gateway/sessions/:id/messages

GET /gateway/tasks/:taskId/status

WS /gateway/stream

Exemplo
POST /gateway/message
Authorization: Bearer andromeda_dev_web_token
Content-Type: application/json
9. WebSocket também precisa autenticação
Como o Nebula futuro depende de WebSocket bridge 

, já vale preparar isso agora.

MVP simples
No handshake do WebSocket:

query param ?token=...
ou

header Authorization

Preferência:

header quando possível

fallback por query só em ambiente de teste

Regra
Sem token válido:

conexão recusada

10. Scopes mínimos
Mesmo em token fixo, eu já colocaria escopos no desenho:

gateway:message:write

gateway:session:read

gateway:task:read

gateway:stream:connect

No começo, todos os tokens podem receber tudo.
Mas a estrutura já nasce pronta.

Exemplo:

{
  clientId: "web-dev",
  scopes: [
    "gateway:message:write",
    "gateway:session:read",
    "gateway:task:read",
    "gateway:stream:connect"
  ]
}
11. Regras de segurança práticas para já
Mesmo em fase de teste, eu colocaria estas regras:

token só por variável de ambiente

nunca hardcode no frontend em produção

logs nunca mostram token completo

comparar token em tempo constante

responder sempre com erro genérico em auth

registrar tentativa inválida com requestId e origem

Exemplo de log
{
  "event": "gateway_auth_failed",
  "channel": "web",
  "requestId": "req_001",
  "reason": "invalid_token"
}
12. Response de erro
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing gateway token"
  },
  "meta": {
    "requestId": "req_001"
  }
}
13. Estratégia de evolução
Agora
token fixo via env

1 token por interface/canal

middleware de auth no gateway

Depois
tabela de clients/api keys

rotação de token

revogação

scopes reais

rate limiting por client

autenticação de usuário separada

Depois ainda
JWT/OAuth para apps oficiais

service-to-service auth

device binding no mobile

14. Decisão prática recomendada
Eu fecharia assim para o MVP02:

Config
GATEWAY_AUTH_ENABLED=true
GATEWAY_WEB_TOKEN=andromeda_dev_web_token
GATEWAY_MOBILE_TOKEN=andromeda_dev_mobile_token
GATEWAY_CLI_TOKEN=andromeda_dev_cli_token
Comportamento
channel=web só entra com token web válido

channel=cli só entra com token cli válido

request sem token: 401

token inválido: 401

token válido: segue fluxo

Vantagem
Você já protege o gateway e já estabelece a noção correta de:
canais autorizados em vez de “qualquer UI consegue falar com o kernel”.

15. Atualização da arquitetura do Communication Gateway
Eu acrescentaria um submódulo:

modules/communication/
  domain/
    repositories/
    services/
  application/
    use-cases/
      authenticate-channel-client.use-case.ts
      receive-gateway-message.use-case.ts
  infrastructure/
    auth/
      static-token-channel-auth.adapter.ts
    persistence/
    channels/
  interfaces/
    http/
      middlewares/
        gateway-auth.middleware.ts
      communication.controller.ts
    websocket/
      communication.ws-gateway.ts
E no fluxo:

Client
→ Gateway Auth Middleware
→ Controller
→ ReceiveGatewayMessageUseCase
→ SessionResolver
→ TaskIngressPort
→ Kernel

16. Minha recomendação objetiva
Sim: vale muito colocar autenticação agora.

Mas do jeito certo:

simples

na borda

por token fixo inicialmente

por client/canal

sem contaminar o kernel

já preparado para virar API keys/JWT depois

Esse ajuste fica totalmente coerente com o MVP01, que já reserva autenticação para a camada de delivery/interface , e também com o Nebula, que já prevê tokens e camada opcional de auth no backend bridge 

.

No próximo passo eu posso consolidar tudo isso em uma spec final do MVP02 já incluindo:
arquitetura, pastas, modelos, endpoints e auth.


perfeito pode seguir assim para eu ja enviar para o antigravity vibe codar

Vou consolidar tudo em uma spec única, pronta para colar no Antigravity como base de implementação do MVP02.

Pensou por 12s
Perfeito. Abaixo está uma spec pronta para colar no Antigravity como base do MVP02.

Ela segue o espírito do MVP01: camadas claras, controllers finos, use cases explícitos, ports/adapters e foco na espinha dorsal, não em “frontend bonito” . Também já prepara compatibilidade com o Nebula, que prevê um backend bridge leve com HTTP API, WebSocket, Event Normalizer, Session Manager e uso de API tokens .

Andromeda OS — MVP02
Communication Gateway + Web Channel
Objetivo
Implementar a base do MVP02 criando uma camada de comunicação unificada no backend, onde o frontend web será tratado como apenas mais um canal.

O frontend não deve falar diretamente com /tasks.
A entrada pública do sistema passa a ser o Communication Gateway.

Princípios
manter o kernel atual como motor interno

não duplicar lógica de task dentro do gateway

autenticação na borda

sessão operacional simples

frontend desacoplado do task system

compatibilidade futura com:

web

telegram

discord

cli

mobile

nebula

Decisão arquitetural
Antes
Frontend -> /tasks -> Task System -> Execution Engine
Depois
Web / Mobile / CLI / Telegram / Discord
        -> Communication Gateway
        -> Task System atual
        -> Execution Engine
        -> Auditoria / Eventos
        -> Response Mapper
        -> Canal de origem
Papel do Communication Gateway
O gateway é uma camada de borda com responsabilidades limitadas:

Faz
receber mensagens de canais

validar entrada

autenticar cliente do canal

normalizar mensagem

resolver ou criar sessão

converter mensagem em comando interno

chamar o task system atual

montar resposta unificada

emitir eventos de comunicação

Não faz
executar skill

escolher estratégia de execução

fazer auditoria

conter lógica central de domínio

substituir o kernel

Compatibilidade com MVP01
O desenho respeita a arquitetura em camadas do MVP01:

Interface / Delivery: HTTP, auth, serialização, validação

Application / Orchestration: use cases e coordenação

Domain / Core: regras centrais, entidades e contratos

Infrastructure: persistência, adapters externos, providers

Também segue a diretriz de ports/adapters, use cases explícitos e separação leve de read/write side para não forçar o frontend a consumir entidades cruas de domínio .

1. Escopo do MVP02
Entregas principais
módulo communication

endpoint POST /gateway/message

autenticação por token fixo por canal

canal inicial web

session model simples

unified message model

integração com task system atual por use case interno

resposta unificada

base para websocket futuro

Fora de escopo por enquanto
voz

tts/stt

visual nebula avançado

telegram real

discord real

auth de usuário final

jwt/oauth

streaming token a token

2. Estrutura de pastas
apps/api/src/modules/
  communication/
    domain/
      entities/
        unified-message.entity.ts
        communication-session.entity.ts
      value-objects/
        channel.vo.ts
        sender.vo.ts
      repositories/
        communication-session.repository.ts
        communication-message.repository.ts
        channel-client-credential.repository.ts
      services/
        message-normalizer.service.ts
        session-resolver.service.ts
        channel-auth.service.ts
      events/
        gateway-message-received.event.ts
        gateway-message-normalized.event.ts
        communication-session-opened.event.ts
        gateway-task-dispatched.event.ts
        gateway-response-created.event.ts

    application/
      dto/
        gateway-message.request.dto.ts
        gateway-message.response.dto.ts
      use-cases/
        authenticate-channel-client.use-case.ts
        receive-gateway-message.use-case.ts
        resolve-session.use-case.ts
        create-task-from-message.use-case.ts
        build-gateway-response.use-case.ts
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
3. Modelo unificado de mensagem
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
Regras
toda mensagem externa deve ser convertida para UnifiedMessage

o gateway trabalha sempre com esse formato internamente

canais futuros só precisam implementar normalização para esse contrato

4. Modelo de sessão
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
Papel da sessão no MVP02
continuidade conversacional

rastreabilidade entre mensagens e tasks

base para websocket

preparação para memória futura

Não transformar isso em memória inteligente ainda.

5. Modelo de resposta unificada
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
Observação
O visual.state já deixa o gateway compatível com o Nebula, que trabalha com estados como idle, listening, thinking, speaking, tool_execution, success e error 

.

6. Autenticação do gateway
Decisão
A autenticação fica na borda, antes de criar sessão e antes de virar task. Isso é coerente com a camada de delivery/interface do MVP01, que já inclui autenticação básica e validação de entrada .

Fase inicial
Usar token fixo por canal via header:

Authorization: Bearer andromeda_dev_web_token
Variáveis de ambiente
GATEWAY_AUTH_ENABLED=true
GATEWAY_WEB_TOKEN=andromeda_dev_web_token
GATEWAY_CLI_TOKEN=andromeda_dev_cli_token
GATEWAY_MOBILE_TOKEN=andromeda_dev_mobile_token
Regra
channel=web aceita apenas token web válido

channel=cli aceita apenas token cli válido

ausência de token = 401

token inválido = 401

Abstração recomendada
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
Adapter inicial
StaticTokenChannelAuthAdapter
Evolução futura
api keys persistidas

revogação

rotação

jwt

oauth

rate limit por client

7. Separação importante: client auth vs user identity
Client auth
Quem está chamando a API?

Exemplos:

web oficial

mobile oficial

cli oficial

User identity
Qual humano está usando esse cliente?

Exemplos:

internalUserId

externalUserId

No MVP02:

cliente autenticado por token fixo

usuário ainda simples, vindo do payload/sessão

Isso evita misturar segurança de integração com login de usuário final.

8. Ports recomendados
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
  existsByIdempotencyKey(key: string): Promise<boolean>;
}

export interface ChannelAdapterPort {
  channel: string;
  normalize(input: unknown): Promise<UnifiedMessage>;
  buildResponse(output: UnifiedResponse): Promise<unknown>;
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
9. Integração com o Task System atual
Regra principal
O gateway não deve chamar /tasks por HTTP interno.

Ele deve chamar um use case interno do kernel.

Use case novo recomendado
CreateTaskFromMessageUseCase
ou

IngressMessageUseCase
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
Mapeamento Message -> Task
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
Campos úteis a adicionar na Task
sourceChannel: "web" | "telegram" | "discord" | "cli" | "mobile";
sessionId?: string;
correlationId?: string;
originMessageId?: string;
requestId?: string;
10. Fluxo completo
Fluxo HTTP síncrono inicial
Client Web
  -> Auth Middleware
  -> Communication Controller
  -> ReceiveGatewayMessageUseCase
  -> WebChannelAdapter.normalize()
  -> SessionResolver
  -> CommunicationMessageRepository.save()
  -> TaskIngressPort.createFromMessage()
  -> Kernel / Task System atual
  -> Execution Engine
  -> Auditoria
  -> GatewayResponseMapper
  -> HTTP Response
Fluxo detalhado
cliente envia POST /gateway/message

middleware valida token

controller valida DTO

adapter web converte payload em UnifiedMessage

sessão é localizada ou criada

mensagem é persistida

use case interno cria/aciona task

task segue o fluxo atual:

create

parse

resolve execution strategy

execute

audit

complete/reject

gateway monta UnifiedResponse

resposta volta ao cliente

11. Eventos recomendados
Eventos do módulo communication
GatewayMessageReceived

GatewayMessageNormalized

CommunicationSessionOpened

CommunicationSessionResumed

GatewayTaskDispatched

GatewayResponseCreated

GatewayAuthFailed

Eventos já existentes/reaproveitados do task system
TaskCreated

TaskParsed

ExecutionStrategyResolved

SkillExecuted

AgentExecuted

AuditCompleted

TaskCompleted

TaskRejected

Isso preserva observabilidade sem invadir lógica central, em linha com a recomendação do MVP01 para event-driven/observability 

.

12. Endpoints do MVP02
Obrigatórios agora
POST /gateway/message
Entrada pública principal para canais.

GET /gateway/sessions/:id
Consulta sessão operacional.

GET /gateway/sessions/:id/messages
Lista mensagens normalizadas da sessão.

GET /gateway/tasks/:taskId/status
Consulta status simplificado da task vinculada.

13. WebSocket
O Nebula já prevê backend bridge com WebSocket e normalização de eventos . Então o gateway deve nascer preparado para isso, mesmo que o MVP02 implemente só o básico.

Endpoint futuro imediato
GET /gateway/stream
ou

WS /gateway/ws
Eventos futuros
session.opened

message.accepted

task.updated

task.completed

audit.completed

visual.state

Auth no websocket
preferir Authorization no handshake

fallback por query param só em ambiente de teste

14. DTO de entrada
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
15. DTO de saída
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
16. Exemplo de request
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
17. Exemplo de response
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
18. Exemplo de erro de autenticação
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or missing gateway token"
  },
  "meta": {
    "requestId": "req_001"
  }
}
19. Middleware de autenticação
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
20. Use case principal
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
21. Frontend web do MVP02
Papel do frontend
O frontend web será apenas o primeiro channel.

Ele não conhece o task system diretamente.
Ele fala apenas com o gateway.

Fluxo do frontend
envia mensagens para POST /gateway/message

consulta sessão/mensagens pelo gateway

depois consome websocket do gateway

opcionalmente, consulta painel operacional via read-side separado

Não fazer agora
frontend chamando /tasks

frontend remontando estado por logs crus

UI “bonita” antes do fluxo estar sólido

Isso está alinhado com o MVP01, que recomenda primeiro completar o ciclo central e só depois expandir a leitura/painel .

22. Read side para painel
Separar desde já dois consumos:

Conversa / canal
/gateway/message

/gateway/sessions/:id

/gateway/sessions/:id/messages

websocket do gateway

Operação / observabilidade
/tasks

/tasks/:id

/tasks/:id/events

/events

Isso segue a recomendação de read model simples/CQRS leve para o painel 

.

23. Ordem de implementação
Fase A — Base do módulo communication
criar pasta modules/communication

criar entidades:

UnifiedMessage

CommunicationSession

criar DTOs

criar ChannelAuthPort

implementar StaticTokenChannelAuthAdapter

criar gateway-auth.middleware.ts

Fase B — Canal web
implementar WebChannelAdapter

implementar SessionResolver

persistir mensagens e sessões

criar POST /gateway/message

Fase C — Integração com kernel
criar CreateTaskFromMessageUseCase

mapear UnifiedMessage -> Task

adicionar campos em Task:

sourceChannel

sessionId

originMessageId

correlationId

retornar UnifiedResponse

Fase D — Leitura mínima
criar GET /gateway/sessions/:id

criar GET /gateway/sessions/:id/messages

criar GET /gateway/tasks/:taskId/status

Fase E — Preparação para realtime
criar contrato de eventos do gateway

preparar communication.ws-gateway.ts

expor visual.state na resposta

24. Critérios de aceite
Story 1 — Gateway recebe mensagem web autenticada
request com token válido entra

request sem token falha com 401

request com token inválido falha com 401

Story 2 — Mensagem vira UnifiedMessage
payload web é normalizado

campos obrigatórios presentes

requestId e correlationId preservados

Story 3 — Sessão é resolvida
se session.id existir, reutiliza

se não existir, cria nova

lastMessageAt é atualizado

Story 4 — Gateway cria task no kernel
não usa HTTP interno

chama use case interno

task recebe sourceChannel e sessionId

Story 5 — Gateway devolve resposta unificada
task id retornado

status retornado

texto retornado

visual.state mapeado

Story 6 — Observabilidade mínima
eventos principais registrados

falha de auth logada sem expor token

correlação entre message e task disponível

25. Anti-patterns a evitar
gateway chamando /tasks por HTTP

lógica de task duplicada no módulo communication

autenticação dentro do kernel

frontend usando /tasks como chat API

misturar identidade do usuário com identidade do client

sessão virando “memória mágica” cedo demais

websocket antes do contrato de mensagem estar sólido

UI bonita antes da camada de comunicação estar pronta

Esses pontos também são coerentes com os anti-patterns já listados no MVP01, como regra de negócio em controller, adaptação espalhada e frontend consumindo entidades cruas de domínio 

.

26. Prompt de handoff para o Antigravity
Use esta spec como base para implementar o MVP02 do Andromeda OS.

Objetivo:
criar o Communication Gateway como nova entrada pública do sistema, tratando o frontend web como apenas um channel.

Regras principais:
- o frontend NÃO deve chamar /tasks diretamente
- o gateway deve autenticar por token fixo por canal
- o gateway deve normalizar a mensagem para UnifiedMessage
- o gateway deve resolver ou criar sessão
- o gateway deve converter a mensagem em task via use case interno
- o kernel atual continua sendo o motor interno
- a arquitetura deve seguir Clean Architecture + Ports & Adapters
- evitar overengineering
- preparar compatibilidade futura com Telegram, Discord, CLI e Mobile/Nebula
- preparar campo visual.state para futura integração Nebula

Entregas mínimas:
1. módulo modules/communication
2. entidade UnifiedMessage
3. entidade CommunicationSession
4. middleware de auth por token fixo
5. adapter do canal web
6. endpoint POST /gateway/message
7. integração com Task System atual por use case interno
8. response unificada
9. endpoints básicos de sessão
10. base para websocket futuro

Não fazer agora:
- voz
- TTS/STT
- UI bonita
- Telegram real
- Discord real
- JWT/OAuth
- streaming token a token

Prioridade absoluta:
fazer o fluxo completo funcionar:
web -> gateway -> task system -> execution -> auditoria -> resposta
27. Resumo executivo
O MVP02 não é “fazer frontend”.

É criar a camada de comunicação do Andromeda OS.

A decisão correta é:

gateway como entrada pública

web como primeiro canal

task system como motor interno

auth simples na borda

sessão operacional leve

contratos estáveis

preparação para Nebula sem travar o MVP

Se quiser, no próximo passo eu transformo essa spec em uma versão ainda mais operacional, no formato backlog por stories + checklist de arquivos para o Antigravity criar.


por favor deixe o mais completa possivel para minimizar erros... manter tudo fiel ao conseito e economizar tokens

Vou expandir a spec para um nível mais prescritivo: contratos, regras, fluxo, decisões, critérios e limites explícitos, para reduzir ambiguidade no handoff ao Antigravity.

Pensou por 16s
Perfeito. Abaixo vai uma versão mais fechada, prescritiva e econômica em ambiguidade, pensada para minimizar interpretações erradas no Antigravity e manter fidelidade ao conceito do Andromeda OS.

Ela está alinhada com o MVP01, que pede camadas claras, autenticação/validação na Interface/Delivery, use cases explícitos na Application, regras e contratos no Domain/Core, e adapters na Infrastructure 

. Também respeita os padrões centrais do MVP, especialmente Ports & Adapters e Use Case Pattern 

, e incorpora a direção do Nebula, que prevê um backend bridge leve com HTTP API, WebSocket, Event Normalizer, Session Manager, estados cognitivos e API tokens .

PROMPT / SPEC FINAL PARA O ANTIGRAVITY
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

Essa versão já está bem mais “travada” para reduzir improviso. Ela reforça exatamente o que o MVP01 pede — espinha dorsal antes do frontend bonito, autenticação e validação na camada de interface, use cases explícitos, ports/adapters e read-side leve  — e ao mesmo tempo mantém o futuro alinhado ao Nebula Bridge com sessão, normalização de eventos, WebSocket e estados cognitivos padronizados .

Se quiser, no próximo passo eu posso converter isso em uma versão ainda mais prática no formato **backlog técnico por arquivos + checklist de implementação**, para o Antigravity criar exatamente os arquivos na ordem certa.

crie um prompt para o antigravite executar usando o arquivo de referencia /doc/Andromeda_PRD_MVP02.md

Pensou por alguns segundos
Segue um prompt pronto para colar no Antigravity:

Use o arquivo de referência abaixo como fonte canônica desta implementação:

`/doc/Andromeda_PRD_MVP02.md`

Sua tarefa é implementar o **MVP02 do Andromeda OS** com base estrita nesse documento.

## Instrução principal

Leia o arquivo `/doc/Andromeda_PRD_MVP02.md` por completo e siga fielmente sua arquitetura, contratos, limites e prioridades.

O objetivo deste ciclo é implementar a **camada de comunicação unificada** do Andromeda OS, tratando a interface web como apenas o primeiro canal de entrada do sistema.

## Regra arquitetural obrigatória

O frontend web **NÃO** deve falar diretamente com `/tasks` como API conversacional.

A nova entrada pública do sistema deve ser:

- `POST /gateway/message`

O sistema deve seguir o fluxo:

**web -> gateway -> task system -> execution -> auditoria -> resposta**

## O que implementar

Implementar exatamente o que estiver definido no PRD para o MVP02, incluindo no mínimo:

1. módulo `communication`
2. `Communication Gateway`
3. autenticação simples por token fixo por canal
4. canal inicial `web`
5. modelo `UnifiedMessage`
6. modelo `CommunicationSession`
7. integração com o task system atual por use case interno
8. `UnifiedResponse`
9. endpoints mínimos de sessão/leitura
10. base estrutural para websocket futuro

## Restrições obrigatórias

Não inventar arquitetura paralela.
Não simplificar o conceito central.
Não acoplar o frontend diretamente ao task system.
Não duplicar lógica do kernel dentro do gateway.
Não usar chamada HTTP interna para `/tasks`.
Não antecipar UI bonita, voz, multimodalidade pesada ou features fora do escopo definido no PRD.

## Prioridades absolutas

1. fidelidade ao documento `/doc/Andromeda_PRD_MVP02.md`
2. desacoplamento
3. extensibilidade futura
4. compatibilidade com Nebula
5. implementação pragmática sem overengineering

## Regras de implementação

- seguir Clean Architecture + Ports & Adapters
- manter controllers finos
- concentrar orquestração em use cases
- manter autenticação na borda
- tratar sessão como sessão operacional, não memória avançada
- preparar compatibilidade futura com:
  - Telegram
  - Discord
  - CLI
  - Mobile
  - Nebula

## Forma de execução

1. leia e interprete o arquivo `/doc/Andromeda_PRD_MVP02.md`
2. identifique a estrutura de pastas e contratos exigidos
3. implemente os arquivos necessários na ordem mais segura
4. preserve compatibilidade com o backend já existente
5. ao final, gere um resumo objetivo contendo:
   - arquivos criados
   - arquivos alterados
   - decisões relevantes tomadas
   - pontos pendentes, se houver

## Critério de sucesso

A implementação será considerada correta quando existir um fluxo funcional onde:

- uma interface web autenticada envia mensagem ao gateway
- o gateway normaliza a mensagem
- resolve/cria sessão
- converte em task via caso de uso interno
- aciona o kernel atual
- recebe o resultado
- devolve uma resposta unificada

## Instrução final

Se houver qualquer dúvida entre duas abordagens, escolha sempre a que:
- mantém o kernel limpo
- reduz acoplamento
- segue o PRD com mais fidelidade
- evita refatoração grande no futuro
- mantém o gateway como camada de borda e não como segundo kernel
Se quiser, eu também posso fazer uma segunda versão desse prompt em estilo mais imperativo e técnico, otimizada para agente de codificação.





