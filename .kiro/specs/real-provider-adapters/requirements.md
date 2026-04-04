# Documento de Requisitos

## Introdução

Esta feature substitui os adapters mock de providers LLM no `andromeda-core-kernel` por implementações reais que realizam chamadas HTTP às APIs dos respectivos providers. Os adapters afetados são: OpenAI, Anthropic, Groq e Ollama. Cada adapter expõe dois métodos — `listModels()` e `ping()` — e deve degradar graciosamente para dados de seed quando a API key estiver ausente ou a requisição falhar.

## Glossário

- **Adapter**: Módulo TypeScript responsável por encapsular a comunicação HTTP com a API de um provider LLM específico.
- **Provider**: Entidade que representa um serviço LLM configurado no sistema (ex: OpenAI, Anthropic, Groq, Ollama).
- **ProviderOrchestratorService**: Serviço central que coordena os adapters via mapa `{ openai, anthropic, ollama, groq }`.
- **ModelCatalogItem**: Tipo TypeScript que representa um modelo LLM no catálogo interno do sistema.
- **apiKeyEnc**: Campo da entidade `Provider` que armazena a API key codificada em base64.
- **baseUrl**: Campo da entidade `Provider` que armazena a URL base do provider (usado principalmente pelo Ollama).
- **Seed Data**: Dados estáticos de fallback definidos em `providerCatalog.ts`, retornados quando a API real não está disponível.
- **Factory Function**: Função que recebe `apiKey?` e `baseUrl?` como parâmetros e retorna uma instância do adapter configurada.
- **Ping**: Operação de verificação de saúde que mede a latência real de uma requisição ao provider.
- **Graceful Degradation**: Comportamento de fallback para seed data quando a API key está ausente ou a requisição falha.

---

## Requisitos

### Requisito 1: Contrato de Factory Function dos Adapters

**User Story:** Como desenvolvedor do kernel, quero que cada adapter seja criado via factory function parametrizada, para que o `ProviderOrchestratorService` possa injetar a API key e baseUrl decodificadas em tempo de execução.

#### Critérios de Aceitação

1. THE Adapter SHALL expor uma factory function que aceita os parâmetros opcionais `apiKey?: string` e `baseUrl?: string`.
2. THE Adapter SHALL retornar um objeto com os métodos `listModels()` e `ping()` ao ser instanciado pela factory function.
3. WHEN o `ProviderOrchestratorService` instanciar um adapter, THE ProviderOrchestratorService SHALL decodificar o campo `provider.apiKeyEnc` de base64 para string UTF-8 antes de passá-lo à factory function.
4. THE ProviderOrchestratorService SHALL passar o campo `provider.baseUrl` diretamente à factory function sem transformação.

---

### Requisito 2: Adapter OpenAI — Listagem de Modelos

**User Story:** Como usuário do sistema, quero que o adapter OpenAI liste os modelos reais disponíveis na minha conta, para que o catálogo reflita os modelos que posso efetivamente utilizar.

#### Critérios de Aceitação

1. WHEN `listModels()` for invocado e a `apiKey` estiver configurada, THE OpenAI_Adapter SHALL realizar uma requisição GET para `https://api.openai.com/v1/models` com o header `Authorization: Bearer {apiKey}`.
2. WHEN a requisição retornar com sucesso, THE OpenAI_Adapter SHALL filtrar os modelos retornados, incluindo apenas aqueles cujo `id` contenha os prefixos `gpt-` ou `o1` ou `o3` ou `o4`, excluindo modelos de embedding, tts, whisper e dall-e.
3. WHEN a requisição retornar com sucesso, THE OpenAI_Adapter SHALL mapear cada modelo da resposta da API para o tipo `ModelCatalogItem`, preenchendo `modelId` com o campo `id` da API e `displayName` com o campo `id` da API.
4. IF a `apiKey` não estiver configurada, THEN THE OpenAI_Adapter SHALL retornar os dados de seed via `listSeedModels('openai')` sem realizar chamada HTTP.
5. IF a requisição HTTP falhar por qualquer motivo, THEN THE OpenAI_Adapter SHALL capturar o erro, registrar um log de aviso, e retornar os dados de seed via `listSeedModels('openai')`.

---

### Requisito 3: Adapter OpenAI — Ping

**User Story:** Como operador do sistema, quero que o health check do OpenAI meça a latência real da API, para que o status de saúde do provider reflita condições reais de conectividade.

#### Critérios de Aceitação

1. WHEN `ping()` for invocado e a `apiKey` estiver configurada, THE OpenAI_Adapter SHALL realizar uma requisição GET para `https://api.openai.com/v1/models` com timeout de 3000ms.
2. WHEN a requisição completar dentro do timeout, THE OpenAI_Adapter SHALL retornar `{ ok: true, latencyMs: N }` onde `N` é o tempo decorrido em milissegundos desde o início da requisição.
3. IF a requisição exceder 3000ms ou falhar, THEN THE OpenAI_Adapter SHALL retornar `{ ok: false, latencyMs: 3000 }`.
4. IF a `apiKey` não estiver configurada, THEN THE OpenAI_Adapter SHALL retornar os dados de seed de ping sem realizar chamada HTTP.

