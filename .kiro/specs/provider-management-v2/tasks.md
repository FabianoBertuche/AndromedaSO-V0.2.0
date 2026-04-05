# Plano de Implementação: provider-management-v2

## Visão Geral

Implementação em duas frentes: (1) exclusão de providers com confirmação na UI e (2) suporte a autenticação OpenAI via OAuth 2.0 com PKCE, mantendo compatibilidade com o fluxo existente de API Key.

## Tarefas

- [x] 1. Adicionar método `delete` à interface `ProviderRepository`
  - Adicionar assinatura `delete(id: string): Promise<void>` à interface em `core/kernel/src/modules/providers/domain/repositories/provider.repository.ts`
  - _Requisitos: 1.4_

- [x] 2. Implementar `delete` no `ProviderRepositoryPostgres`
  - [x] 2.1 Implementar o método `delete` em `provider.repository.postgres.ts`
    - Executar `DELETE FROM provider_state WHERE id = $1`
    - Lançar `Error('Provider not found')` se `rowCount === 0`
    - A remoção em cascata de `provider_model_catalog` é garantida pelo `ON DELETE CASCADE` existente
    - _Requisitos: 1.3, 1.4, 1.5_
  - [x]* 2.2 Escrever teste de propriedade para `ProviderRepositoryMemory.delete` (Propriedade 1)
    - **Propriedade 1: delete remove o provider do repositório**
    - Gerar providers aleatórios, inserir, deletar, verificar que `findById` retorna `null`
    - Usar `fast-check` com `numRuns: 100`
    - **Valida: Requisitos 1.1, 1.4**

- [x] 3. Implementar `delete` no `ProviderRepositoryMemory`
  - [x] 3.1 Implementar o método `delete` em `provider.repository.memory.ts`
    - Verificar existência via `this.providers.get(id)`, lançar `Error('Provider not found')` se ausente
    - Remover de `this.providers`, `this.providersByName` e `this.catalogs`
    - _Requisitos: 1.4, 1.5_
  - [x]* 3.2 Escrever testes unitários para `ProviderRepositoryMemory.delete`
    - Caso: provider existente é removido com sucesso
    - Caso: provider inexistente lança `Error('Provider not found')`
    - _Requisitos: 1.4, 1.5_

- [x] 4. Implementar `deleteProvider` no `ProviderOrchestratorService`
  - [x] 4.1 Adicionar método `deleteProvider(id: string): Promise<void>` em `provider.orchestrator.service.ts`
    - Chamar `this.repository.findById(id)`, lançar `Error('Provider not found')` se `null`
    - Chamar `this.repository.delete(id)`
    - _Requisitos: 1.1, 1.2_
  - [x]* 4.2 Escrever testes unitários para `ProviderOrchestratorService.deleteProvider`
    - Caso: delega ao repositório e retorna sem erro
    - Caso: propaga erro quando provider não encontrado
    - _Requisitos: 1.1, 1.2_

- [x] 5. Adicionar rota `DELETE /api/providers/:id` em `providerRoutes.ts`
  - Registrar `server.delete('/:id', ...)` em `core/kernel/src/modules/providers/routes/providerRoutes.ts`
  - Chamar `providerOrchestratorService.deleteProvider(id)`
  - Retornar `204` sem corpo em caso de sucesso
  - Retornar `404` com `{ error: message }` em caso de erro
  - _Requisitos: 1.1, 1.2, 7.3_

- [x] 6. Checkpoint — verificar backend
  - Garantir que todos os testes do kernel passam (`npm run test` em `core/kernel/`)
  - Verificar que TypeScript compila sem erros (`tsc --noEmit`)
  - Confirmar que os endpoints existentes não foram alterados

- [x] 7. Adicionar função `deleteProvider` em `kernel.ts`
  - Adicionar `export async function deleteProvider(id: string): Promise<void>` em `frontend/src/api/kernel.ts`
  - Fazer `fetch` com `method: 'DELETE'` para `/api/providers/${encodeURIComponent(id)}`
  - Lançar `Error` com mensagem do body se `response.ok === false`
  - _Requisitos: 2.3_

- [x] 8. Adicionar hook `useDeleteProvider` em `useProviders.ts`
  - Adicionar `export function useDeleteProvider()` em `frontend/src/hooks/useProviders.ts`
  - Usar `useMutation` com `mutationFn: (id: string) => deleteProvider(id)`
  - No `onSuccess`, chamar `queryClient.invalidateQueries({ queryKey: ['providers'] })`
  - _Requisitos: 2.3, 2.4_

- [x] 9. Criar componente `DeleteConfirmationDialog`
  - Criar `frontend/src/components/DeleteConfirmationDialog.tsx`
  - Props: `providerName: string`, `onConfirm: () => void`, `onCancel: () => void`, `isDeleting: boolean`
  - Renderizar modal com overlay, nome do provider, botões "Cancelar" e "Confirmar"
  - Desabilitar ambos os botões quando `isDeleting === true`
  - Exibir "Deletando..." no botão de confirmação durante exclusão
  - _Requisitos: 2.2, 2.5, 2.6_

