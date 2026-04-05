# Plano de Implementação: real-provider-adapters

## Visão Geral

Substituir os quatro adapters mock de providers LLM (`openai`, `anthropic`, `groq`, `ollama`) por implementações reais com chamadas HTTP, factory functions parametrizadas e degradação graciosa para seed data. Atualizar o `ProviderOrchestratorService` para instanciar adapters com credenciais decodificadas em tempo de execução.

## Tarefas

- [x] 1. Criar interface `ProviderAdapter` e tipo `AdapterFactory`
  - Criar o arquivo `src/modules/providers/infrastructure/adapters/adapter.interface.ts`
  - Definir a interface `ProviderAdapter` com os métodos `listModels()` e `ping()`
  - Definir o tipo `AdapterFactory = (apiKey?: string, baseUrl?: string) => ProviderAdapter`
  - _Requisitos: 1.1, 1.2_

- [x] 2. Implementar utilitários HTTP compartilhados
  - [x] 2.1 Criar `src/modules/providers/infrastructure/adapters/http.utils.ts`
    - Implementar `fetchWithTimeout(url, options, timeoutMs)` usando `AbortController` nativo do Node 20
    - Implementar `pingWithTimeout(url, options, timeoutMs)` que mede latência real com `Date.now()`
    - _Requisitos: 3.1, 3.2, 3.3, 5.1, 5.2, 5.3, 7.1, 7.2, 7.3, 9.1, 9.2, 9.3_

  - [x]* 2.2 Escrever testes unitários para `http.utils.ts`
    - Testar `fetchWithTimeout`: sucesso, abort por timeout
    - Testar `pingWithTimeout`: retorna `{ ok: true, latencyMs: N }` em sucesso; retorna `{ ok: false, latencyMs: 3000 }` em timeout/falha
    - Usar `vi.stubGlobal('fetch', vi.fn())` para mockar chamadas HTTP
    - _Requisitos: 12.4_

- [x] 3. Reescrever adapter OpenAI com factory function e chamadas HTTP reais
  - [x] 3.1 Reescrever `src/modules/providers/infrastructure/adapters/openai.adapter.ts`
    - Exportar `openAiAdapterFactory` como `AdapterFactory`
    - `listModels()`: GET `https://api.openai.com/v1/models` com `Authorization: Bearer {apiKey}`; filtrar por prefixos `gpt-`, `o1`, `o3`, `o4`; mapear para `ModelCatalogItem` com valores padrão; fallback para seed se sem apiKey ou erro
    - `ping()`: usar `pingWithTimeout` com timeout de 3000ms; fallback seed se sem apiKey
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 11.1–11.6_

  - [x]* 3.2 Escrever testes unitários para `openai.adapter.ts`
    - Testar `listModels()` sem apiKey → retorna seed
    - Testar `listModels()` com falha HTTP → retorna seed
    - Testar `listModels()` com sucesso → filtra prefixos corretos e mapeia campos
    - Testar `ping()` com sucesso → `{ ok: true, latencyMs: N }`
    - Testar `ping()` com timeout → `{ ok: false, latencyMs: 3000 }`
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

  - [x]* 3.3 Escrever teste de propriedade para filtragem de modelos OpenAI
    - **Propriedade 3: Filtragem de modelos OpenAI**
    - Para qualquer lista de modelos retornada pela API, `listModels()` deve retornar apenas modelos cujo `id` começa com `gpt-`, `o1`, `o3` ou `o4`
    - Usar `fast-check` com `fc.array(fc.record({ id: fc.string() }))` e mínimo de 100 iterações
    - **Valida: Requisito 2.2**

- [x] 4. Reescrever adapter Anthropic com factory function e chamadas HTTP reais
  - [x] 4.1 Reescrever `src/modules/providers/infrastructure/adapters/anthropic.adapter.ts`
    - Exportar `anthropicAdapterFactory` como `AdapterFactory`
    - `listModels()`: GET `https://api.anthropic.com/v1/models` com headers `x-api-key` e `anthropic-version: 2023-06-01`; mapear `display_name` para `displayName`; fallback para seed se sem apiKey ou erro
    - `ping()`: usar `pingWithTimeout` com timeout de 3000ms; fallback seed se sem apiKey
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 11.1–11.6_

  - [x]* 4.2 Escrever testes unitários para `anthropic.adapter.ts`
    - Testar `listModels()` sem apiKey → retorna seed
    - Testar `listModels()` com falha HTTP → retorna seed
    - Testar `listModels()` com sucesso → mapeia `display_name` para `displayName`
    - Testar `ping()` com sucesso → `{ ok: true, latencyMs: N }`
    - Testar `ping()` com timeout → `{ ok: false, latencyMs: 3000 }`
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

- [x] 5. Reescrever adapter Groq com factory function e chamadas HTTP reais
  - [x] 5.1 Reescrever `src/modules/providers/infrastructure/adapters/groq.adapter.ts`
    - Exportar `groqAdapterFactory` como `AdapterFactory`
    - `listModels()`: GET `https://api.groq.com/openai/v1/models` com `Authorization: Bearer {apiKey}`; mapear para `ModelCatalogItem` com valores padrão; fallback para seed se sem apiKey ou erro
    - `ping()`: usar `pingWithTimeout` com timeout de 3000ms; fallback seed se sem apiKey
    - _Requisitos: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 7.4, 11.1–11.6_

  - [x]* 5.2 Escrever testes unitários para `groq.adapter.ts`
    - Testar `listModels()` sem apiKey → retorna seed
    - Testar `listModels()` com falha HTTP → retorna seed
    - Testar `listModels()` com sucesso → mapeia campos corretamente
    - Testar `ping()` com sucesso → `{ ok: true, latencyMs: N }`
    - Testar `ping()` com timeout → `{ ok: false, latencyMs: 3000 }`
    - _Requisitos: 12.1, 12.2, 12.3, 12.4_

