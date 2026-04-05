# Design Técnico — Backend Model Chat Endpoint

## Visão Geral

Esta spec adiciona o menor backend possível para desbloquear `.kiro/specs/frontend-chat-console/`: uma rota síncrona de chat por `modelId`, usando o módulo de providers já existente como fonte de verdade para catálogo, provider lookup e instanciação de adapters.

O design evita qualquer expansão arquitetural paralela. Em vez de criar um novo módulo de chat, a feature permanece dentro de `core/kernel/src/modules/providers/`, adicionando apenas:

1. um contrato HTTP mínimo em `POST /api/providers/chat`;
2. um método de serviço para resolver `modelId -> provider -> adapter`;
3. uma extensão mínima da interface `ProviderAdapter` para completar chat;
4. testes de serviço e rota cobrindo sucesso e falhas.

---

## Objetivo arquitetural

- **Desbloquear o frontend chat console**, não reinventar o subsistema de inferência.
- **Reusar o catálogo existente** já persistido por provider.
- **Reusar a fábrica de adapters existente** já usada por health/sync.
- **Falhar explicitamente** quando o `modelId` não puder ser resolvido com segurança.
- **Não persistir estado conversacional**.

---

## Architecture Overview

```mermaid
graph TD
  FE[frontend-chat-console] -->|POST /api/providers/chat| ROUTE[providerRoutes.ts]
  ROUTE --> SERVICE[ProviderOrchestratorService.chatByModel]
  SERVICE --> REPO[ProviderRepository]
  REPO --> CATALOG[getCatalog(providerId)]
  SERVICE --> LOOKUP[resolveModelOwner(modelId)]
  LOOKUP --> PROVIDER[findById(providerId)]
  SERVICE --> ADAPTER[resolveAdapter(provider)]
  ADAPTER --> CHAT[adapter.chat(modelId, messages)]
  CHAT --> ROUTE
  ROUTE --> FE
```

---

## Fluxo principal

### 1. Request de chat

1. O frontend envia `POST /api/providers/chat`.
2. O backend valida o body com schema Zod/Fastify compatível com o contrato da spec.
3. O serviço busca em todos os catálogos persistidos qual provider contém o `modelId`.
4. O serviço valida que existe exatamente um dono para o modelo.
5. O serviço resolve o provider pelo `providerId` do catálogo.
6. O serviço instancia o adapter existente via factory.
7. O serviço chama o método mínimo de chat completion do adapter com `modelId` e `messages`.
8. O backend responde com uma única mensagem do assistente.

### 2. Falhas

- Payload inválido → rejeição imediata com `400`.
- Modelo ausente no catálogo → `404 MODEL_NOT_FOUND`.
- Modelo duplicado em múltiplos providers → `409 MODEL_AMBIGUOUS`.
- Provider ausente no repositório → `404 PROVIDER_NOT_FOUND`.
- Provider offline/inacessível → `503 PROVIDER_UNREACHABLE`.
- Falha upstream após conexão → `502 UPSTREAM_CHAT_FAILED`.

---

## Contrato HTTP

### Endpoint

```http
POST /api/providers/chat
Content-Type: application/json
```

### Request body

```ts
type ProviderChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ProviderChatRequest = {
  modelId: string;
  messages: ProviderChatMessage[];
};
```

### Regras de validação

- `modelId`: obrigatório, string, `trim().length > 0`
- `messages`: obrigatório, array, `length >= 1`
- cada item:
  - `role`: `'user' | 'assistant'`
  - `content`: obrigatório, string, `trim().length > 0`

### Response de sucesso

```ts
type ProviderChatResponse = {
  message: {
    role: 'assistant';
    content: string;
  };
};
```

### Responses de erro

```ts
type ProviderChatErrorResponse = {
  error: string;
  code:
    | 'INVALID_CHAT_PAYLOAD'
    | 'MODEL_NOT_FOUND'
    | 'MODEL_AMBIGUOUS'
    | 'PROVIDER_NOT_FOUND'
    | 'PROVIDER_UNREACHABLE'
    | 'UPSTREAM_CHAT_FAILED';
};
```

---

## Componentes e mudanças previstas

### 1. Interface do adapter

Arquivo: `core/kernel/src/modules/providers/infrastructure/adapters/adapter.interface.ts`

Extensão mínima proposta:

```ts
export type ProviderChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type ProviderChatResult = {
  message: {
    role: 'assistant';
    content: string;
  };
};

export interface ProviderAdapter {
  listModels(): Promise<Array<Omit<ModelCatalogItem, 'id' | 'providerId'>>>;
  ping(): Promise<{ ok: boolean; latencyMs: number }>;
  chat(modelId: string, messages: ProviderChatMessage[]): Promise<ProviderChatResult>;
}
```

Decisão: estender a interface existente é o seam mínimo mais claro porque preserva a fábrica atual e evita criar uma segunda abstração só para um único método.

### 2. `ProviderOrchestratorService`

Arquivo: `core/kernel/src/modules/providers/services/providerOrchestratorService.ts`

Adicionar dois métodos privados e um método público:

```ts
type ResolvedModelOwner = {
  providerId: string;
  modelId: string;
};

private async resolveModelOwner(modelId: string): Promise<ResolvedModelOwner>
private async resolveProviderForModel(modelId: string): Promise<Provider>

async chatByModel(input: {
  modelId: string;
  messages: ProviderChatMessage[];
}): Promise<ProviderChatResult>
```

#### Regra de resolução do modelo

1. `repository.list()` retorna todos os providers.
2. Para cada provider, `repository.getCatalog(provider.id)` retorna os modelos sincronizados.
3. O serviço coleta todas as ocorrências cujo `catalogItem.modelId === input.modelId`.
4. Resultado:
   - `0` ocorrências → lançar `MODEL_NOT_FOUND`
   - `1` ocorrência → seguir com o provider correspondente
   - `>1` ocorrências → lançar `MODEL_AMBIGUOUS`

