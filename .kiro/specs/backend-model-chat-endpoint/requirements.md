# Documento de Requisitos — Backend Model Chat Endpoint

## Introdução

Esta spec define o **pré-requisito backend mínimo** necessário para desbloquear `.kiro/specs/frontend-chat-console/`. Hoje o repositório já possui catálogo de providers, sync de modelos, health checks, seleção de modelos e endpoints de routing/benchmark, mas **não expõe uma rota real de chat** que receba `modelId + messages` e devolva uma resposta do assistente.

O objetivo é adicionar apenas o necessário para o frontend conversar com um **modelo já sincronizado**. Esta spec **não** expande provider management, router UI, benchmark, streaming, tools, persistência de histórico ou qualquer outro fluxo além do envio síncrono de mensagens para um modelo selecionado.

---

## Glossário

- **Model chat endpoint**: rota HTTP do kernel que recebe `modelId` e histórico de mensagens e retorna uma única mensagem do assistente.
- **Modelo sincronizado**: item já presente no catálogo persistido do provider em `core/kernel/src/modules/providers/`.
- **Provider dono do modelo**: provider resolvido a partir do catálogo que contém o `modelId` solicitado.
- **Chat completion**: operação de inferência síncrona, sem streaming, que devolve apenas a próxima mensagem do assistente.

---

## Requisitos

### Requisito 1: Rota backend real para chat por modelo selecionado

**User Story:** Como frontend chat console, quero enviar `modelId + messages` para o kernel, para obter uma resposta real do assistente sem depender de comportamento falso.

#### Critérios de Aceitação

1. THE backend SHALL expor uma rota HTTP real para chat em `POST /api/providers/chat`.
2. THE rota SHALL aceitar um `modelId` de modelo já sincronizado e uma lista ordenada de mensagens da conversa atual.
3. THE rota SHALL retornar exatamente uma nova mensagem do assistente quando a inferência for concluída com sucesso.
4. THE rota SHALL existir especificamente para desbloquear `.kiro/specs/frontend-chat-console/`.
5. THE implementação SHALL NOT reutilizar `/api/llm-router/infer`, `/api/llm-router/benchmark` ou qualquer endpoint simulado existente como substituto desta rota.

---

### Requisito 2: Contrato exato de request/response

**User Story:** Como frontend chat console, quero um contrato estável e mínimo, para integrar o envio de mensagens sem lógica adicional de provider management.

#### Critérios de Aceitação

1. THE request body SHALL seguir exatamente o formato:

```json
{
  "modelId": "string",
  "messages": [
    {
      "role": "user | assistant",
      "content": "string"
    }
  ]
}
```

2. THE campo `modelId` SHALL ser obrigatório e SHALL ser string não-vazia.
3. THE campo `messages` SHALL ser obrigatório e SHALL ser um array com pelo menos uma mensagem.
4. THE campo `role` SHALL aceitar apenas `user` e `assistant`.
5. THE campo `content` SHALL ser string não-vazia após `trim()`.
6. THE response body de sucesso SHALL seguir exatamente o formato:

```json
{
  "message": {
    "role": "assistant",
    "content": "string"
  }
}
```

7. THE rota SHALL NOT exigir `providerId`, `conversationId`, `stream`, `temperature`, `tools`, `attachments` ou qualquer outro campo fora do contrato mínimo acima.

---

### Requisito 3: Resolução do provider dono a partir do `modelId`

**User Story:** Como backend, quero descobrir automaticamente qual provider possui o modelo solicitado, para que o frontend continue trabalhando apenas com `modelId`.

#### Critérios de Aceitação

1. THE implementação SHALL reutilizar o catálogo existente persistido por provider para localizar o `modelId` solicitado.
2. THE implementação SHALL reutilizar a lógica existente de lookup de provider no módulo `core/kernel/src/modules/providers/` em vez de criar um novo subsistema de catálogo.
3. IF nenhum catálogo contiver o `modelId`, THEN a rota SHALL responder erro de modelo não encontrado.
4. IF o catálogo apontar para um `providerId` inexistente, THEN a rota SHALL responder erro de provider ausente.
5. IF mais de um provider sincronizado contiver o mesmo `modelId`, THEN a rota SHALL falhar explicitamente com erro de modelo ambíguo em vez de escolher um provider arbitrariamente.

---

### Requisito 4: Seam mínimo para chat completion nos adapters

**User Story:** Como backend, quero uma extensão mínima da abstração de adapter, para executar chat completion real sem expandir o escopo de providers.

