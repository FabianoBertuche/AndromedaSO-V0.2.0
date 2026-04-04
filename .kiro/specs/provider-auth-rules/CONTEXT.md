# CONTEXT — provider-auth-rules

## Para o OpenCode: leia este arquivo antes de qualquer implementação

Este spec implementa regras de autenticação corretas para todos os 20 tipos de providers LLM no formulário de cadastro.

---

## Arquivos do spec (ler nesta ordem)

1. `.kiro/specs/provider-auth-rules/requirements.md`
2. `.kiro/specs/provider-auth-rules/design.md`
3. `.kiro/specs/provider-auth-rules/tasks.md`

---

## Resumo do que fazer

Substituir a função `getAuthMode` atual por `getAuthConfig` que retorna um objeto `AuthConfig` completo para cada provider.

### Arquivos a criar

| Arquivo | O que criar |
|---|---|
| `frontend/src/utils/authConfig.ts` | Função `getAuthConfig` com switch dos 20 providers |
| `frontend/src/components/CredentialTooltip.tsx` | Ícone `?` como link para obter credenciais |

### Arquivos a modificar

| Arquivo | O que mudar |
|---|---|
| `frontend/src/types/model.ts` | Adicionar `AuthMode`, `AuthConfig`; estender `ProviderConfig` com `accessKeyId?`, `secretAccessKey?` |
| `frontend/src/pages/ModelProviders.tsx` | Remover `getAuthMode` local, usar `getAuthConfig`, novos estados, renderização condicional, validação |
| `core/kernel/src/modules/providers/domain/entities/provider.entity.ts` | Adicionar `accessKeyId?`, `secretAccessKey?` ao `ProviderConfig` |
| `core/kernel/src/modules/providers/services/providerOrchestratorService.ts` | Combinar credenciais AWS em `apiKeyEnc` |

---

## Mapeamento de AuthMode (resumo)

| AuthMode | Providers |
|---|---|
| `none` | ollama, lmstudio, vllm |
| `api-key` | anthropic, groq, mistral, together, fireworks, deepinfra, novita, openrouter, hyperbolic, replicate, cohere, xai |
| `api-key-baseurl` | azure-openai, google-vertex |
| `oauth-apikey` | openai, google |
| `aws-credentials` | aws-bedrock |

---

## Ponto crítico: AWS Bedrock

Para `aws-bedrock`, o formulário mostra dois campos separados (`accessKeyId` e `secretAccessKey`).
O backend combina os dois como `accessKeyId:secretAccessKey` antes de codificar em base64.

---

## Após implementar

Avise o Kiro para verificar via Playwright se:
1. Trocar para `anthropic` mostra placeholder `sk-ant-...`
2. Trocar para `ollama` oculta o campo API Key
3. Trocar para `aws-bedrock` mostra dois campos separados
4. Trocar para `azure-openai` mostra campo baseUrl obrigatório
5. Submeter `azure-openai` sem baseUrl mostra erro de validação
