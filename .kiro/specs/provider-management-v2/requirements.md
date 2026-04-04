# Documento de Requisitos — provider-management-v2

## Introdução

Este documento descreve os requisitos para duas features relacionadas ao gerenciamento de providers LLM no Andromeda SO:

1. **Deletar Provider**: Adicionar a capacidade de remover um provider LLM cadastrado, incluindo remoção em cascata dos modelos do catálogo associados e confirmação na interface.
2. **Autenticação OpenAI com OAuth e API Key**: Estender o formulário de cadastro de providers para suportar dois modos de autenticação para a OpenAI — API Key (token) e OAuth 2.0 com PKCE — mantendo compatibilidade com os demais providers.

O sistema já possui persistência de providers via PostgreSQL com `ON DELETE CASCADE` configurado na tabela `provider_model_catalog`. O frontend é uma SPA React 18 com TailwindCSS e TanStack React Query. O backend é Fastify 4 com TypeScript ESM.

---

## Glossário

- **Provider**: Entidade que representa um serviço LLM externo (ex: OpenAI, Anthropic, Groq, Ollama) cadastrado no sistema.
- **Catálogo**: Conjunto de modelos (`provider_model_catalog`) associados a um provider.
- **API Key**: Token de autenticação estático fornecido pelo usuário (ex: `sk-...`).
- **OAuth_Flow**: Fluxo de autorização OAuth 2.0 Authorization Code com PKCE, onde o usuário autoriza o acesso via redirecionamento para o provedor de identidade.
- **PKCE**: Proof Key for Code Exchange — extensão de segurança do OAuth 2.0 que usa `code_verifier` e `code_challenge` para proteger o fluxo de autorização em clientes públicos.
- **access_token**: Token de acesso obtido ao final do fluxo OAuth, armazenado como `apiKeyEnc` em base64.
- **apiKeyEnc**: Campo da entidade Provider que armazena a chave de autenticação codificada em base64.
- **ProviderRepository**: Interface de repositório responsável pela persistência de providers e catálogos.
- **ProviderOrchestratorService**: Serviço de domínio que coordena operações sobre providers.
- **OAuthCallbackHandler**: Componente frontend responsável por processar o retorno do fluxo OAuth.
- **ProviderForm**: Componente frontend responsável pelo formulário de criação de providers.
- **DeleteConfirmationDialog**: Componente frontend de diálogo modal para confirmação de exclusão.
- **VITE_OPENAI_OAUTH_CLIENT_ID**: Variável de ambiente Vite que configura o `client_id` OAuth da OpenAI.

---

## Requisitos

### Requisito 1: Endpoint de Exclusão de Provider

**User Story:** Como administrador do sistema, quero poder deletar um provider LLM cadastrado, para que eu possa remover integrações obsoletas ou incorretas sem precisar acessar o banco de dados diretamente.

#### Critérios de Aceitação

1. WHEN uma requisição `DELETE /api/providers/:id` é recebida com um ID de provider existente, THE ProviderOrchestratorService SHALL remover o provider do repositório e retornar HTTP 204 sem corpo.
2. WHEN uma requisição `DELETE /api/providers/:id` é recebida com um ID inexistente, THE ProviderOrchestratorService SHALL retornar HTTP 404 com um objeto JSON contendo o campo `error` descrevendo o motivo.
3. WHEN um provider é deletado, THE ProviderRepository SHALL remover automaticamente todos os registros de `provider_model_catalog` associados ao provider deletado, via `ON DELETE CASCADE` já configurado no banco.
4. THE ProviderRepository SHALL expor um método `delete(id: string): Promise<void>` na interface `ProviderRepository`.
5. WHEN o método `delete` é chamado com um ID inexistente, THE ProviderRepository SHALL lançar um erro com a mensagem `"Provider not found"`.

---

### Requisito 2: Botão de Deletar com Confirmação na Interface

**User Story:** Como usuário da interface, quero ver um botão de deletar na linha de cada provider na tabela, para que eu possa remover providers diretamente pela UI com segurança.

#### Critérios de Aceitação

1. THE ProviderForm SHALL exibir um botão "Deletar" na coluna de ações de cada linha da tabela de providers.
2. WHEN o usuário clica no botão "Deletar", THE DeleteConfirmationDialog SHALL ser exibido solicitando confirmação antes de executar a exclusão.
3. WHEN o usuário confirma a exclusão no DeleteConfirmationDialog, THE ProviderForm SHALL chamar o endpoint `DELETE /api/providers/:id` e aguardar a resposta.
4. WHEN a exclusão é concluída com sucesso, THE ProviderForm SHALL invalidar a query `['providers']` do TanStack React Query para que a lista seja atualizada automaticamente.
5. WHEN o usuário cancela a exclusão no DeleteConfirmationDialog, THE DeleteConfirmationDialog SHALL ser fechado sem realizar nenhuma chamada à API.
6. WHILE uma exclusão está em andamento, THE ProviderForm SHALL desabilitar o botão "Deletar" do provider correspondente para evitar cliques duplicados.

---

### Requisito 3: Detecção Automática do Modo de Autenticação no Formulário

**User Story:** Como usuário da interface, quero que o formulário de cadastro de provider exiba automaticamente as opções de autenticação adequadas para o tipo de provider selecionado, para que eu não precise adivinhar quais campos preencher.

#### Critérios de Aceitação