- [x] 10. Integrar botão Delete na tabela de providers em `ModelProviders.tsx`
  - Adicionar estado `deleteTarget: Provider | null` e instanciar `useDeleteProvider()`
  - Adicionar botão "Deletar" na coluna de ações de cada linha da tabela
  - Desabilitar o botão quando `deleteProviderMutation.isPending && deleteTarget?.id === provider.id`
  - Renderizar `<DeleteConfirmationDialog>` condicionalmente quando `deleteTarget !== null`
  - Implementar `confirmDelete`: chamar `mutateAsync(deleteTarget.id)` e limpar `deleteTarget`
  - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 11. Implementar detecção de tipo de provider no formulário (`authMode`)
  - Adicionar tipo `AuthMode = 'api-key' | 'oauth' | 'none'` e função `getAuthMode(type)` em `ModelProviders.tsx`
  - Adicionar estado `authMode` inicializado com `'api-key'`
  - Atualizar `handleProviderTypeChange` para resetar `authMode` e limpar `apiKey` ao mudar tipo
  - Renderizar seletor de modo (API Key / OAuth) apenas quando `providerType === 'openai'`
  - Renderizar campo API Key apenas quando `authMode === 'api-key'`
  - Ocultar todos os campos de autenticação quando `authMode === 'none'` (Ollama, lmstudio, vllm)
  - _Requisitos: 3.1, 3.2, 3.3, 3.4_

- [x] 12. Criar utilitários PKCE em `pkce.ts`
  - Criar `frontend/src/utils/pkce.ts`
  - Implementar `generateCodeVerifier(): string` — 48 bytes aleatórios via `crypto.getRandomValues`, codificados em base64url (comprimento ≥ 43)
  - Implementar `generateCodeChallenge(verifier: string): Promise<string>` — SHA-256 via `crypto.subtle.digest`, codificado em base64url sem padding
  - Implementar função auxiliar `base64urlEncode(buffer: Uint8Array): string`
  - _Requisitos: 5.1_

- [x] 13. Implementar função `startOAuthFlow` em `ModelProviders.tsx`
  - Importar `generateCodeVerifier` e `generateCodeChallenge` de `../utils/pkce`
  - Implementar `startOAuthFlow` como função `async`
  - Gerar `verifier` e `challenge`, armazenar verifier em `sessionStorage` sob a chave `oauth_code_verifier`
  - Ler `client_id` de `import.meta.env.VITE_OPENAI_CLIENT_ID`
  - Construir URL de autorização com `URLSearchParams` e redirecionar via `window.location.href`
  - Renderizar botão "Login com OpenAI" apenas quando `providerType === 'openai' && authMode === 'oauth'`
  - _Requisitos: 5.1, 5.6, 5.7_

- [x] 14. Instalar `react-router-dom` e configurar `BrowserRouter` no `App.tsx`
  - Instalar `react-router-dom` em `frontend/`: `npm install react-router-dom`
  - Extrair conteúdo atual do `App` para componente interno `MainApp`
  - Envolver com `<BrowserRouter>` e adicionar `<Routes>` com duas rotas:
    - `<Route path="/oauth/callback" element={<OAuthCallbackHandler />} />`
    - `<Route path="*" element={<MainApp />} />`
  - _Requisitos: 6.1_

- [x] 15. Criar componente `OAuthCallbackHandler`
  - Criar `frontend/src/pages/OAuthCallbackHandler.tsx`
  - Usar `useEffect` para processar automaticamente os parâmetros da query string ao montar
  - Exibir indicador de carregamento enquanto processa
  - Recuperar `code` de `window.location.search`; exibir erro se ausente (_Requisito 5.5_)
  - Recuperar `code_verifier` de `sessionStorage`; exibir erro se ausente (_Requisito 5.2_)
  - Fazer `POST` para `https://auth.openai.com/oauth/token` com os campos obrigatórios
  - Exibir mensagem de erro descritiva se a requisição de token falhar (_Requisito 5.4_)
  - Extrair `access_token`, remover `oauth_code_verifier` do sessionStorage, chamar `createProvider`
  - Redirecionar para `/providers` (ou rota principal) após criação bem-sucedida via `useNavigate`
  - _Requisitos: 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4_

- [x] 16. Configurar variável de ambiente `VITE_OPENAI_OAUTH_CLIENT_ID`
  - Adicionar `VITE_OPENAI_OAUTH_CLIENT_ID=your-openai-oauth-client-id` ao `frontend/.env.example`
  - Verificar que a variável está listada no `.gitignore` ou que o `.env` local não é commitado
  - _Requisitos: 5.6_

- [x] 17. Checkpoint final — verificar frontend e integração
  - Garantir que todos os testes do frontend passam (`npm run test` em `frontend/`)
  - Verificar que TypeScript compila sem erros (`tsc --noEmit` em `frontend/`)
  - Confirmar que os endpoints existentes do backend continuam funcionando (não-regressão)
  - Verificar que o fluxo de criação de providers via API Key para todos os tipos existentes continua funcionando
  - _Requisitos: 7.1, 7.2, 7.3_

## Notas

- Tasks marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada task referencia os requisitos correspondentes para rastreabilidade
- O `ON DELETE CASCADE` já está configurado no banco — nenhuma migration é necessária
- O design usa TypeScript; todos os exemplos de código devem seguir as convenções ESM do projeto (`import` com extensão `.js` no backend)
- Instalar `fast-check` antes de implementar os testes de propriedade: `npm install --save-dev fast-check`
