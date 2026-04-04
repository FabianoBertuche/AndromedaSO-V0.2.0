# CONTEXT — provider-management-v2

## Para o OpenCode: leia este arquivo antes de qualquer implementação

Este spec adiciona duas features ao Andromeda SO:
1. **Deletar provider** — botão Delete com confirmação na UI + endpoint DELETE no backend
2. **Autenticação OpenAI** — suporte a OAuth 2.0 com PKCE e API Key no formulário

---

## Arquivos do spec (ler nesta ordem)

1. `.kiro/specs/provider-management-v2/requirements.md`
2. `.kiro/specs/provider-management-v2/design.md`
3. `.kiro/specs/provider-management-v2/tasks.md`

## Steering files obrigatórios

- `.kiro/steering/tech.md`
- `.kiro/steering/structure.md`
- `.kiro/steering/opencode-workflow.md`

---

## Arquivos a criar/modificar

### Backend (`core/kernel/`)

| Arquivo | Ação |
|---|---|
| `src/modules/providers/domain/repositories/provider.repository.ts` | MODIFICAR — adicionar `delete(id)` |
| `src/modules/providers/infrastructure/repositories/provider.repository.postgres.ts` | MODIFICAR — implementar `delete` |
| `src/modules/providers/infrastructure/repositories/provider.repository.memory.ts` | MODIFICAR — implementar `delete` |
| `src/modules/providers/services/providerOrchestratorService.ts` | MODIFICAR — adicionar `deleteProvider` |
| `src/modules/providers/routes/providerRoutes.ts` | MODIFICAR — adicionar rota DELETE |

### Frontend (`frontend/`)

| Arquivo | Ação |
|---|---|
| `src/api/kernel.ts` | MODIFICAR — adicionar `deleteProvider` |
| `src/hooks/useProviders.ts` | MODIFICAR — adicionar `useDeleteProvider` |
| `src/components/DeleteConfirmationDialog.tsx` | CRIAR |
| `src/pages/ModelProviders.tsx` | MODIFICAR — botão Delete + authMode |
| `src/utils/pkce.ts` | CRIAR — generateCodeVerifier, generateCodeChallenge |
| `src/pages/OAuthCallbackHandler.tsx` | CRIAR |
| `src/App.tsx` | MODIFICAR — BrowserRouter + rota /oauth/callback |
| `.env.example` | MODIFICAR — VITE_OPENAI_OAUTH_CLIENT_ID |

---

## Pontos críticos

### Backend — rota DELETE
```typescript
server.delete('/:id', async (request, reply) => {
  const { id } = request.params as { id: string };
  try {
    await service.deleteProvider(id);
    return reply.status(204).send();
  } catch (error) {
    return reply.status(404).send({ error: (error as Error).message });
  }
});
```

### Frontend — PKCE é assíncrono
`generateCodeChallenge` usa `crypto.subtle.digest` que é async. O `startOAuthFlow` deve ser `async`.

### Frontend — react-router-dom
Precisa instalar: `npm install react-router-dom` em `frontend/`.
O `App.tsx` atual usa tabs com `useState` — extrair para `MainApp` e envolver com `BrowserRouter`.

### Frontend — sem migration de banco
O `ON DELETE CASCADE` já está configurado em `provider_model_catalog`. Nenhuma migration necessária.

---

## Após implementar

Avise o Kiro para:
1. Testar o botão Delete via Playwright
2. Verificar que o formulário detecta o tipo de provider corretamente
3. Confirmar que o fluxo OAuth redireciona corretamente (requer VITE_OPENAI_OAUTH_CLIENT_ID configurado)
