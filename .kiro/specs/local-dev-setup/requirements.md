# Documento de Requisitos

## Introdução

Esta feature reorganiza o ambiente de desenvolvimento do Andromeda SO para que o kernel (Node.js/Fastify) e o frontend (React/Vite) rodem diretamente no terminal do host, enquanto apenas PostgreSQL e Redis continuam no Docker. O Ollama já roda localmente no host em `localhost:11434`. O objetivo é eliminar a sobrecarga do Docker para os serviços Node.js, habilitar hot-reload nativo via `tsx --watch`, e garantir que providers, catálogos e benchmarks persistam entre restarts do kernel via PostgreSQL.

## Glossário

- **Kernel**: Serviço backend Node.js/Fastify localizado em `core/kernel/`
- **Frontend**: Aplicação React/Vite localizada em `frontend/`
- **Infra Docker**: Conjunto mínimo de serviços Docker necessários para desenvolvimento local (PostgreSQL + Redis)
- **docker-compose.infra.yml**: Novo arquivo Docker Compose exclusivo para infraestrutura de desenvolvimento local
- **docker-compose.prod.yml**: Arquivo Docker Compose existente para deploy em produção — não deve ser alterado
- **PROVIDER_REPOSITORY_MODE**: Variável de ambiente que controla qual repositório de providers é usado (`auto`, `memory`, `postgres`)
- **Modo auto**: Quando `PROVIDER_REPOSITORY_MODE=auto`, o sistema usa PostgreSQL se `DATABASE_URL` estiver disponível e acessível, caso contrário usa in-memory
- **Ollama**: Serviço de LLM local que roda no host em `localhost:11434`
- **OLLAMA_BASE_URL**: Variável de ambiente que define o endereço base do Ollama
- **tsx**: Ferramenta para executar TypeScript diretamente com suporte a hot-reload via `--watch`
- **Provider**: Entidade que representa um provedor de LLM (ex: Ollama, OpenAI) registrado no kernel
- **Catálogo**: Lista de modelos disponíveis associada a um provider
- **Benchmark**: Resultado de teste de performance associado a um provider

---

## Requisitos

### Requisito 1: Arquivo de Infraestrutura Docker para Desenvolvimento Local

**User Story:** Como desenvolvedor, quero subir apenas PostgreSQL e Redis via Docker, para que eu possa rodar kernel e frontend diretamente no terminal sem overhead de containers Node.js.

#### Critérios de Aceitação

1. THE Sistema SHALL criar o arquivo `docker-compose.infra.yml` na raiz do projeto contendo exclusivamente os serviços `postgres` e `redis`.
2. WHEN o serviço `postgres` for iniciado via `docker-compose.infra.yml`, THE Sistema SHALL expor a porta `5432` do container na porta `5432` do host.
3. WHEN o serviço `redis` for iniciado via `docker-compose.infra.yml`, THE Sistema SHALL expor a porta `6379` do container na porta `6379` do host.
4. THE `postgres` no `docker-compose.infra.yml` SHALL usar as credenciais `POSTGRES_USER=andromeda`, `POSTGRES_PASSWORD=andromeda`, `POSTGRES_DB=andromeda`.
5. THE `postgres` no `docker-compose.infra.yml` SHALL persistir dados em um volume Docker nomeado `postgres_dev_data`.
6. THE `redis` no `docker-compose.infra.yml` SHALL usar a imagem `redis:7-alpine`.
7. THE `postgres` no `docker-compose.infra.yml` SHALL incluir healthcheck com `pg_isready -U andromeda -d andromeda`.
8. THE Sistema SHALL manter o arquivo `docker-compose.prod.yml` existente sem nenhuma alteração.

---

### Requisito 2: Configuração do Ambiente Local do Kernel

**User Story:** Como desenvolvedor, quero que o kernel leia variáveis de ambiente corretas para desenvolvimento local, para que ele conecte ao PostgreSQL e Redis rodando no Docker e ao Ollama rodando no host.