- [x] 6. Reescrever adapter Ollama com factory function e chamadas HTTP reais
  - [x] 6.1 Reescrever `src/modules/providers/infrastructure/adapters/ollama.adapter.ts`
    - Exportar `ollamaAdapterFactory` como `AdapterFactory`
    - `baseUrl` padrão: `http://localhost:11434` quando não configurado
    - `listModels()`: GET `{baseUrl}/api/tags` sem headers de autenticação; mapear array `models[].name` para `modelId` e `displayName`; fallback para seed em qualquer erro (incluindo `ECONNREFUSED`)
    - `ping()`: usar `pingWithTimeout` para `{baseUrl}/api/tags` com timeout de 3000ms
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 11.1–11.6_

  - [x]* 6.2 Escrever testes unitários para `ollama.adapter.ts`
    - Testar `listModels()` com falha HTTP (Ollama não em execução) → retorna seed
    - Testar `listModels()` com sucesso → mapeia `name` para `modelId` e `displayName`
    - Testar `ping()` com sucesso → `{ ok: true, latencyMs: N }`
    - Testar `ping()` com timeout → `{ ok: false, latencyMs: 3000 }`
    - Testar URL dinâmica: requisições usam `baseUrl` configurado, não URL hardcoded
    - _Requisitos: 12.2, 12.3, 12.4, 12.5_

  - [x]* 6.3 Escrever teste de propriedade para URL dinâmica do Ollama
    - **Propriedade 8: URL dinâmica do Ollama**
    - Para qualquer `baseUrl` configurada, `listModels()` e `ping()` devem realizar requisições para `{baseUrl}/api/tags`
    - Usar `fast-check` com `fc.webUrl()` e verificar a URL capturada pelo mock de fetch
    - **Valida: Requisito 8.1**

- [x] 7. Checkpoint — verificar compilação e testes dos adapters
  - Garantir que todos os testes dos adapters passam, perguntar ao usuário se houver dúvidas.

- [x] 8. Atualizar `ProviderOrchestratorService` para usar factories com credenciais
  - [x] 8.1 Modificar `src/modules/providers/services/providerOrchestratorService.ts`
    - Substituir o mapa estático `adapters` por `adapterFactories: Partial<Record<ProviderType, AdapterFactory>>`
    - Implementar a função auxiliar `decodeApiKey(apiKeyEnc?: string): string | undefined` usando `Buffer.from(enc, 'base64').toString('utf-8')`
    - Em `syncModels()`: instanciar adapter via factory passando `decodeApiKey(provider.apiKeyEnc)` e `provider.baseUrl`
    - Em `healthCheck()`: instanciar adapter via factory com as mesmas credenciais
    - Manter `defaultAdapter` para providers sem factory registrada
    - _Requisitos: 1.3, 1.4, 10.1, 10.2, 10.3, 10.4_

  - [x]* 8.2 Escrever teste de propriedade para round-trip de decodificação base64
    - **Propriedade 2: Round-trip de decodificação base64**
    - Para qualquer string UTF-8 usada como API key, codificar em base64 e decodificar deve retornar a string original
    - Usar `fast-check` com `fc.string()` e verificar `decodeApiKey(Buffer.from(s).toString('base64')) === s`
    - **Valida: Requisitos 1.3, 10.3**

- [x] 9. Atualizar `providerOrchestrator.test.ts` para cobrir integração com factories
  - [x] 9.1 Adicionar testes de integração de factory em `src/modules/providers/__tests__/providerOrchestrator.test.ts`
    - Testar que `syncModels()` com provider que tem `apiKeyEnc` passa a apiKey decodificada à factory (usar `vi.stubGlobal('fetch', ...)`)
    - Testar que `healthCheck()` usa factory com credenciais corretas do provider
    - Testar que provider sem `apiKeyEnc` passa `undefined` como apiKey à factory
    - Atualizar testes existentes de `healthCheck()` que dependem de latências fixas dos mocks antigos
    - _Requisitos: 10.1, 10.2, 10.3, 10.4_

  - [x]* 9.2 Escrever teste de propriedade para instanciação com credenciais corretas
    - **Propriedade 9: Instanciação com credenciais corretas no serviço**
    - Para qualquer provider com `apiKeyEnc` definido, `syncModels()` e `healthCheck()` devem passar a apiKey decodificada e o `baseUrl` sem transformação à factory
    - **Valida: Requisitos 10.1, 10.2, 10.4**

- [x] 10. Checkpoint final — garantir que todos os testes passam
  - Executar `npm run test` em `core/kernel/` e confirmar que todos os testes passam.
  - Garantir que não há erros de compilação TypeScript.
  - Perguntar ao usuário se houver dúvidas.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Os adapters usam `fetch` nativo do Node 20 — sem dependências adicionais de HTTP
- Testes de propriedade usam `fast-check` com mínimo de 100 iterações por propriedade
- Todos os erros de fallback são registrados com `pino` no nível `warn` com o objeto de erro
