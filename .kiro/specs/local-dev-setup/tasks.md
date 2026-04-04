# Plano de Implementação: local-dev-setup

## Visão Geral

Reorganização do ambiente de desenvolvimento para rodar kernel e frontend diretamente no host com hot-reload, mantendo apenas PostgreSQL e Redis no Docker. As mudanças são cirúrgicas: novo arquivo de infra Docker, atualização de variáveis de ambiente, leitura de `OLLAMA_BASE_URL` via env, substituição de `console.warn` por Pino na factory de repositório, script `dev` no `package.json`, testes de verificação local e documentação.

## Tasks

- [x] 1. Criar `docker-compose.infra.yml` na raiz do projeto
  - Criar o arquivo `/docker-compose.infra.yml` com os serviços `postgres` (imagem `postgres:16`, container `andromeda-postgres-dev`, credenciais `andromeda/andromeda/andromeda`, porta `5432:5432`, volume `postgres_dev_data`, healthcheck com `pg_isready -U andromeda -d andromeda`) e `redis` (imagem `redis:7-alpine`, container `andromeda-redis-dev`, porta `6379:6379`, healthcheck com `redis-cli ping`)
  - Ambos os serviços devem ter `restart: unless-stopped`
  - Declarar o volume `postgres_dev_data` na seção `volumes:` do arquivo
  - NÃO modificar `docker-compose.yml` nem `docker-compose.prod.yml`
  - _Requisitos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [x] 2. Atualizar variáveis de ambiente do kernel
  - [x] 2.1 Atualizar `core/kernel/.env` garantindo que as seguintes variáveis existam com estes valores exatos (preservar variáveis existentes não listadas):
    - `PORT=4000`
    - `DATABASE_URL=postgres://andromeda:andromeda@localhost:5432/andromeda`
    - `REDIS_URL=redis://localhost:6379`
    - `PROVIDER_REPOSITORY_MODE=auto`
    - `OLLAMA_BASE_URL=http://127.0.0.1:11434`
    - `NODE_ENV=development`
    - `PG_REQUIRED=false`
  - [ ] 2.2 Atualizar `core/kernel/.env.example` com todas as variáveis documentadas com comentários explicativos. O arquivo deve conter exatamente:
    ```
    # Porta do servidor HTTP do kernel
    PORT=4000

    # URL de conexão com o PostgreSQL
    # Desenvolvimento local: postgres://andromeda:andromeda@localhost:5432/andromeda
    DATABASE_URL=postgres://andromeda:andromeda@localhost:5432/andromeda

    # URL de conexão com o Redis
    REDIS_URL=redis://localhost:6379

    # Modo do repositório de providers: auto | memory | postgres
    # auto: usa PostgreSQL se disponível, senão in-memory
    # memory: sempre in-memory (útil para testes sem banco)
    # postgres: sempre PostgreSQL (falha se banco indisponível)
    PROVIDER_REPOSITORY_MODE=auto

    # URL base do Ollama (LLM local)
    OLLAMA_BASE_URL=http://127.0.0.1:11434

    # Ambiente de execução
    NODE_ENV=development

    # Se true, o kernel falha na inicialização caso o PostgreSQL não esteja acessível
    PG_REQUIRED=false
    ```
  - _Requisitos: 2.1, 2.2, 2.3_

- [x] 3. Atualizar `ollama.adapter.ts` para ler `OLLAMA_BASE_URL` da env
  - Arquivo: `core/kernel/src/modules/providers/infrastructure/adapters/ollama.adapter.ts`
  - Alterar a linha de resolução do `base` de:
    ```typescript
    const base = baseUrl ?? DEFAULT_BASE_URL;
    ```
    para:
    ```typescript
    const base = baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;
    ```
  - Manter a constante `DEFAULT_BASE_URL = 'http://127.0.0.1:11434'` inalterada
  - Manter o export `ollamaAdapter` (backward-compatible) inalterado — ele chama `ollamaAdapterFactory()` sem argumentos, o que já aciona a leitura da env var
  - Nenhuma outra alteração no arquivo
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 3.1 Escrever property tests para resolução de `baseUrl` do Ollama adapter
    - Arquivo: `core/kernel/src/modules/providers/infrastructure/adapters/__tests__/ollama.adapter.property.test.ts`
    - Usar `fast-check` para gerar URLs arbitrárias válidas
    - **Propriedade 1: Argumento explícito tem precedência sobre env var**
      - Para qualquer URL passada como `baseUrl` explícito para `ollamaAdapterFactory`, o adapter deve usar essa URL nas requisições, independentemente de `process.env.OLLAMA_BASE_URL`
      - Mock de `fetch` para capturar a URL usada na requisição
      - Tag: `// Feature: local-dev-setup, Property 1: Resolução de baseUrl do Ollama adapter`
      - **Valida: Requisito 3.3**
    - **Propriedade 2: Fallback para env var quando sem argumento explícito**
      - Para qualquer valor válido de `process.env.OLLAMA_BASE_URL`, ao instanciar `ollamaAdapterFactory` sem `baseUrl`, o adapter deve usar o valor da env var
      - Tag: `// Feature: local-dev-setup, Property 2: Fallback de OLLAMA_BASE_URL para env var`
      - **Valida: Requisito 3.1**
    - Mínimo 100 iterações por propriedade (`numRuns: 100`)

