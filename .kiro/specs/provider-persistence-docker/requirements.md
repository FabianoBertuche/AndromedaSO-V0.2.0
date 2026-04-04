# Documento de Requisitos

## Introdução

Este documento descreve os requisitos para corrigir dois problemas de configuração do ambiente Docker no projeto `andromeda-core-kernel`:

1. **Persistência de providers**: O repositório de providers usa armazenamento em memória por padrão no container Docker de produção, causando perda de todos os dados (providers, catálogos e benchmarks) a cada reinicialização do container. A implementação PostgreSQL já existe e precisa ser ativada corretamente via variável de ambiente.

2. **Conectividade do adapter Ollama no Docker**: O adapter Ollama usa `127.0.0.1` como URL base padrão, o que dentro de um container Docker aponta para o próprio container e não para o host. No Windows com Docker Desktop, o host é acessível via `host.docker.internal`, e o adapter precisa detectar esse ambiente automaticamente.

## Glossário

- **Kernel**: Serviço backend principal (`andromeda-kernel-prod`) que gerencia o ciclo de vida dos módulos e providers.
- **Provider_Repository**: Componente responsável por persistir e recuperar dados de providers, catálogos de modelos e benchmarks.
- **Provider_Repository_Factory**: Componente (`provider.repository.factory.ts`) que seleciona a implementação do repositório (memória ou PostgreSQL) com base nas variáveis de ambiente.
- **Ollama_Adapter**: Componente (`ollama.adapter.ts`) que realiza chamadas HTTP à instância do Ollama para listar modelos disponíveis.
- **DATABASE_URL**: Variável de ambiente que contém a string de conexão PostgreSQL usada pelo Kernel.
- **PROVIDER_REPOSITORY_MODE**: Variável de ambiente que controla qual implementação do repositório é usada (`memory`, `postgres` ou `auto`).
- **OLLAMA_BASE_URL**: Variável de ambiente que sobrescreve a URL base padrão do Ollama_Adapter.
- **host.docker.internal**: Hostname especial do Docker Desktop (Windows/Mac) que resolve para o endereço IP do host a partir de dentro de um container.
- **Seed Data**: Dados estáticos de fallback usados pelo Ollama_Adapter quando a instância real do Ollama não está acessível.

## Requisitos

### Requisito 1: Ativar repositório PostgreSQL no container de produção

**User Story:** Como operador do sistema, quero que os providers cadastrados sobrevivam a reinicializações do container Docker, para que não seja necessário recadastrar providers manualmente após cada deploy ou reinício.

#### Critérios de Aceitação

1. WHEN o container `andromeda-kernel-prod` inicializa com `DATABASE_URL` definida e `PROVIDER_REPOSITORY_MODE=postgres`, THE Provider_Repository_Factory SHALL instanciar o `ProviderRepositoryPostgres` em vez do repositório em memória.

2. WHEN o `ProviderRepositoryPostgres` é instanciado com uma `DATABASE_URL` válida, THE Provider_Repository_Factory SHALL chamar `initialize()` para garantir que as tabelas necessárias existam antes de aceitar requisições.

3. WHEN o container `andromeda-kernel-prod` reinicia com o mesmo volume PostgreSQL, THE Provider_Repository SHALL retornar todos os providers, catálogos e benchmarks previamente persistidos.

4. IF a conexão com o PostgreSQL falhar durante a inicialização e `PROVIDER_REPOSITORY_MODE` for `auto`, THEN THE Provider_Repository_Factory SHALL registrar um aviso via logger Pino e continuar operando com o repositório em memória como fallback.

5. IF a conexão com o PostgreSQL falhar durante a inicialização e `PROVIDER_REPOSITORY_MODE` for `postgres`, THEN THE Provider_Repository_Factory SHALL lançar o erro e encerrar a inicialização do serviço.

6. THE `docker-compose.prod.yml` SHALL definir `PROVIDER_REPOSITORY_MODE=postgres` na seção `environment` do serviço `kernel`.

7. THE `docker-compose.prod.yml` SHALL definir `DATABASE_URL=postgres://andromeda:prodkey@postgres:5432/andromeda` na seção `environment` do serviço `kernel`, garantindo que o hostname `postgres` resolva para o container PostgreSQL interno.

### Requisito 2: Configurar URL base do Ollama para ambiente Docker

**User Story:** Como operador do sistema, quero que o adapter Ollama consiga se conectar à instância do Ollama rodando no host Windows a partir de dentro do container Docker, para que os modelos reais sejam listados em vez dos dados de seed estáticos.

#### Critérios de Aceitação

1. WHEN a variável de ambiente `OLLAMA_BASE_URL` está definida, THE Ollama_Adapter SHALL usar o valor de `OLLAMA_BASE_URL` como URL base para todas as chamadas HTTP ao Ollama.

2. WHEN `OLLAMA_BASE_URL` não está definida e `NODE_ENV` é `production`, THE Ollama_Adapter SHALL usar `http://host.docker.internal:11434` como URL base padrão.

3. WHEN `OLLAMA_BASE_URL` não está definida e `NODE_ENV` não é `production`, THE Ollama_Adapter SHALL usar `http://127.0.0.1:11434` como URL base padrão, preservando o comportamento atual para desenvolvimento local.

4. WHEN o Ollama_Adapter consegue se conectar à URL base configurada e recebe uma lista de modelos válida, THE Ollama_Adapter SHALL retornar os modelos reais da instância Ollama mesclados com os modelos cloud do seed.

5. IF o Ollama_Adapter não consegue se conectar à URL base configurada dentro do timeout de 5000ms, THEN THE Ollama_Adapter SHALL registrar um aviso via logger Pino e retornar os dados de seed como fallback.

6. THE `docker-compose.prod.yml` SHALL definir `OLLAMA_BASE_URL=http://host.docker.internal:11434` na seção `environment` do serviço `kernel`, permitindo sobrescrever o padrão quando necessário.

7. WHERE o operador precisa apontar para uma instância Ollama em endereço customizado, THE Ollama_Adapter SHALL aceitar qualquer URL HTTP válida fornecida via `OLLAMA_BASE_URL` sem validação de hostname.

### Requisito 3: Documentar variáveis de ambiente de produção

**User Story:** Como desenvolvedor, quero que o arquivo `.env.prod.example` reflita todas as variáveis necessárias para o ambiente Docker de produção, para que novos deploys sejam configurados corretamente desde o início.

#### Critérios de Aceitação

1. THE `.env.prod.example` SHALL conter a variável `PROVIDER_REPOSITORY_MODE` com valor de exemplo `postgres` e comentário explicativo.

2. THE `.env.prod.example` SHALL conter a variável `OLLAMA_BASE_URL` com valor de exemplo `http://host.docker.internal:11434` e comentário explicativo sobre o uso no Docker Desktop (Windows/Mac).

3. THE `.env.prod.example` SHALL manter todas as variáveis existentes sem remoção ou alteração de valores padrão já documentados.
