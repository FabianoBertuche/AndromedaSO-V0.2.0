# CONTEXT — models-not-working-fix

## Para o OpenCode: leia este arquivo antes de qualquer implementação

Este spec define um bugfix estritamente limitado para o sintoma visível de "models not working" no fluxo de providers.

Durante a investigação foi descoberto um bloqueador de implementação: o design anterior estava estreito demais. O problema não está apenas no service layer. Hoje, a persistência também trata `name` como único isoladamente:

- `provider.repository.postgres.ts` depende de persistência com `name` único
- `provider.repository.memory.ts` indexa providers apenas por `name`
- `core/kernel/src/store/schema.ts` define unicidade por `name`

Por isso, permitir o mesmo `normalizedName` com `type` diferente exige expandir o escopo mínimo do bugfix para serviço, contrato de repositório, repositórios concretos e schema/migração necessários.

Além disso, existem 7 erros de TypeScript no arquivo de teste `lifecycleOrchestrator.test.ts`, e eles impedem um `tsc --noEmit` limpo no backend.

---

## Arquivos do spec (ler nesta ordem)

1. `.kiro/specs/models-not-working-fix/CONTEXT.md`
2. `.kiro/specs/models-not-working-fix/requirements.md`
3. `.kiro/specs/models-not-working-fix/design.md`
4. `.kiro/specs/models-not-working-fix/tasks.md`

## Steering files obrigatórios

- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`
- `.kiro/steering/opencode-workflow.md`

---

## Escopo exato

Implementação permitida apenas para:

1. Corrigir a regra de duplicidade na criação de provider para rejeitar somente duplicados exatos por `(normalizedName, type)`.
2. Alinhar contrato de repositório e persistência para permitir mesmo `normalizedName` com `type` diferente.
3. Ajustar schema e migração existente(s), se necessários, para que a unicidade persistida passe de `name` isolado para `(name, type)`.
4. Corrigir os 7 erros de TypeScript em `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`:
   - fixtures de `ModuleRegistryRecord` sem a propriedade obrigatória `state`
   - uso inválido de `pattern` em `StringConstraints` de faker/faker-like helpers

---

## Arquivos que a implementação pode modificar

| Arquivo | Ação |
|---|---|
| `core/kernel/src/modules/providers/services/providerOrchestratorService.ts` | MODIFICAR — ajustar o fluxo de criação para usar a regra correta de duplicidade |
| `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts` | MODIFICAR — alinhar o contrato do repositório à verificação por `(name, type)` |
| `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts` | MODIFICAR — alinhar consulta/persistência ao critério `(name, type)` |
| `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts` | MODIFICAR — alinhar indexação/lookup em memória ao critério `(name, type)` |
| `core/kernel/src/store/schema.ts` | MODIFICAR — trocar a unicidade persistida de `name` para `(name, type)` |
| arquivos de migração existentes do backend, se necessários pelo workflow atual | MODIFICAR/CRIAR SOMENTE O NECESSÁRIO — refletir a mudança de unicidade para `(name, type)` |
| `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts` | MODIFICAR — corrigir fixtures e tipos inválidos do teste |

Nenhum outro arquivo deve ser criado ou modificado por este spec.

---

## Resumo objetivo da investigação

- `GET /api/providers` está funcionando.
- Sync, catálogo e endpoint de delete foram investigados/testados separadamente e não fazem parte deste bugfix.
- O sintoma visível de "models not working" ocorre porque `POST /api/providers` falha com `{"error":"Provider already exists"}`.
- O frontend compila em TypeScript e a estrutura dos hooks está correta para este problema.
- O bloqueador descoberto foi que a regra incorreta de duplicidade não está restrita ao serviço: memória, contrato de repositório e schema também assumem unicidade por `name` isolado.
- Portanto, o bugfix correto precisa permitir duplicidade apenas quando houver coincidência simultânea de `normalizedName` e `type` em toda a cadeia de persistência.
- O backend também não consegue fechar `tsc --noEmit` limpo por causa de 7 erros no teste `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`.

---

## Restrições críticas

- Backend path: `core/kernel/`
- Stack: Node.js 20, TypeScript ESM, Fastify 4, Drizzle ORM, PostgreSQL
- Imports locais no backend devem usar extensão `.js` quando aplicável nos exemplos
- Não adicionar dependências
- Não alterar contrato de rota, payload ou resposta, exceto pelo comportamento correto da detecção de duplicidade
- Não incluir frontend, OAuth, delete flow, logging, nem outros bugfixes de providers
- Não expandir além do mínimo necessário em serviço, repositório, persistência, schema/migração e teste TypeScript listados acima
- Se surgir necessidade de alterar qualquer arquivo fora dos listados acima, PARE e peça instrução

---

## Após implementar

Validar somente:

1. `cd core/kernel && npx tsc --noEmit`
2. Testes backend existentes relevantes ao fluxo de criação de provider, aos repositórios impactados e ao lifecycle test ajustado

Não expandir a validação para frontend nem para áreas fora deste escopo.
