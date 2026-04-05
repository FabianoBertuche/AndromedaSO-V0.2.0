# Plano de Implementação — models-not-working-fix

## Visão Geral

Este plano executa um bugfix backend estritamente limitado a serviço, contrato de repositório, repositórios concretos, schema/migração necessários e um teste TypeScript já existente.

Objetivos:

1. corrigir a regra de duplicidade na criação de providers para `(normalizedName, type)`
2. alinhar memória, PostgreSQL e schema à mesma regra
3. corrigir os erros de TypeScript no teste de lifecycle

Todas as tasks abaixo são obrigatórias. Durante a execução, atualizar os marcadores conforme a regra do projeto:

- iniciar: `- [ ]` → `- [-]`
- concluir: `- [-]` → `- [x]`

---

## Tarefas

- [x] 1. Ler o spec completo e confirmar o escopo antes de alterar código
  - Ler `CONTEXT.md`, `requirements.md`, `design.md` e `tasks.md` desta spec
  - Confirmar leitura dos steering files obrigatórios
  - Confirmar que apenas os arquivos autorizados por esta spec serão modificados

- [x] 2. Ajustar o contrato do repositório para suportar duplicidade por `(name, type)`
  - Modificar `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts`
  - Explicitar no contrato a capacidade necessária para verificar duplicidade exata por `normalizedName` + `type`
  - Não expandir o contrato para comportamentos fora deste bugfix
  - _Requisitos: 1.1, 1.2, 1.3, 2.1_

- [x] 3. Ajustar o repositório em memória para permitir mesmo nome com tipo diferente
  - Modificar `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.memory.ts`
  - Atualizar indexação/lookup para refletir `(name, type)` em vez de `name` isolado
  - Garantir comportamento consistente com o contrato atualizado
  - _Requisitos: 2.2, 2.4_

- [x] 4. Ajustar o repositório PostgreSQL para permitir mesmo nome com tipo diferente
  - Modificar `core/kernel/src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts`
  - Atualizar consulta/lookup usados pelo fluxo de criação para refletir `(name, type)`
  - Manter o restante do comportamento do repositório inalterado, salvo o necessário para este bugfix
  - _Requisitos: 2.3, 2.4_

- [x] 5. Ajustar schema e migração necessários para unicidade composta
  - Modificar `core/kernel/src/store/schema.ts`
  - Alterar a restrição persistida de unicidade de `name` para `(name, type)`
  - Atualizar ou gerar migração necessária conforme o workflow atual do projeto, se aplicável
  - Não alterar outras tabelas ou regras fora do escopo
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Ajustar a checagem de duplicidade em `providerOrchestratorService.ts`
  - Modificar `core/kernel/src/modules/providers/services/providerOrchestratorService.ts`
  - Manter a normalização atual de nome no fluxo de criação
  - Usar o contrato de repositório atualizado para rejeitar apenas duplicados exatos por `(normalizedName, type)`
  - Permitir criação quando o `normalizedName` coincidir, mas o `type` for diferente
  - Não alterar contrato da rota `POST /api/providers`
  - _Requisitos: 1.1, 1.2, 1.4, 4.1, 4.2, 4.3_

- [x] 7. Executar compilação do backend após os ajustes de providers/persistência
  - Executar `cd core/kernel && npx tsc --noEmit`
  - Corrigir qualquer erro introduzido antes de seguir
  - _Requisitos: 6.1_

- [x] 8. Corrigir fixtures `ModuleRegistryRecord` em `lifecycleOrchestrator.test.ts`
  - Modificar `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`
  - Adicionar a propriedade obrigatória `state` em todos os fixtures tipados como `ModuleRegistryRecord` que hoje a omitem
  - Reutilizar apenas tipos e valores já existentes no arquivo/código atual
  - _Requisitos: 5.1_

- [x] 9. Corrigir uso inválido de `pattern` em `StringConstraints`
  - Modificar `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`
  - Substituir/remover a propriedade `pattern` em objetos `StringConstraints`
  - Usar apenas propriedades compatíveis com a tipagem atual do helper utilizado
  - _Requisitos: 5.2_

- [x] 10. Executar compilação do backend após os ajustes do teste
  - Executar `cd core/kernel && npx tsc --noEmit`
  - Confirmar zero erros originados de `core/kernel/src/lifecycle/__tests__/lifecycleOrchestrator.test.ts`
  - _Requisitos: 5.3, 6.1_

- [x] 11. Executar apenas testes backend existentes relevantes
  - Rodar os testes existentes relacionados ao fluxo de criação de provider
  - Rodar os testes existentes relacionados aos repositórios impactados, se já existirem
  - Rodar os testes existentes relacionados ao lifecycle test ajustado, se aplicável
  - Não adicionar novos testes fora do escopo
  - _Requisitos: 6.2, 6.3_

- [x] 12. Revisão final de escopo
  - Confirmar que nenhuma mudança foi feita em frontend, OAuth, delete flow, logging ou bugs não cobertos
  - Confirmar que apenas os arquivos autorizados por esta spec foram alterados
  - Confirmar que o bugfix permanece restrito ao comportamento de duplicidade, à persistência mínima necessária e à limpeza do `tsc` backend