1. WHEN o usuário seleciona `openai` como tipo de provider, THE ProviderForm SHALL exibir dois modos de autenticação disponíveis: "API Key" e "Login com OpenAI (OAuth)".
2. WHEN o usuário seleciona um tipo de provider diferente de `openai` e diferente de `ollama` (ex: `anthropic`, `groq`, `mistral`), THE ProviderForm SHALL exibir apenas o campo de API Key.
3. WHEN o usuário seleciona `ollama` como tipo de provider, THE ProviderForm SHALL ocultar todos os campos de autenticação, pois Ollama não requer autenticação.
4. WHEN o tipo de provider selecionado muda, THE ProviderForm SHALL redefinir o modo de autenticação selecionado e limpar os campos de credenciais preenchidos anteriormente.

---

### Requisito 4: Autenticação OpenAI via API Key

**User Story:** Como usuário da interface, quero poder cadastrar um provider OpenAI informando minha API Key diretamente, para que eu possa usar o modo de autenticação mais simples quando não quero usar OAuth.

#### Critérios de Aceitação

1. WHEN o usuário seleciona o modo "API Key" para o provider `openai` e preenche o campo com um valor não vazio, THE ProviderForm SHALL incluir o campo `apiKey` no payload enviado ao endpoint `POST /api/providers`.
2. WHEN o usuário submete o formulário com modo "API Key" para `openai`, THE ProviderOrchestratorService SHALL armazenar o valor do campo `apiKey` codificado em base64 no campo `apiKeyEnc` do provider.
3. THE ProviderOrchestratorService SHALL manter compatibilidade com o fluxo atual de criação de providers via API Key para todos os tipos de provider existentes.

---

### Requisito 5: Autenticação OpenAI via OAuth 2.0 com PKCE

**User Story:** Como usuário da interface, quero poder autenticar minha conta OpenAI via OAuth, para que eu não precise gerenciar manualmente uma API Key e possa usar minhas credenciais de conta diretamente.

#### Critérios de Aceitação

1. WHEN o usuário seleciona o modo "Login com OpenAI (OAuth)" e clica no botão correspondente, THE ProviderForm SHALL gerar um `code_verifier` aleatório com no mínimo 43 caracteres e um `code_challenge` derivado via SHA-256 (base64url), e redirecionar o navegador para `https://auth.openai.com/authorize` com os parâmetros: `response_type=code`, `client_id` (lido de `VITE_OPENAI_OAUTH_CLIENT_ID`), `redirect_uri=http://localhost:5173/oauth/callback`, `scope=openid email profile offline_access`, `code_challenge`, `code_challenge_method=S256`.
2. WHEN o navegador é redirecionado para `http://localhost:5173/oauth/callback` com o parâmetro `code` na query string, THE OAuthCallbackHandler SHALL recuperar o `code_verifier` armazenado na sessão e realizar uma requisição `POST` para `https://auth.openai.com/oauth/token` com os campos: `grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`, `code_verifier`.
3. WHEN a requisição ao endpoint de token retorna com sucesso, THE OAuthCallbackHandler SHALL extrair o `access_token` da resposta, codificá-lo em base64, e chamar o endpoint `POST /api/providers` com `type=openai`, `name=openai`, e `apiKey` contendo o `access_token` em texto plano (o backend realizará a codificação base64).
4. IF a requisição ao endpoint de token retorna um erro, THEN THE OAuthCallbackHandler SHALL exibir uma mensagem de erro descritiva ao usuário e não criar o provider.
5. IF o parâmetro `code` estiver ausente na URL de callback, THEN THE OAuthCallbackHandler SHALL exibir uma mensagem de erro indicando que a autorização foi cancelada ou falhou.
6. THE ProviderForm SHALL ler o valor de `client_id` exclusivamente da variável de ambiente `VITE_OPENAI_OAUTH_CLIENT_ID` exposta pelo Vite, sem hardcodar o valor no código-fonte.
7. WHEN o `code_verifier` é gerado, THE OAuthCallbackHandler SHALL armazená-lo no `sessionStorage` do navegador sob a chave `oauth_code_verifier` para recuperação no callback.

---

### Requisito 6: Rota de Callback OAuth no Frontend

**User Story:** Como sistema, preciso de uma rota dedicada no frontend para processar o retorno do fluxo OAuth da OpenAI, para que o código de autorização seja trocado por um token de acesso de forma segura.

#### Critérios de Aceitação

1. THE OAuthCallbackHandler SHALL ser registrado como uma rota React na URL `/oauth/callback`.
2. WHEN a rota `/oauth/callback` é acessada, THE OAuthCallbackHandler SHALL processar automaticamente os parâmetros da query string sem interação do usuário.
3. WHEN o fluxo OAuth é concluído com sucesso e o provider é criado, THE OAuthCallbackHandler SHALL redirecionar o usuário para a página de providers (`/providers` ou equivalente).
4. WHILE o OAuthCallbackHandler está processando a troca de token, THE OAuthCallbackHandler SHALL exibir um indicador de carregamento ao usuário.

---

### Requisito 7: Compatibilidade com Providers Existentes

**User Story:** Como desenvolvedor, quero garantir que as novas features não quebrem o fluxo de criação e gerenciamento de providers já existentes, para que os usuários com providers cadastrados não sejam impactados.

#### Critérios de Aceitação

1. THE ProviderOrchestratorService SHALL continuar aceitando requisições `POST /api/providers` sem o campo `apiKey` para providers que não requerem autenticação (ex: `ollama`).
2. THE ProviderOrchestratorService SHALL continuar aceitando requisições `POST /api/providers` com o campo `apiKey` para providers que usam API Key (ex: `anthropic`, `groq`, `mistral`).
3. WHEN o endpoint `DELETE /api/providers/:id` é adicionado, THE ProviderOrchestratorService SHALL manter todos os endpoints existentes (`POST /`, `GET /`, `POST /:id/sync`, `GET /:id/models`, `POST /:id/models/select`, `GET /:id/health`, `GET /:id/health/stream`) sem alterações de contrato.