#### Critérios de Aceitação

1. THE Sistema SHALL garantir que o arquivo `core/kernel/.env` contenha as seguintes variáveis com os valores especificados:
   - `DATABASE_URL=postgres://andromeda:andromeda@localhost:5432/andromeda`
   - `REDIS_URL=redis://localhost:6379`
   - `PROVIDER_REPOSITORY_MODE=auto`
   - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
   - `PORT=4000`
   - `NODE_ENV=development`
2. THE Sistema SHALL garantir que o arquivo `core/kernel/.env.example` reflita todas as variáveis do `.env` com valores de exemplo adequados para desenvolvimento local.
3. IF o arquivo `core/kernel/.env` já existir, THEN THE Sistema SHALL atualizar as variáveis listadas no critério 1 sem remover variáveis existentes não listadas.

---

### Requisito 3: Leitura de OLLAMA_BASE_URL pelo Adapter Ollama

**User Story:** Como desenvolvedor, quero que o adapter Ollama leia o endereço base da variável de ambiente `OLLAMA_BASE_URL`, para que eu possa configurar o endereço do Ollama sem alterar código.

#### Critérios de Aceitação

1. WHEN o adapter Ollama for instanciado sem `baseUrl` explícito, THE Adapter_Ollama SHALL ler o valor de `process.env.OLLAMA_BASE_URL` como endereço base.
2. IF `process.env.OLLAMA_BASE_URL` não estiver definida, THEN THE Adapter_Ollama SHALL usar `http://127.0.0.1:11434` como valor padrão.
3. WHEN `baseUrl` for passado explicitamente como argumento para a factory, THE Adapter_Ollama SHALL usar o argumento em vez da variável de ambiente.
4. THE Adapter_Ollama SHALL manter compatibilidade com o export `ollamaAdapter` existente (backward-compatible export).

---

### Requisito 4: Script de Desenvolvimento com Hot-Reload

**User Story:** Como desenvolvedor, quero um script `dev` no `package.json` do kernel que use `tsx --watch` para hot-reload, para que alterações no código sejam refletidas automaticamente sem reiniciar manualmente.

#### Critérios de Aceitação

1. THE `package.json` do kernel SHALL conter um script `dev` com o comando `tsx --watch src/index.ts`.
2. WHEN o script `dev` for executado, THE Kernel SHALL reiniciar automaticamente ao detectar alterações em arquivos `.ts` dentro de `src/`.
3. THE script `dev` SHALL carregar variáveis de ambiente do arquivo `core/kernel/.env` automaticamente via `dotenv` já configurado no `src/index.ts`.
4. THE `package.json` do kernel SHALL manter todos os scripts existentes (`build`, `start`, `start:local`, `start:fixed`, `test`, `migrate`, etc.) sem remoção.

---

### Requisito 5: Persistência de Providers via PostgreSQL no Modo Auto

**User Story:** Como desenvolvedor, quero que providers, catálogos e benchmarks persistam entre restarts do kernel, para que eu não precise recadastrá-los toda vez que reiniciar o serviço.

#### Critérios de Aceitação

1. WHEN `PROVIDER_REPOSITORY_MODE=auto` e `DATABASE_URL` apontar para um PostgreSQL acessível, THE Provider_Repository_Factory SHALL selecionar o repositório PostgreSQL.
2. WHEN o kernel for reiniciado com PostgreSQL disponível e `PROVIDER_REPOSITORY_MODE=auto`, THE Provider_Repository_Factory SHALL recuperar todos os providers previamente cadastrados.
3. IF o PostgreSQL não estiver acessível durante a inicialização com `PROVIDER_REPOSITORY_MODE=auto`, THEN THE Provider_Repository_Factory SHALL fazer fallback para o repositório in-memory e registrar um aviso via logger Pino.
4. THE Provider_Repository_Factory SHALL logar o modo de repositório selecionado (`postgres` ou `memory`) durante a inicialização usando logger Pino com nome `providers:factory`.
5. WHEN `PROVIDER_REPOSITORY_MODE=postgres` e o PostgreSQL não estiver acessível, THEN THE Provider_Repository_Factory SHALL lançar um erro e impedir a inicialização do kernel.