Decisão: resolver a propriedade a partir do catálogo persistido mantém o frontend simples e reaproveita a fonte de verdade já existente.

### 3. Route handler

Arquivo: `core/kernel/src/modules/providers/routes/providerRoutes.ts`

Adicionar rota ao mesmo plugin `providerRoutes`:

```ts
server.post('/chat', async function handleChat(request, reply) {
  const providerOrchestratorService = await getProviderOrchestratorService();
  const body = request.body as ProviderChatRequest;

  try {
    const result = await providerOrchestratorService.chatByModel(body);
    return result;
  } catch (error) {
    // mapear erros de domínio para status/code explícitos
  }
});
```

Decisão: manter a rota sob `/api/providers` evita criar novo namespace para um fluxo cujo dono continua sendo o módulo de providers.

---

## Estratégia para adapters

### Objetivo

Permitir chat completion real com o menor impacto possível nos adapters já existentes.

### Regra de implementação

- Providers que já possuem caminho HTTP claro para chat devem implementar `chat()` diretamente.
- Providers sem suporte real imediato para chat devem falhar explicitamente com erro operacional mapeável, nunca com resposta fake de assistente.
- O fallback de seed data continua aceitável para `listModels()` e `ping()`, mas **não** para `chat()`.

### Erros esperados do adapter

Os adapters podem lançar erros com `code` interno ou mensagens distinguíveis, desde que o serviço/rota mapeiem para:

- `PROVIDER_UNREACHABLE` quando houver timeout, `ECONNREFUSED`, DNS, conexão recusada ou indisponibilidade equivalente;
- `UPSTREAM_CHAT_FAILED` quando o provider responder erro HTTP, payload inesperado ou falha operacional após ser alcançado.

Decisão: chat não pode usar seed/fake response, porque isso violaria o bloqueio explicitado pela spec do frontend.

---

## Estrutura de arquivos provável

### Modificar

| Arquivo | Papel |
|---|---|
| `core/kernel/src/modules/providers/infrastructure/adapters/adapter.interface.ts` | Estender a interface com tipos/método de chat |
| `core/kernel/src/modules/providers/services/providerOrchestratorService.ts` | Implementar `chatByModel` e resolução do provider dono |
| `core/kernel/src/modules/providers/routes/providerRoutes.ts` | Expor `POST /api/providers/chat` e mapear erros |
| `core/kernel/src/modules/providers/infrastructure/adapters/*.adapter.ts` | Implementar `chat()` ou falha explícita conforme o provider |

### Criar

| Arquivo | Papel |
|---|---|
| `core/kernel/src/modules/providers/routes/__tests__/providerRoutes.chat.test.ts` | Testes HTTP da rota de chat |
| `core/kernel/src/modules/providers/services/__tests__/providerChat.service.test.ts` ou equivalente | Testes do serviço de resolução/chat |

---

## Mapeamento de erros

| Situação | Status | Code |
|---|---:|---|
| Body inválido | 400 | `INVALID_CHAT_PAYLOAD` |
| `modelId` ausente do catálogo | 404 | `MODEL_NOT_FOUND` |
| `modelId` duplicado em múltiplos catálogos | 409 | `MODEL_AMBIGUOUS` |
| `providerId` do catálogo não resolve provider | 404 | `PROVIDER_NOT_FOUND` |
| Timeout / conexão recusada / offline | 503 | `PROVIDER_UNREACHABLE` |
| Erro HTTP ou falha operacional upstream | 502 | `UPSTREAM_CHAT_FAILED` |

---

## Regras explícitas de não-escopo

1. Não criar banco ou tabela para histórico de chat.
2. Não criar SSE, chunked responses ou streaming de tokens.
3. Não usar `llm-router` para escolher modelo automaticamente.
4. Não expandir payload com parâmetros de geração não requisitados.
5. Não alterar seleção de modelos preferidos, catálogo ou sync.

---

## Estratégia de testes

### Serviço

Cobrir:

- resolve provider dono a partir do catálogo existente;
- falha com `MODEL_NOT_FOUND` quando não há match;
- falha com `MODEL_AMBIGUOUS` quando há mais de um match;
- falha com `PROVIDER_NOT_FOUND` quando o catálogo aponta para provider ausente;
- chama `adapter.chat(modelId, messages)` com o provider correto;
- mapeia indisponibilidade de conexão para `PROVIDER_UNREACHABLE`;
- mapeia erro upstream para `UPSTREAM_CHAT_FAILED`.

### Rota

Cobrir:

- `POST /api/providers/chat` com sucesso retornando `{ message: { role: 'assistant', content } }`;
- `400` para payload inválido;
- `404 MODEL_NOT_FOUND`;
- `409 MODEL_AMBIGUOUS`;
- `404 PROVIDER_NOT_FOUND`;
- `503 PROVIDER_UNREACHABLE`;
- `502 UPSTREAM_CHAT_FAILED`.

### Verificação final

- `core/kernel && npx tsc --noEmit`
- suíte Vitest relevante do módulo de providers

---

## Decisões arquiteturais finais

1. **Rota em `/api/providers/chat`** para manter ownership no módulo já existente.
2. **Contrato mínimo fixo** para alinhar exatamente com o frontend chat console.
3. **Resolução por catálogo persistido** para permitir que o frontend envie apenas `modelId`.
4. **Falha explícita em modelo ambíguo** para evitar roteamento arbitrário incorreto.
5. **Extensão mínima de `ProviderAdapter` com `chat()`** em vez de criar novo subsistema.
6. **Sem fallback fake para chat**; somente respostas reais ou erro explícito.