- [x] 4. Atualizar `provider.repository.factory.ts` para usar logger Pino
  - Arquivo: `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.factory.ts`
  - Adicionar import do Pino no topo do arquivo: `import pino from 'pino';`
  - Criar logger nomeado logo após os imports: `const log = pino({ name: 'providers:factory' });`
  - Substituir `console.warn('[providers] PostgreSQL unavailable, using in-memory repository fallback.')` por `log.warn('PostgreSQL indisponível, usando repositório in-memory como fallback')`
  - Adicionar `log.info({ mode: 'memory' }, 'Repositório de providers inicializado')` após `cachedRepository = memoryRepository` no bloco `shouldPreferMemory`
  - Adicionar `log.info({ mode: 'postgres' }, 'Repositório de providers inicializado')` após `cachedRepository = postgresRepository` no bloco de sucesso do try
  - Adicionar `log.info({ mode: 'memory' }, 'Repositório de providers inicializado')` após `cachedRepository = memoryRepository` no bloco catch (fallback)
  - Nenhuma outra alteração na lógica existente
  - _Requisitos: 5.3, 5.4_

  - [ ]* 4.1 Escrever property test para log do modo de repositório selecionado
    - Arquivo: `core/kernel/src/modules/providers/infrastructure/repositories/__tests__/provider.repository.factory.property.test.ts`
    - **Propriedade 4: Log do modo de repositório selecionado**
      - Para qualquer modo de repositório selecionado (`postgres` ou `memory`), o logger Pino com nome `providers:factory` deve emitir uma mensagem de nível `info` contendo o campo `mode` com o valor correspondente
      - Mock de `ProviderRepositoryPostgres.initialize()` para controlar sucesso/falha
      - Capturar chamadas ao logger via spy
      - Tag: `// Feature: local-dev-setup, Property 4: Log do modo de repositório selecionado`
      - **Valida: Requisito 5.4**
    - Mínimo 100 iterações

- [x] 5. Adicionar script `dev` no `package.json` do kernel
  - Arquivo: `core/kernel/package.json`
  - Adicionar o script `"dev": "tsx --watch src/index.ts"` na seção `scripts`, sem remover nenhum script existente
  - O script deve ser adicionado como primeiro item da seção `scripts` para facilitar descoberta
  - Verificar que `tsx` já está listado em `devDependencies` (já está na versão `^4.21.0`) — não instalar novamente
  - _Requisitos: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Checkpoint — verificar compilação TypeScript
  - Rodar `cd core/kernel && npx tsc --noEmit` para confirmar que não há erros de tipo após as alterações nos arquivos `ollama.adapter.ts` e `provider.repository.factory.ts`
  - Garantir que todos os tests pass, ask the user if questions arise.