---

### Requisito 6: Testes de Verificação do Ambiente Local

**User Story:** Como desenvolvedor, quero executar testes que verifiquem se o ambiente local está funcionando corretamente, para que eu possa confirmar que PostgreSQL, Redis e Ollama estão acessíveis e operacionais.

#### Critérios de Aceitação

1. THE Sistema SHALL criar um arquivo de testes em `core/kernel/src/__tests__/integration/local-env.test.ts` com os seguintes testes:
   - Teste de conexão com PostgreSQL via `DATABASE_URL`
   - Teste de persistência de provider (criar provider, simular restart via reset da factory, verificar que o provider ainda existe)
   - Teste de conexão com Ollama via `OLLAMA_BASE_URL`
   - Teste de listagem de modelos reais do Ollama
2. WHEN o teste de conexão com PostgreSQL for executado, THE Teste SHALL conectar ao banco usando `DATABASE_URL` do ambiente e verificar que a conexão é estabelecida com sucesso.
3. WHEN o teste de persistência de provider for executado, THE Teste SHALL criar um provider via repositório PostgreSQL, chamar `resetProviderRepositoryFactory()`, obter nova instância do repositório, e verificar que o provider criado ainda existe.
4. WHEN o teste de conexão com Ollama for executado, THE Teste SHALL fazer uma requisição HTTP para `${OLLAMA_BASE_URL}/api/tags` e verificar que a resposta tem status 200.
5. WHEN o teste de listagem de modelos do Ollama for executado, THE Teste SHALL verificar que a resposta contém um array `models` com pelo menos um elemento.
6. THE arquivo de testes SHALL incluir um bloco `describe` nomeado `'Local Environment Verification'` com `skip` automático quando `NODE_ENV=test` e `CI=true`, para evitar falhas em pipelines sem infraestrutura local.
7. IF qualquer serviço não estiver acessível durante os testes, THEN THE Teste SHALL falhar com mensagem de erro descritiva indicando qual serviço não está disponível e como iniciá-lo.

---

### Requisito 7: Documentação do Fluxo de Desenvolvimento Local

**User Story:** Como desenvolvedor, quero instruções claras de como subir o ambiente de desenvolvimento local, para que eu possa iniciar o projeto rapidamente sem consultar múltiplos arquivos.

#### Critérios de Aceitação

1. THE Sistema SHALL criar ou atualizar o arquivo `docs/local-dev.md` com instruções completas para subir o ambiente de desenvolvimento local.
2. THE `docs/local-dev.md` SHALL documentar o comando para subir a infraestrutura Docker: `docker-compose -f docker-compose.infra.yml up -d`.
3. THE `docs/local-dev.md` SHALL documentar o comando para rodar as migrations do banco: `cd core/kernel && npm run migrate`.
4. THE `docs/local-dev.md` SHALL documentar o comando para iniciar o kernel com hot-reload: `cd core/kernel && npm run dev`.
5. THE `docs/local-dev.md` SHALL documentar o comando para iniciar o frontend: `cd frontend && npm run dev`.
6. THE `docs/local-dev.md` SHALL documentar os pré-requisitos: Node.js 20, Docker, Ollama rodando em `localhost:11434`.
7. THE `docs/local-dev.md` SHALL documentar as portas utilizadas: kernel em `4000`, frontend em `5173`, PostgreSQL em `5432`, Redis em `6379`, Ollama em `11434`.
8. THE `docs/local-dev.md` SHALL documentar como executar os testes de verificação do ambiente: `cd core/kernel && npm run test -- local-env`.
