# Documento de Requisitos — provider-auth-rules

## Introdução

O formulário de cadastro de providers LLM no Andromeda SO atualmente usa uma função `getAuthMode` que distingue apenas três casos: OpenAI (oauth + api-key), Ollama/LMStudio/vLLM (sem autenticação) e todos os demais (api-key). Com a expansão para 20 tipos de providers, cada um com regras de autenticação distintas, o formulário precisa ser atualizado para exibir os campos corretos, placeholders adequados, tooltips com links de obtenção de credenciais e suporte a credenciais especiais (como AWS Bedrock com dois campos separados).

## Glossário

- **Formulário**: Componente React `ModelProviders.tsx` responsável pelo cadastro de providers LLM.
- **Provider**: Serviço de LLM externo ou local configurado pelo usuário (ex: OpenAI, Anthropic, Ollama).
- **ProviderType**: Tipo discriminado TypeScript com os 20 valores possíveis de provider.
- **AuthMode**: Modo de autenticação de um provider — `none`, `api-key`, `api-key-baseurl`, `oauth-apikey`, `aws-credentials`.
- **AuthConfig**: Objeto que descreve as regras de autenticação de um provider específico (modo, placeholder, visibilidade do baseUrl, tooltip).
- **getAuthConfig**: Função que substitui `getAuthMode`, retornando um `AuthConfig` completo para cada `ProviderType`.
- **BaseUrl**: URL base do endpoint do provider (ex: `http://127.0.0.1:11434` para Ollama).
- **AccessKeyId**: Identificador de chave de acesso da AWS (campo separado para `aws-bedrock`).
- **SecretAccessKey**: Chave secreta de acesso da AWS (campo separado para `aws-bedrock`).
- **Tooltip**: Elemento de UI que exibe uma dica com link para onde o usuário pode obter as credenciais do provider.
- **PKCE**: Proof Key for Code Exchange — extensão do OAuth 2.0 já implementada para OpenAI.
- **OAuth**: Fluxo de autenticação delegada via OAuth 2.0, suportado por OpenAI e Google.

---

## Requisitos

### Requisito 1: Mapeamento de autenticação por provider

**User Story:** Como desenvolvedor, quero que o formulário identifique corretamente o modo de autenticação de cada provider, para que os campos exibidos sejam sempre adequados ao provider selecionado.

#### Critérios de Aceitação

1. THE `getAuthConfig` SHALL retornar `AuthMode` igual a `none` para os providers `ollama`, `lmstudio` e `vllm`.
2. THE `getAuthConfig` SHALL retornar `AuthMode` igual a `api-key` para os providers `anthropic`, `groq`, `mistral`, `together`, `fireworks`, `deepinfra`, `novita`, `openrouter`, `hyperbolic`, `replicate`, `cohere` e `xai`.
3. THE `getAuthConfig` SHALL retornar `AuthMode` igual a `api-key-baseurl` para os providers `azure-openai` e `google-vertex`.
4. THE `getAuthConfig` SHALL retornar `AuthMode` igual a `oauth-apikey` para os providers `openai` e `google`.
5. THE `getAuthConfig` SHALL retornar `AuthMode` igual a `aws-credentials` para o provider `aws-bedrock`.
6. WHEN um `ProviderType` não reconhecido for passado para `getAuthConfig`, THE `getAuthConfig` SHALL retornar `AuthMode` igual a `api-key` como fallback seguro.

---

### Requisito 2: Exibição condicional dos campos do formulário

**User Story:** Como usuário, quero ver apenas os campos relevantes para o provider selecionado, para que o formulário não exiba campos desnecessários ou confusos.

#### Critérios de Aceitação

1. WHEN o `AuthMode` for `none`, THE Formulário SHALL ocultar o campo API Key e o campo baseUrl.
2. WHEN o `AuthMode` for `api-key`, THE Formulário SHALL exibir o campo API Key e ocultar o campo baseUrl.
3. WHEN o `AuthMode` for `api-key-baseurl`, THE Formulário SHALL exibir o campo API Key e o campo baseUrl, ambos obrigatórios.
4. WHEN o `AuthMode` for `oauth-apikey`, THE Formulário SHALL exibir o campo API Key e o botão de autenticação OAuth simultaneamente.
5. WHEN o `AuthMode` for `aws-credentials`, THE Formulário SHALL exibir o campo `Access Key ID` e o campo `Secret Access Key` em substituição ao campo API Key único.
6. WHEN o usuário selecionar um provider diferente, THE Formulário SHALL limpar os valores dos campos `apiKey`, `baseUrl`, `accessKeyId` e `secretAccessKey`.
7. WHILE o `AuthMode` for `none`, THE Formulário SHALL aceitar submissão sem exigir API Key ou baseUrl.
8. WHILE o `AuthMode` for `api-key-baseurl`, THE Formulário SHALL bloquear a submissão se o campo baseUrl estiver vazio.
9. WHILE o `AuthMode` for `aws-credentials`, THE Formulário SHALL bloquear a submissão se `accessKeyId` ou `secretAccessKey` estiverem vazios.

---

### Requisito 3: Placeholders específicos por provider

**User Story:** Como usuário, quero ver exemplos do formato esperado da API Key de cada provider, para que eu saiba qual credencial inserir sem precisar consultar documentação externa.

#### Critérios de Aceitação

