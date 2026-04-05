# Documento de Requisitos — models-not-working-fix

## Introdução

Este documento descreve um bugfix de escopo reduzido para o backend do Andromeda SO.

O sintoma percebido pelo usuário como "models not working" decorre, na prática, da falha na criação de providers em `POST /api/providers`, retornando `{"error":"Provider already exists"}` em situações que não deveriam ser tratadas como duplicidade. A investigação confirmou um bloqueador adicional: a regra incorreta de unicidade está refletida também no contrato de repositório e na persistência. A correção, portanto, deve atuar no service layer, nos repositórios concretos, no contrato de repositório e no schema/migração necessários para alinhar a unicidade a `(normalizedName, type)`.

As APIs de leitura de providers e catálogo já estão funcionando dentro da investigação realizada. Não faz parte deste spec alterar frontend, OAuth, sync, delete, logging ou outros comportamentos não diretamente relacionados ao bug descrito.

---

## Glossário

- **Provider**: integração cadastrada no sistema para acesso a um provedor de modelos.
- **normalizedName**: nome do provider após normalização usada pelo fluxo de criação atual, derivado de `(config.name || config.type).trim().toLowerCase()` ou equivalente já existente.
- **Duplicado exato**: provider cujo `normalizedName` e `type` coincidem com um provider já persistido.
- **Unicidade persistida**: regra de armazenamento aplicada por schema/repositório para garantir consistência com a regra de duplicidade.
- **ModuleRegistryRecord**: estrutura tipada usada nos testes de lifecycle e que exige a propriedade `state`.

---

## Requisitos

### Requisito 1: Rejeitar somente duplicidade exata por nome normalizado + tipo

**User Story:** Como sistema, quero rejeitar apenas providers realmente duplicados, para não bloquear o cadastro de providers válidos que compartilham o mesmo nome normalizado, mas pertencem a tipos diferentes.

#### Critérios de Aceitação

1. WHEN `POST /api/providers` recebe uma solicitação de criação cujo `normalizedName` e `type` já existem juntos, THEN o backend SHALL rejeitar a criação com o mesmo erro de duplicidade já usado hoje.
2. WHEN `POST /api/providers` recebe uma solicitação de criação cujo `normalizedName` já existe, mas com `type` diferente, THEN o backend SHALL permitir a criação se os demais dados forem válidos.
3. THE correção SHALL considerar como duplicado exato apenas a combinação `(normalizedName, type)`.
4. THE correção SHALL preservar o contrato HTTP atual da rota `POST /api/providers`.

---

### Requisito 2: Alinhar contrato de repositório e implementações de armazenamento à mesma regra

**User Story:** Como mantenedor do backend, quero que service, contrato de repositório e implementações concretas apliquem a mesma regra de unicidade, para que o comportamento correto não dependa apenas de uma checagem superficial no serviço.

#### Critérios de Aceitação

1. THE arquivo `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts` SHALL expor contrato compatível com lookup/validação por `(normalizedName, type)` ou outra forma equivalente explicitamente alinhada a essa regra.
2. THE arquivo `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts` SHALL permitir persistir providers com mesmo `normalizedName` quando o `type` for diferente.
3. THE arquivo `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts` SHALL permitir persistir providers com mesmo `normalizedName` quando o `type` for diferente, respeitando a mesma regra de duplicidade exata.
4. THE comportamento de memória e PostgreSQL SHALL permanecer consistente entre si para os cenários de duplicidade deste spec.

---

### Requisito 3: Alinhar schema e restrições persistidas à regra `(name, type)`

**User Story:** Como sistema, quero que as restrições de persistência usem a mesma definição de duplicidade aplicada pelo domínio, para evitar que a base de dados continue bloqueando cenários válidos.

#### Critérios de Aceitação

1. THE persistência SHALL deixar de impor unicidade por `name` isolado para providers.
2. THE persistência SHALL passar a impor unicidade por `(name, type)`.
3. IF o workflow atual do projeto exigir migração para refletir essa mudança, THEN essa migração SHALL fazer parte desta spec.
4. THE schema e qualquer migração necessária SHALL permanecer limitados ao ajuste de unicidade de providers, sem expandir escopo para outras tabelas ou regras.

---

### Requisito 4: Preservar comportamento atual para providers realmente únicos

**User Story:** Como desenvolvedor, quero que providers únicos continuem sendo criados normalmente, para que o bugfix não introduza regressão no fluxo atual de sucesso.

#### Critérios de Aceitação

1. WHEN `POST /api/providers` recebe uma solicitação com combinação inédita de `normalizedName` e `type`, THEN o backend SHALL manter o comportamento atual de criação bem-sucedida.
2. THE correção SHALL ser estritamente limitada à lógica de duplicidade e à consistência mínima de repositório/persistência necessária para sustentá-la.
3. THE implementação SHALL NOT introduzir novos campos públicos, novas dependências ou novas regras de validação fora do necessário para este bugfix.

---

### Requisito 5: Eliminar erros de TypeScript no teste de lifecycle

**User Story:** Como mantenedor do backend, quero que o arquivo `lifecycleOrchestrator.test.ts` respeite os tipos atuais, para que a compilação TypeScript do backend volte a ficar limpa.

#### Critérios de Aceitação

1. THE arquivo `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts` SHALL incluir a propriedade obrigatória `state` em todos os fixtures de `ModuleRegistryRecord` que hoje a omitem.
2. THE arquivo `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts` SHALL remover ou substituir o uso inválido da propriedade `pattern` em objetos tipados por `StringConstraints`, de forma compatível com os tipos atualmente aceitos.
3. WHEN o backend executa `npx tsc --noEmit`, THEN não deve haver nenhum erro restante originado de `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`.

---

### Requisito 6: Verificação limitada ao backend impactado

**User Story:** Como responsável pelo bugfix, quero validar apenas o backend impactado, para manter o escopo controlado e coerente com a investigação.

#### Critérios de Aceitação

1. THE verificação SHALL incluir `cd core/kernel && npx tsc --noEmit`.
2. THE verificação SHALL incluir apenas testes backend existentes relevantes ao fluxo corrigido de criação de provider, à persistência impactada e ao arquivo de teste ajustado.
3. THE implementação SHALL NOT incluir trabalho de frontend, OAuth, delete flow, logging ou outros provider bugfixes fora deste documento.
