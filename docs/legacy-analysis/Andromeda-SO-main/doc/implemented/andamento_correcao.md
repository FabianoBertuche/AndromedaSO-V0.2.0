# Andamento da correção

## O que foi feito
- `RouteTaskUseCase` agora registra e retorna o `RoutingDecision` completo com score, latência e capacidades, e o controller retorna esse payload para o frontend poder mostrar justificativas e métricas detalhadas.
- A tela *Router Intelligence* consome o novo payload, inclui o modelo escolhido, score, latência, capacidades, histórico de decisões em colunas com visibilidade responsiva e mantém o último resultado exibido.
- O playground do catalogo envia o prompt para o endpoint `/gateway/message`, alinhando-se ao contrato documentado do MVP02.
- Builds dos workspaces `@andromeda/core` e `@andromeda/api` foram executados com sucesso.

## O que falta
- Remover ou usar o estado `testResult` em `apps/web/src/components/model-center/ModelCatalogPanel.tsx` (TS6133). Até corrigir, `npm run build` em `apps/web` falha.

## Próximos passos
1. Ajustar o campo `testResult` (exibir feedback ou removê-lo) e rodar `npm run build` dentro de `apps/web` para garantir que todo o front compila sem erros.
2. Validar manualmente o fluxo de simulação na aba Router Intelligence para garantir histórico e painel mostra o payload completo.
3. Testar a chamada ao gateway via `/gateway/message` e garantir que autenticação/response com o client_id configurado funciona como esperado.