- [x] 7. Criar testes de verificação do ambiente local
  - Arquivo: `core/kernel/src/__tests__/integration/local-env.test.ts`
  - Importar `describe`, `it`, `expect`, `beforeAll`, `afterAll` do `vitest`
  - Importar `Client` de `pg`
  - Importar `resetProviderRepositoryFactory` e `getProviderRepository` de `../../modules/providers/infrastructure/repositories/provider.repository.factory.js`
  - Definir `isCI = process.env.CI === 'true'` e usar `describe.skipIf(isCI)` no bloco principal
  - Bloco `describe('PostgreSQL')`:
    - `beforeAll`: instanciar `Client` com `DATABASE_URL` do ambiente (fallback: `postgres://andromeda:andromeda@localhost:5432/andromeda`)
    - `afterAll`: chamar `client.end()` com `.catch(() => {})`
    - Teste "deve conectar ao PostgreSQL via DATABASE_URL": chamar `client.connect()` e verificar que não lança erro
    - Teste "deve persistir provider entre restarts da factory": setar `PROVIDER_REPOSITORY_MODE=postgres`, chamar `resetProviderRepositoryFactory()`, criar provider via `repo.create()`, chamar `resetProviderRepositoryFactory()` novamente, obter nova instância, verificar que `findById` retorna o provider criado; fazer cleanup resetando `PROVIDER_REPOSITORY_MODE=auto`
  - Bloco `describe('Ollama')`:
    - Teste "deve conectar ao Ollama via OLLAMA_BASE_URL": fazer `fetch` para `${OLLAMA_BASE_URL}/api/tags`, se `null` lançar erro descritivo com instrução de como iniciar o Ollama, verificar `res.status === 200`
    - Teste "deve listar ao menos um modelo no Ollama": verificar que `json.models` é array com `length >= 1`
  - Todos os erros de conexão devem ser capturados e relançados com mensagem descritiva indicando o serviço e como iniciá-lo
  - _Requisitos: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 8. Criar `docs/local-dev.md`
  - Criar o arquivo `docs/local-dev.md` com o seguinte conteúdo completo:
    - Título: "Desenvolvimento Local — Andromeda SO"
    - Seção de pré-requisitos: Node.js 20+, Docker Desktop, Ollama em `localhost:11434` com link para instalação, comando `ollama pull llama3.2`
    - Tabela de portas: Kernel 4000, Frontend 5173, PostgreSQL 5432, Redis 6379, Ollama 11434
    - Seção "Passo a passo" com 4 passos numerados:
      1. `docker-compose -f docker-compose.infra.yml up -d` + verificação com `docker-compose -f docker-compose.infra.yml ps`
      2. `cd core/kernel && npm run migrate`
      3. `cd core/kernel && npm run dev`
      4. Em outro terminal: `cd frontend && npm run dev`
    - Seção "Variáveis de ambiente" com instrução de copiar `.env.example` e tabela documentando todas as 7 variáveis (`DATABASE_URL`, `REDIS_URL`, `PROVIDER_REPOSITORY_MODE`, `OLLAMA_BASE_URL`, `PORT`, `NODE_ENV`, `PG_REQUIRED`) com valores padrão e descrições
    - Seção "Verificar se o ambiente está funcionando": `cd core/kernel && npm run test -- local-env`
    - Seção "Resetar o banco de desenvolvimento": sequência `down -v`, `up -d`, `migrate`
    - Seção "Diferença entre ambientes": tabela comparando desenvolvimento local vs produção (kernel, frontend, PostgreSQL, Redis, arquivo Compose)
  - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 9. Checkpoint final — verificar que tudo funciona
  - Confirmar que `docker-compose.infra.yml` existe na raiz e é válido (estrutura YAML correta, serviços `postgres` e `redis` presentes)
  - Confirmar que `core/kernel/.env` contém todas as 7 variáveis listadas no Requisito 2.1
  - Confirmar que `core/kernel/package.json` contém o script `"dev"` e todos os scripts anteriores ainda existem
  - Confirmar que `core/kernel/src/modules/providers/infrastructure/adapters/ollama.adapter.ts` contém `process.env.OLLAMA_BASE_URL` na linha de resolução do `base`
  - Confirmar que `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.factory.ts` não contém mais `console.warn` e importa `pino`
  - Confirmar que `core/kernel/src/__tests__/integration/local-env.test.ts` existe
  - Confirmar que `docs/local-dev.md` existe
  - Rodar `cd core/kernel && npx tsc --noEmit` — deve passar sem erros
  - Ensure all tests pass, ask the user if questions arise.

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para MVP mais rápido
- Os testes de integração em `local-env.test.ts` são skippados automaticamente em CI (`CI=true`) — rodar manualmente com infraestrutura ativa
- O `docker-compose.infra.yml` é independente do `docker-compose.prod.yml` — nunca modificar o arquivo de produção
- O script `dev` usa `tsx --watch` que já está disponível em `devDependencies` — não requer instalação adicional
- Imports locais em TypeScript ESM devem usar extensão `.js` (ex: `from './provider.repository.factory.js'`)