#### Critérios de Aceitação

1. THE backend SHALL adicionar ao `ProviderAdapter` um método mínimo de chat completion, ou seam equivalente de mesmo escopo, capaz de receber `modelId + messages` e retornar apenas a próxima mensagem do assistente.
2. THE nova seam SHALL permanecer dentro do módulo de providers existente.
3. THE nova seam SHALL ser limitada ao caso de uso síncrono do frontend chat console.
4. THE nova seam SHALL NOT incluir streaming, tools, multimodalidade, histórico persistido ou parâmetros avançados de tuning.

---

### Requisito 5: Tratamento seguro de erros

**User Story:** Como operador, quero erros previsíveis e amigáveis, para entender falhas de envio sem comportamento indefinido.

#### Critérios de Aceitação

1. IF o payload for inválido, THEN a rota SHALL responder `400` com código `INVALID_CHAT_PAYLOAD`.
2. IF o `modelId` não for encontrado em nenhum catálogo, THEN a rota SHALL responder `404` com código `MODEL_NOT_FOUND`.
3. IF o `modelId` estiver duplicado entre providers sincronizados, THEN a rota SHALL responder `409` com código `MODEL_AMBIGUOUS`.
4. IF o provider resolvido não existir mais no repositório, THEN a rota SHALL responder `404` com código `PROVIDER_NOT_FOUND`.
5. IF o provider resolvido estiver indisponível, offline ou não alcançável, THEN a rota SHALL responder `503` com código `PROVIDER_UNREACHABLE`.
6. IF a chamada upstream falhar após alcançar o provider, THEN a rota SHALL responder `502` com código `UPSTREAM_CHAT_FAILED`.
7. THE payload de erro SHALL incluir pelo menos `{ error: string, code: string }`.
8. THE implementação SHALL registrar falhas com logger estruturado do módulo sem vazar secrets, tokens ou conteúdo sensível além do necessário.

---

### Requisito 6: Escopo intencionalmente mínimo

**User Story:** Como time técnico, queremos desbloquear apenas o chat console, para evitar que esta entrega cresça para iniciativas paralelas.

#### Critérios de Aceitação

1. THE implementação SHALL NOT adicionar criação, edição, exclusão, autenticação ou sync manual de providers.
2. THE implementação SHALL NOT alterar router intelligence, benchmark, rankings ou decisões do `llm-router`.
3. THE implementação SHALL NOT adicionar streaming de tokens.
4. THE implementação SHALL NOT persistir histórico de chat em banco, cache, arquivo ou memória compartilhada entre requests.
5. THE implementação SHALL NOT introduzir múltiplas conversas, sessões de conversa, upload de arquivos, imagens, voz, tools ou tool-calling.
6. THE implementação SHALL NOT expandir o contrato do frontend chat console além de `modelId + messages -> assistant message`.

---

### Requisito 7: Testes obrigatórios antes da implementação

**User Story:** Como time técnico, queremos seguir SDD/TDD, para validar o contrato e os erros antes de escrever a implementação.

#### Critérios de Aceitação

1. THE implementação SHALL começar por testes automatizados falhando para serviço e rota antes do código de produção.
2. THE suíte de testes SHALL cobrir pelo menos:
   - sucesso do chat com retorno de mensagem do assistente;
   - validação de payload inválido;
   - `MODEL_NOT_FOUND`;
   - `MODEL_AMBIGUOUS`;
   - `PROVIDER_NOT_FOUND`;
   - `PROVIDER_UNREACHABLE`;
   - `UPSTREAM_CHAT_FAILED`.
3. THE testes de serviço SHALL validar a resolução do provider dono via catálogo existente.
4. THE testes de rota SHALL validar status codes e contrato JSON exatos.
5. THE verificação final SHALL incluir `npx tsc --noEmit` em `core/kernel/` e a suíte Vitest relevante do backend.

---

## Restrições de Escopo

### Dentro do escopo

- Rota `POST /api/providers/chat`
- Contrato mínimo de request/response
- Resolução do provider dono a partir do catálogo existente
- Extensão mínima do adapter para chat completion
- Tratamento explícito de erros operacionais
- Testes de serviço e rota para o fluxo de chat

### Fora do escopo

- Provider management
- Sync de modelos
- Router UI ou benchmark
- Streaming
- Persistência de histórico
- Sessões de conversa
- Tool calling
- Uploads, imagens, áudio, voz ou multimodalidade
