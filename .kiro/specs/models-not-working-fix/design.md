# Design Técnico — models-not-working-fix

## Visão Geral

Este bugfix resolve dois pontos necessários para destravar o backend:

1. corrigir a definição de duplicidade no fluxo de criação de provider, de modo que a rejeição aconteça apenas quando houver duplicidade exata por `(normalizedName, type)`
2. corrigir os 7 erros de TypeScript no arquivo `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`

O bloqueador descoberto durante a implementação é que a solução não pode ficar restrita ao `ProviderOrchestratorService`. A regra atual de unicidade por `name` está refletida no contrato de repositório, no repositório em memória, no repositório PostgreSQL e no schema. Portanto, o design mínimo correto precisa alinhar toda essa cadeia ao mesmo critério `(name, type)`.

Não há mudança de contrato de rota, não há mudança de payload/resposta e não há alteração em frontend ou em outras áreas do backend.

---

## Causa Raiz

### 1. Criação de provider falhando indevidamente

O sintoma reportado como "models not working" não começa no catálogo nem na UI. Ele começa antes, quando a criação do provider falha com `Provider already exists`.

Pela investigação atualizada, a regra incorreta não está apenas no serviço:

- o fluxo de criação considera `name` como chave principal de duplicidade
- o repositório em memória indexa providers apenas por `name`
- a persistência PostgreSQL/schema mantém unicidade por `name`

Isso significa que permitir mesmo `normalizedName` com `type` diferente exige alinhar o lookup e a restrição persistida para `(name, type)`.

### 2. `tsc --noEmit` bloqueado por erros em teste

O arquivo `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts` contém dois grupos de erro:

- fixtures de `ModuleRegistryRecord` incompatíveis com o tipo atual por ausência de `state`
- uso de `pattern` em constraints que não aceitam essa propriedade

Enquanto esses erros existirem, o backend não fecha uma compilação TypeScript limpa.

---

## Arquivos afetados

| Arquivo | Objetivo |
|---|---|
| `core/kernel/src/modules/providers/services/providerOrchestratorService.ts` | Ajustar o fluxo de criação para usar a regra correta de duplicidade |
| `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts` | Alinhar o contrato do repositório ao critério `(name, type)` |
| `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts` | Alinhar consulta e persistência PostgreSQL à regra `(name, type)` |
| `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts` | Alinhar indexação e lookup em memória à regra `(name, type)` |
| `core/kernel/src/store/schema.ts` | Trocar a unicidade de `providers.name` por unicidade composta `(name, type)` |
| arquivos de migração existentes do backend, se necessários | Refletir a alteração de unicidade conforme o workflow do projeto |
| `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts` | Corrigir fixtures e constraints inválidas para zerar erros de TypeScript |

---

## Abordagem de Implementação

### 1. Alinhar a regra de duplicidade entre serviço, contrato e armazenamento

O ajuste deve ser feito no fluxo atual de criação de provider, sem mudar a rota `POST /api/providers` e sem alterar a forma do erro de duplicidade já exposta hoje.

#### Estratégia

1. Manter a normalização de nome já existente no serviço.
2. Ajustar o contrato de repositório para suportar verificação consistente de duplicidade exata por `(normalizedName, type)`.
3. Ajustar as implementações `memory` e `postgres` para que lookup e persistência permitam mesmo `normalizedName` com `type` diferente.
4. Ajustar o serviço para usar a capacidade correta do repositório, sem depender de uma checagem ambígua por nome isolado.

#### Diretriz de contrato

O design não força um nome específico de método, mas exige que o contrato final do repositório permita responder corretamente à pergunta de negócio: "já existe provider com este `normalizedName` e este `type`?".

Exemplos aceitáveis:

- método específico como `findByNameAndType(name, type)`
- método de existência equivalente, desde que preserve o comportamento atual do restante do fluxo

Não é aceitável manter uma verificação baseada apenas em `name` e tentar corrigir o problema apenas no service layer.

#### Pseudocódigo ilustrativo

```typescript
// providerOrchestratorService.ts
async createProvider(config: ProviderConfig): Promise<Provider> {
  const normalizedName = (config.name || config.type).trim().toLowerCase();

  const exactDuplicate = await this.repository.findByNameAndType(
    normalizedName,
    config.type
  );

  if (exactDuplicate) {
    throw new Error('Provider already exists');
  }

  // restante do fluxo atual permanece igual
}
```