1. WHEN o provider selecionado for `anthropic`, THE Formulário SHALL exibir o placeholder `sk-ant-...` no campo API Key.
2. WHEN o provider selecionado for `groq`, THE Formulário SHALL exibir o placeholder `gsk_...` no campo API Key.
3. WHEN o provider selecionado for `openai`, THE Formulário SHALL exibir o placeholder `sk-...` no campo API Key.
4. WHEN o provider selecionado for `openrouter`, THE Formulário SHALL exibir o placeholder `sk-or-...` no campo API Key.
5. WHEN o provider selecionado for `replicate`, THE Formulário SHALL exibir o placeholder `r8_...` no campo API Key.
6. WHEN o provider selecionado for `xai`, THE Formulário SHALL exibir o placeholder `xai-...` no campo API Key.
7. WHEN o provider selecionado for `aws-bedrock`, THE Formulário SHALL exibir o placeholder `AKIA...` no campo `Access Key ID` e o placeholder `wJalrXUtnFEMI...` no campo `Secret Access Key`.
8. WHEN o provider selecionado for `azure-openai`, THE Formulário SHALL exibir o placeholder `https://meu-recurso.openai.azure.com/` no campo baseUrl.
9. WHEN o provider selecionado não possuir um placeholder específico definido, THE Formulário SHALL exibir o placeholder genérico `API Key` no campo API Key.

---

### Requisito 4: Tooltips com links de obtenção de credenciais

**User Story:** Como usuário, quero ver uma dica com o link direto para obter as credenciais de cada provider, para que eu possa acessar a página correta sem precisar pesquisar.

#### Critérios de Aceitação

1. THE Formulário SHALL exibir um ícone de tooltip ao lado do campo de credencial para todos os providers que exigem autenticação.
2. WHEN o usuário interagir com o tooltip de um provider, THE Formulário SHALL exibir o link para a página de obtenção de credenciais daquele provider.
3. THE `getAuthConfig` SHALL incluir a propriedade `credentialUrl` com a URL da página de credenciais para cada provider que exige autenticação.
4. WHEN o `AuthMode` for `none`, THE Formulário SHALL ocultar o ícone de tooltip, pois não há credenciais a obter.
5. WHEN o usuário clicar no link do tooltip, THE Formulário SHALL abrir o link em uma nova aba do navegador.

---

### Requisito 5: Suporte a credenciais AWS Bedrock

**User Story:** Como usuário da AWS, quero inserir meu Access Key ID e Secret Access Key em campos separados, para que o sistema possa autenticar corretamente com o AWS Bedrock sem misturar as duas credenciais em um único campo.

#### Critérios de Aceitação

1. WHEN o provider selecionado for `aws-bedrock`, THE Formulário SHALL exibir dois campos de texto separados: `Access Key ID` e `Secret Access Key`.
2. WHEN o provider selecionado for `aws-bedrock`, THE Formulário SHALL ocultar o campo API Key único.
3. WHEN o formulário for submetido com provider `aws-bedrock`, THE Formulário SHALL enviar `accessKeyId` e `secretAccessKey` como campos distintos na requisição de criação do provider.
4. IF o provider for `aws-bedrock` e `accessKeyId` estiver vazio no momento da submissão, THEN THE Formulário SHALL exibir uma mensagem de erro indicando que o Access Key ID é obrigatório.
5. IF o provider for `aws-bedrock` e `secretAccessKey` estiver vazio no momento da submissão, THEN THE Formulário SHALL exibir uma mensagem de erro indicando que o Secret Access Key é obrigatório.

---

### Requisito 6: Suporte a OAuth para Google

**User Story:** Como usuário do Google Cloud, quero poder autenticar via OAuth 2.0 do Google além de usar uma API Key, para que eu tenha flexibilidade na forma de autenticação com os serviços Google.

#### Critérios de Aceitação

1. WHEN o provider selecionado for `google`, THE Formulário SHALL exibir o botão de autenticação OAuth do Google ao lado do campo API Key.
2. WHEN o usuário clicar no botão OAuth do Google, THE Formulário SHALL iniciar o fluxo de autenticação OAuth 2.0 do Google.
3. WHEN o provider selecionado for `google`, THE Formulário SHALL permitir submissão tanto com API Key quanto com token OAuth, sem exigir ambos simultaneamente.
4. WHERE a variável de ambiente `VITE_GOOGLE_CLIENT_ID` não estiver configurada, THE Formulário SHALL desabilitar o botão OAuth do Google e exibir uma mensagem indicando que a configuração está ausente.

---

### Requisito 7: BaseUrl para providers locais e self-hosted

**User Story:** Como usuário de providers locais ou self-hosted, quero que o formulário pré-preencha a baseUrl padrão e indique quando ela é obrigatória, para que eu não precise memorizar os endereços padrão de cada provider.

#### Critérios de Aceitação

1. WHEN o provider selecionado for `ollama`, THE Formulário SHALL pré-preencher o campo baseUrl com `http://127.0.0.1:11434` como valor padrão visível no placeholder.
2. WHEN o provider selecionado for `lmstudio`, THE Formulário SHALL pré-preencher o campo baseUrl com `http://localhost:1234` como valor padrão visível no placeholder.
3. WHEN o provider selecionado for `vllm`, THE Formulário SHALL exibir o campo baseUrl como obrigatório, sem valor padrão.
4. WHEN o `AuthMode` for `api-key`, THE Formulário SHALL exibir o campo baseUrl como opcional, permitindo sobrescrever o endpoint padrão do provider.
5. IF o provider for `vllm` e o campo baseUrl estiver vazio no momento da submissão, THEN THE Formulário SHALL exibir uma mensagem de erro indicando que a baseUrl é obrigatória para vllm.
