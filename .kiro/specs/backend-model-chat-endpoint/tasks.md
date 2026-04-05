# Plano de Implementação — Backend Model Chat Endpoint

## Ordem obrigatória

Executar nesta sequência: **testes falhando → seam mínima de adapter → serviço de resolução/chat → rota HTTP → adaptação de adapters necessários → verificação final**.

## Tarefas

- [x] 1. Escrever testes do serviço antes da implementação
  - Criar testes para o fluxo `chatByModel`
  - Cobrir resolução do provider dono via catálogo já persistido
  - Cobrir erro quando `modelId` não existe em nenhum catálogo
  - Cobrir erro quando `modelId` existe em mais de um provider
  - Cobrir erro quando o catálogo aponta para provider ausente
  - Cobrir propagação/mapeamento de indisponibilidade do provider e falha upstream
  - _Rastreia: Req. 1, 3, 5, 7_

- [x] 2. Escrever testes da rota antes da implementação
  - Criar `POST /api/providers/chat` testando contrato de sucesso
  - Validar `400 INVALID_CHAT_PAYLOAD`
  - Validar `404 MODEL_NOT_FOUND`
  - Validar `409 MODEL_AMBIGUOUS`
  - Validar `404 PROVIDER_NOT_FOUND`
  - Validar `503 PROVIDER_UNREACHABLE`
  - Validar `502 UPSTREAM_CHAT_FAILED`
  - _Rastreia: Req. 1, 2, 5, 7_

- [x] 3. Estender a seam mínima dos adapters
  - Atualizar `adapter.interface.ts` com tipos mínimos de mensagem/chat e método `chat()` ou equivalente explicitamente aprovado no design
  - Garantir que a extensão permaneça restrita a `modelId + messages -> assistant message`
  - Não adicionar streaming, tools ou parâmetros extras
  - _Rastreia: Req. 2, 4, 6_

- [x] 4. Implementar resolução do provider dono no `ProviderOrchestratorService`
  - Reutilizar `repository.list()` + `repository.getCatalog(provider.id)` para localizar o `modelId`
  - Falhar explicitamente em zero matches e múltiplos matches
  - Reutilizar lookup de provider existente para obter o provider final
  - _Rastreia: Req. 3, 5_

- [x] 5. Implementar o método de serviço `chatByModel`
  - Receber `modelId` e `messages`
  - Resolver o provider dono
  - Instanciar o adapter pela factory já existente
  - Chamar `adapter.chat(modelId, messages)`
  - Mapear erros operacionais para códigos de domínio esperados
  - _Rastreia: Req. 1, 2, 4, 5_

- [x] 6. Implementar a rota `POST /api/providers/chat`
  - Validar o payload de entrada
  - Chamar `providerOrchestratorService.chatByModel(...)`
  - Retornar o contrato de sucesso exato
  - Mapear erros para os status/code definidos na spec
  - _Rastreia: Req. 1, 2, 5_

- [x] 7. Adaptar os providers necessários para suportar chat real
  - Implementar `chat()` nos adapters necessários para o fluxo mínimo do frontend
  - Onde ainda não houver suporte real, retornar falha explícita e mapeável, nunca resposta fake
  - Preservar `listModels()` e `ping()` sem expandir provider management
  - _Rastreia: Req. 4, 5, 6_

- [x] 8. Verificação final obrigatória
  - Executar validação TypeScript do backend (`core/kernel && npx tsc --noEmit`)
  - Executar a suíte Vitest relevante do módulo de providers
  - Confirmar que a implementação não adicionou benchmark, router work, streaming, persistência de histórico ou expansão de provider management
  - Confirmar que a feature desbloqueia a dependência declarada em `.kiro/specs/frontend-chat-console/`
  - _Rastreia: todos os requisitos_

---

## Edge cases rastreados

- **EC-01**: request sem `modelId`
- **EC-02**: request sem `messages`
- **EC-03**: request com `messages` vazias
- **EC-04**: request com `role` inválido
- **EC-05**: request com `content` vazio após `trim()`
- **EC-06**: `modelId` não existe em nenhum catálogo sincronizado
- **EC-07**: `modelId` existe em mais de um provider sincronizado
- **EC-08**: catálogo referencia `providerId` que não existe mais
- **EC-09**: provider está offline ou conexão falha
- **EC-10**: provider responde erro upstream após ser alcançado