> O nome exato do método pode variar, mas a semântica não.

---

### 2. Alinhar unicidade persistida no PostgreSQL/schema

O schema atual define unicidade apenas em `providers.name`. Isso contradiz a regra funcional desejada.

#### Estratégia

1. Remover a unicidade isolada por `name` no schema de providers.
2. Substituir essa restrição por unicidade composta em `(name, type)`.
3. Se o projeto exigir migração explícita para refletir essa mudança, incluir a atualização de migração necessária dentro deste mesmo bugfix.

#### Resultado esperado

- duas entradas com mesmo `name` e mesmo `type` continuam inválidas
- duas entradas com mesmo `name` e `type` diferente passam a ser válidas
- memória e PostgreSQL passam a se comportar da mesma forma

---

### 3. Ajuste específico do repositório em memória

O repositório em memória hoje indexa providers apenas por `name`. Isso precisa ser alterado para deixar de colidir casos válidos com `type` diferente.

#### Estratégia

1. Trocar a chave/indexação para refletir `(name, type)` ou estrutura equivalente.
2. Garantir que operações de lookup e persistência usem essa mesma regra.
3. Não expandir o escopo para recursos extras de cache, limpeza ou redesign estrutural.

---

### 4. Ajuste específico do repositório PostgreSQL

O repositório PostgreSQL deve consultar e persistir seguindo a mesma semântica da unicidade composta.

#### Estratégia

1. Atualizar a operação de lookup usada pelo fluxo de criação para considerar `name` e `type` juntos.
2. Manter o restante do comportamento do repositório inalterado, salvo o necessário para suportar o novo critério.
3. Não alterar contratos públicos de API; o ajuste é interno ao backend.

---

### 5. Correção do teste `lifecycleOrchestrator.test.ts`

O arquivo deve ser ajustado somente para voltar a respeitar os tipos já definidos no código atual.

#### 5.1 Adicionar `state` nos fixtures de `ModuleRegistryRecord`

Todos os objetos usados como `ModuleRegistryRecord` devem incluir a propriedade `state` com um valor compatível com o tipo exigido hoje.

Exemplo ilustrativo:

```typescript
const record: ModuleRegistryRecord = {
  id: 'module-a',
  // ...demais campos já existentes...
  state: 'enabled'
};
```

> O valor exato de `state` deve seguir o tipo/import já existente no arquivo; não inventar novos enums, helpers ou tipos.

#### 5.2 Remover uso inválido de `pattern` em `StringConstraints`

Os builders/fixtures faker-like que hoje passam `{ pattern: ... }` para `StringConstraints` devem ser ajustados para usar apenas propriedades suportadas pelo tipo atual.

Exemplo ilustrativo:

```typescript
// antes
someStringFactory({ pattern: /abc/ });

// depois
someStringFactory({ minLength: 3, maxLength: 12 });
```

> O ajuste deve reaproveitar opções já aceitas pela tipagem atual do helper em uso no próprio teste. Não introduzir utilitários novos.

---

## Impacto no Contrato

Nenhuma mudança de contrato HTTP.

- `POST /api/providers` continua com o mesmo payload
- respostas continuam com a mesma forma
- a única diferença externa esperada é o comportamento correto da rejeição de duplicidade

---

## Fora de Escopo

- frontend
- OAuth
- sync de providers
- catálogo de modelos
- delete flow
- logging
- qualquer refactor não exigido para alinhar a unicidade a `(name, type)`

---

## Verificação

### Compilação obrigatória

Executar no backend:

```bash
cd core/kernel && npx tsc --noEmit
```

Resultado esperado:

- zero erros de TypeScript relacionados a `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`
- nenhuma regressão de tipagem introduzida por ajustes em serviço, contrato, repositórios e schema/migração

### Testes relevantes

Executar apenas testes backend existentes relevantes para:

1. criação de provider, incluindo cenário de duplicidade exata
2. persistência/repositórios impactados, incluindo o caso de mesmo nome com `type` diferente
3. `lifecycleOrchestrator.test.ts` ou suíte diretamente relacionada, caso exista no fluxo atual

Não adicionar testes frontend, não expandir para OAuth, delete ou outras áreas não cobertas por este spec.