---

### Requisito 4: Adapter Anthropic — Listagem de Modelos

**User Story:** Como usuário do sistema, quero que o adapter Anthropic liste os modelos reais disponíveis, para que o catálogo reflita os modelos Claude efetivamente acessíveis.

#### Critérios de Aceitação

1. WHEN `listModels()` for invocado e a `apiKey` estiver configurada, THE Anthropic_Adapter SHALL realizar uma requisição GET para `https://api.anthropic.com/v1/models` com os headers `x-api-key: {apiKey}` e `anthropic-version: 2023-06-01`.
2. WHEN a requisição retornar com sucesso, THE Anthropic_Adapter SHALL mapear cada modelo da resposta para o tipo `ModelCatalogItem`, preenchendo `modelId` com o campo `id` da API e `displayName` com o campo `display_name` da API.
3. IF a `apiKey` não estiver configurada, THEN THE Anthropic_Adapter SHALL retornar os dados de seed via `listSeedModels('anthropic')` sem realizar chamada HTTP.
4. IF a requisição HTTP falhar por qualquer motivo, THEN THE Anthropic_Adapter SHALL capturar o erro, registrar um log de aviso, e retornar os dados de seed via `listSeedModels('anthropic')`.

---

### Requisito 5: Adapter Anthropic — Ping

**User Story:** Como operador do sistema, quero que o health check do Anthropic meça a latência real da API, para que o status de saúde reflita condições reais de conectividade.

#### Critérios de Aceitação

1. WHEN `ping()` for invocado e a `apiKey` estiver configurada, THE Anthropic_Adapter SHALL realizar uma requisição GET para `https://api.anthropic.com/v1/models` com os headers `x-api-key: {apiKey}`, `anthropic-version: 2023-06-01` e timeout de 3000ms.
2. WHEN a requisição completar dentro do timeout, THE Anthropic_Adapter SHALL retornar `{ ok: true, latencyMs: N }` onde `N` é o tempo decorrido em milissegundos.
3. IF a requisição exceder 3000ms ou falhar, THEN THE Anthropic_Adapter SHALL retornar `{ ok: false, latencyMs: 3000 }`.
4. IF a `apiKey` não estiver configurada, THEN THE Anthropic_Adapter SHALL retornar os dados de seed de ping sem realizar chamada HTTP.

---

### Requisito 6: Adapter Groq — Listagem de Modelos

**User Story:** Como usuário do sistema, quero que o adapter Groq liste os modelos reais disponíveis via API compatível com OpenAI, para que o catálogo reflita os modelos Groq efetivamente acessíveis.

#### Critérios de Aceitação

1. WHEN `listModels()` for invocado e a `apiKey` estiver configurada, THE Groq_Adapter SHALL realizar uma requisição GET para `https://api.groq.com/openai/v1/models` com o header `Authorization: Bearer {apiKey}`.
2. WHEN a requisição retornar com sucesso, THE Groq_Adapter SHALL mapear cada modelo da resposta para o tipo `ModelCatalogItem`, preenchendo `modelId` com o campo `id` da API e `displayName` com o campo `id` da API.
3. IF a `apiKey` não estiver configurada, THEN THE Groq_Adapter SHALL retornar os dados de seed via `listSeedModels('groq')` sem realizar chamada HTTP.
4. IF a requisição HTTP falhar por qualquer motivo, THEN THE Groq_Adapter SHALL capturar o erro, registrar um log de aviso, e retornar os dados de seed via `listSeedModels('groq')`.

---

### Requisito 7: Adapter Groq — Ping

**User Story:** Como operador do sistema, quero que o health check do Groq meça a latência real da API, para que o status de saúde reflita condições reais de conectividade.

#### Critérios de Aceitação

1. WHEN `ping()` for invocado e a `apiKey` estiver configurada, THE Groq_Adapter SHALL realizar uma requisição GET para `https://api.groq.com/openai/v1/models` com timeout de 3000ms.
2. WHEN a requisição completar dentro do timeout, THE Groq_Adapter SHALL retornar `{ ok: true, latencyMs: N }` onde `N` é o tempo decorrido em milissegundos.
3. IF a requisição exceder 3000ms ou falhar, THEN THE Groq_Adapter SHALL retornar `{ ok: false, latencyMs: 3000 }`.
4. IF a `apiKey` não estiver configurada, THEN THE Groq_Adapter SHALL retornar os dados de seed de ping sem realizar chamada HTTP.

---

### Requisito 8: Adapter Ollama — Listagem de Modelos

**User Story:** Como usuário do sistema, quero que o adapter Ollama liste os modelos instalados localmente via API do Ollama, para que o catálogo reflita os modelos disponíveis na instância local.

#### Critérios de Aceitação

