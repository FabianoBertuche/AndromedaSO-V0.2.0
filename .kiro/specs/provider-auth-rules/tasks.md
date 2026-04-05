# Tasks — provider-auth-rules

## Fase 1: Tipos e utilitários

- [x] 1. Adicionar `AuthMode` e `AuthConfig` em `frontend/src/types/model.ts`
  - Adicionar `export type AuthMode = 'none' | 'api-key' | 'api-key-baseurl' | 'oauth-apikey' | 'aws-credentials'`
  - Adicionar `export type AuthConfig` com os campos: `mode`, `apiKeyPlaceholder?`, `baseUrlPlaceholder?`, `baseUrlRequired`, `baseUrlVisible`, `credentialUrl?`, `hasOAuth`
  - Estender `ProviderConfig` com `accessKeyId?: string` e `secretAccessKey?: string`

- [x] 2. Criar `frontend/src/utils/authConfig.ts` com a função `getAuthConfig`
  - Implementar o switch completo com os 20 providers conforme o design
  - Incluir fallback `default` retornando `mode: 'api-key'`

- [x] 3. Criar `frontend/src/components/CredentialTooltip.tsx`
  - Componente simples: ícone `?` como link `<a>` abrindo em nova aba
  - Props: `{ url: string }`

## Fase 2: Backend

- [x] 4. Estender `ProviderConfig` em `core/kernel/src/modules/providers/domain/entities/provider.entity.ts`
  - Adicionar `accessKeyId?: string` e `secretAccessKey?: string` ao tipo `ProviderConfig`

- [x] 5. Atualizar `ProviderOrchestratorService.createProvider` em `core/kernel/src/modules/providers/services/providerOrchestratorService.ts`
  - Antes de criar o provider, verificar se `config.type === 'aws-bedrock'`
  - Se sim e `accessKeyId` + `secretAccessKey` presentes, combinar como `resolvedApiKey = \`${config.accessKeyId}:${config.secretAccessKey}\``
  - Usar `resolvedApiKey` no lugar de `config.apiKey` para gerar `apiKeyEnc`

## Fase 3: Formulário frontend

- [x] 6. Atualizar `frontend/src/pages/ModelProviders.tsx` — estados e imports
  - Importar `getAuthConfig` de `../utils/authConfig`
  - Importar `CredentialTooltip` de `../components/CredentialTooltip`
  - Importar `AuthMode` de `../types/model` (remover o tipo local `AuthMode`)
  - Adicionar estados: `const [accessKeyId, setAccessKeyId] = useState('')` e `const [secretAccessKey, setSecretAccessKey] = useState('')`
  - Remover a função `getAuthMode` local
  - Remover o estado `authMode` (substituído por `authConfig` derivado)
  - Adicionar `const authConfig = getAuthConfig(providerType)` (derivado, não estado)

- [x] 7. Atualizar o handler de troca de provider em `ModelProviders.tsx`
  - No `onChange` do `<select>`, limpar também `accessKeyId` e `secretAccessKey`
  - Remover a chamada `setAuthMode(getAuthMode(v)[0])`

- [x] 8. Substituir renderização condicional dos campos em `ModelProviders.tsx`
  - Remover os blocos `{authMode === 'api-key' && ...}` e `{authMode !== 'none' && ...}` existentes
  - Adicionar bloco para campo API Key: visível quando `mode` é `api-key`, `api-key-baseurl` ou `oauth-apikey`
  - Adicionar bloco para campos AWS: visível quando `mode === 'aws-credentials'` (dois inputs: `accessKeyId` e `secretAccessKey`)
  - Adicionar bloco para botão OAuth OpenAI: visível quando `authConfig.hasOAuth && providerType === 'openai'`
  - Adicionar bloco para botão OAuth Google: visível quando `authConfig.hasOAuth && providerType === 'google'`
  - Adicionar bloco para campo baseUrl: visível quando `authConfig.baseUrlVisible === true`
  - Incluir `<CredentialTooltip>` ao lado do campo de credencial quando `authConfig.credentialUrl` estiver definido

- [x] 9. Atualizar a função `addProvider` em `ModelProviders.tsx` com validação e novos campos
  - Adicionar validação: se `authConfig.baseUrlRequired && !baseUrl.trim()`, chamar `setSyncError` e retornar
  - Adicionar validação: se `authConfig.mode === 'aws-credentials' && !accessKeyId.trim()`, chamar `setSyncError` e retornar
  - Adicionar validação: se `authConfig.mode === 'aws-credentials' && !secretAccessKey.trim()`, chamar `setSyncError` e retornar
  - Incluir `accessKeyId: accessKeyId || undefined` e `secretAccessKey: secretAccessKey || undefined` no payload de `createProviderMutation.mutateAsync`

## Fase 4: Testes

- [x]* 10. Criar `frontend/src/utils/__tests__/authConfig.test.ts`
  - Testar que cada um dos 20 providers retorna o `AuthMode` correto (Propriedade 1)
  - Testar fallback para tipo desconhecido (Propriedade 2)
  - Testar placeholders específicos: anthropic, groq, openai, openrouter, replicate, xai (Propriedade 3)
  - Testar que todos os providers com auth têm `credentialUrl` definida (Propriedade 4)
  - Usar `fast-check` para Propriedade 2 (fallback) com 100 iterações
  - Tag: `Feature: provider-auth-rules, Property 1/2/3/4`

- [x]* 11. Criar teste de round-trip AWS em `core/kernel/src/modules/providers/__tests__/`
  - Usar `fast-check` para Propriedade 6: para qualquer par (accessKeyId, secretAccessKey), a combinação base64 deve ser decodificável de volta
  - Testar `createProvider` com `aws-bedrock` + credenciais AWS gera `apiKeyEnc` correto
  - Tag: `Feature: provider-auth-rules, Property 6`
