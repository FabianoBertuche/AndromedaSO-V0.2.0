# Plano de Implementação — Frontend Chat Console

## Ordem obrigatória

Executar nesta sequência: **validação de dependência backend → testes frontend (falhando) → tipos/API frontend → hook agregado → componentes/página → verificação final**.

## Tarefas

- [x] 1. Validar a pré-condição do endpoint de chat antes de qualquer implementação
  - Confirmar se existe um endpoint backend real capaz de receber `modelId + messages` e retornar uma mensagem do assistente
  - Se o endpoint não existir ou o contrato divergir materialmente desta spec, parar e reportar bloqueio ao usuário
  - _Rastreia: Req. 3, 8_

- [x] 2. Escrever testes do hook agregado antes da implementação
  - Cobrir agregação de modelos de múltiplos providers/catálogos
  - Cobrir limpeza da conversa ao trocar de modelo
  - Cobrir preservação do histórico anterior quando o envio falha
  - Cobrir limpeza de mensagens e erro ao acionar `clearConversation`
  - _Rastreia: Req. 2, 4, 6, 7_

- [x] 3. Escrever testes da página de chat antes da implementação
  - Estado loading de modelos
  - Estado vazio quando não há modelos disponíveis
  - Fluxo `selecionar modelo -> enviar mensagem -> mostrar resposta`
  - Exibição de loading durante envio
  - Exibição de erro amigável em falha de envio
  - Limpeza da conversa preservando o modelo selecionado
  - _Rastreia: Req. 1, 2, 3, 5, 6, 7_

- [x] 4. Escrever testes dos componentes novos antes da implementação
  - Combobox mostra opções desambiguadas por modelo/origem
  - Histórico diferencia visualmente `user` e `assistant`
  - Composer bloqueia envio sem texto útil, sem modelo ou durante loading
  - _Rastreia: Req. 2, 3, 4, 5_

- [x] 5. Definir tipos frontend do chat
  - Adicionar tipos de mensagem da conversa, opção de modelo para chat e request/response do endpoint de chat em `frontend/src/types/model.ts`
  - Manter os tipos novos restritos ao caso de uso de chat
  - _Rastreia: Req. 3, 4_

- [x] 6. Implementar funções API frontend necessárias em `frontend/src/api/kernel.ts`
  - Adicionar a função de envio de mensagem para o endpoint de chat existente
  - Adicionar helper para compor/normalizar a lista de modelos disponíveis sem alterar provider management
  - _Rastreia: Req. 2, 3, 8_

- [x] 7. Implementar o hook `useModelChatConsole.ts`
  - Orquestrar providers existentes e catálogos já sincronizados
  - Manter `selectedModelId`, `messages`, `draft`, `errorMessage` e estado de loading
  - Limpar conversa ao trocar de modelo
  - Expor `sendMessage` e `clearConversation`
  - _Rastreia: Req. 2, 3, 4, 5, 6, 7_

- [x] 8. Implementar componentes visuais do chat
  - `ModelChatSelector.tsx`
  - `ChatConversation.tsx`
  - `ChatComposer.tsx`
  - Reutilizar `ToastNotification` apenas se encaixar no fluxo sem expandir escopo
  - _Rastreia: Req. 1, 2, 3, 4, 5, 6, 7_

- [x] 9. Implementar a nova versão de `frontend/src/pages/LlmConnectionConsole.tsx`
  - Remover foco de gestão de providers da tela
  - Integrar selector, histórico, composer e estados principais
  - Manter a aba `models` como ponto de entrada existente, sem criar nova navegação principal
  - _Rastreia: Req. 1, 8_

- [x] 10. Implementar estados principais da UX
  - Loading inicial de modelos
  - Empty state sem modelos disponíveis
  - Loading durante envio
  - Erro amigável sem apagar histórico anterior
  - Limpeza explícita da conversa atual
  - _Rastreia: Req. 2, 5, 6, 7_

- [x] 11. Verificação final obrigatória
  - Executar validação TypeScript do frontend (`frontend && npx tsc --noEmit`)
  - Executar a suíte de testes frontend relevante
  - Confirmar que a implementação não adicionou provider management, sync, benchmark, router UI ou persistência de histórico
  - _Rastreia: todos os requisitos_

---

## Edge cases rastreados

- **EC-01**: não existe nenhum modelo disponível no sistema
- **EC-02**: usuário tenta enviar mensagem sem modelo selecionado
- **EC-03**: usuário tenta enviar mensagem vazia ou com espaços
- **EC-04**: usuário troca o modelo com conversa atual em memória
- **EC-05**: envio falha após a conversa já possuir mensagens anteriores
- **EC-06**: endpoint de chat não existe ou não segue o contrato assumido
- **EC-07**: usuário limpa a conversa após erro visível