1. WHEN `listModels()` for invocado, THE Ollama_Adapter SHALL realizar uma requisição GET para `{baseUrl}/api/tags`, onde `baseUrl` tem valor padrão `http://localhost:11434` quando não configurado.
2. WHEN a requisição retornar com sucesso, THE Ollama_Adapter SHALL mapear cada modelo do array `models` da resposta para o tipo `ModelCatalogItem`, preenchendo `modelId` com o campo `name` e `displayName` com o campo `name`.
3. THE Ollama_Adapter SHALL realizar a requisição sem headers de autenticação.
4. IF a requisição HTTP falhar por qualquer motivo (incluindo Ollama não estar em execução), THEN THE Ollama_Adapter SHALL capturar o erro, registrar um log de aviso, e retornar os dados de seed via `listSeedModels('ollama')`.

---

### Requisito 9: Adapter Ollama — Ping

**User Story:** Como operador do sistema, quero que o health check do Ollama meça a latência real da instância local, para que o status de saúde reflita se o serviço Ollama está em execução e responsivo.

#### Critérios de Aceitação

1. WHEN `ping()` for invocado, THE Ollama_Adapter SHALL realizar uma requisição GET para `{baseUrl}/api/tags` com timeout de 3000ms.
2. WHEN a requisição completar dentro do timeout, THE Ollama_Adapter SHALL retornar `{ ok: true, latencyMs: N }` onde `N` é o tempo decorrido em milissegundos.
3. IF a requisição exceder 3000ms ou falhar, THEN THE Ollama_Adapter SHALL retornar `{ ok: false, latencyMs: 3000 }`.

---

### Requisito 10: Integração com ProviderOrchestratorService

**User Story:** Como desenvolvedor do kernel, quero que o `ProviderOrchestratorService` instancie os adapters com as credenciais do provider em tempo de execução, para que cada chamada use a API key correta do provider configurado.

#### Critérios de Aceitação

1. WHEN `syncModels(providerIdOrName)` for invocado, THE ProviderOrchestratorService SHALL instanciar o adapter do provider via factory function, passando a `apiKey` decodificada de `provider.apiKeyEnc` e o `provider.baseUrl`.
2. WHEN `healthCheck(providerIdOrName)` for invocado, THE ProviderOrchestratorService SHALL instanciar o adapter do provider via factory function com as credenciais do provider antes de invocar `ping()`.
3. THE ProviderOrchestratorService SHALL decodificar `provider.apiKeyEnc` usando `Buffer.from(apiKeyEnc, 'base64').toString('utf-8')` antes de passar ao adapter.
4. IF `provider.apiKeyEnc` for `undefined`, THEN THE ProviderOrchestratorService SHALL passar `undefined` como `apiKey` para a factory function.

---

### Requisito 11: Mapeamento para ModelCatalogItem

**User Story:** Como desenvolvedor do kernel, quero que os adapters mapeiem as respostas das APIs para o tipo `ModelCatalogItem` com valores padrão sensatos, para que o catálogo interno seja consistente independentemente do provider.

#### Critérios de Aceitação

1. WHEN um adapter mapear um modelo da API para `ModelCatalogItem`, THE Adapter SHALL preencher os campos `contextWindow`, `capabilities`, `priceLabel`, `score` e `latencyMs` com valores padrão quando a API não retornar esses dados.
2. THE Adapter SHALL usar `'unknown'` como valor padrão para `contextWindow` quando não disponível na resposta da API.
3. THE Adapter SHALL usar `['chat']` como valor padrão para `capabilities` quando não disponível na resposta da API.
4. THE Adapter SHALL usar `'N/A'` como valor padrão para `priceLabel` quando não disponível na resposta da API.
5. THE Adapter SHALL usar `0` como valor padrão para `score` quando não disponível na resposta da API.
6. THE Adapter SHALL usar `0` como valor padrão para `latencyMs` quando não disponível na resposta da API.

---

### Requisito 12: Testes dos Adapters Reais

**User Story:** Como desenvolvedor do kernel, quero que os adapters reais sejam cobertos por testes unitários com mocks HTTP, para que o comportamento de fallback e mapeamento seja verificável sem dependências externas.

#### Critérios de Aceitação

1. THE Test_Suite SHALL cobrir o comportamento de fallback para seed data quando a `apiKey` está ausente em cada adapter (OpenAI, Anthropic, Groq).
2. THE Test_Suite SHALL cobrir o comportamento de fallback para seed data quando a requisição HTTP falha em cada adapter.
3. THE Test_Suite SHALL cobrir o mapeamento correto da resposta da API para `ModelCatalogItem` em cada adapter.
4. THE Test_Suite SHALL cobrir o retorno de `{ ok: false, latencyMs: 3000 }` quando o ping excede o timeout.
5. THE Test_Suite SHALL cobrir o comportamento de fallback do Ollama quando o serviço não está em execução.
6. WHEN os testes forem executados, THE Test_Suite SHALL usar mocks de fetch/HTTP para evitar chamadas reais às APIs externas.
