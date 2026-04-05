import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeOpenAiCodexOAuth,
  createOpenAiCodexOAuthSession,
  getProviderCatalog,
  getProviderHealth,
  listProviderVariants,
  listProviders,
  saveProviderConsoleConfiguration,
  saveProviderSelectedModels,
  syncProviderModels,
  testProviderConnection
} from '../api/kernel';

export function buildSelectedModelIds(preferredModelId: string | null, selectedModelIds: string[]): string[] {
  const normalized = [...new Set(selectedModelIds)];
  if (!preferredModelId) {
    return normalized;
  }

  return [preferredModelId, ...normalized.filter((modelId) => modelId !== preferredModelId)];
}

export function useLlmConnectionConsole(activeProviderId: string | null = null) {
  const queryClient = useQueryClient();

  const providersQuery = useQuery({
    queryKey: ['providers'],
    queryFn: listProviders,
    refetchOnWindowFocus: true
  });

  const variantCatalogQuery = useQuery({
    queryKey: ['provider-variants'],
    queryFn: listProviderVariants
  });

  const catalogQuery = useQuery({
    queryKey: ['provider-catalog', activeProviderId],
    queryFn: () => getProviderCatalog(activeProviderId as string),
    enabled: Boolean(activeProviderId)
  });

  const healthQuery = useQuery({
    queryKey: ['provider-health', activeProviderId],
    queryFn: () => getProviderHealth(activeProviderId as string),
    enabled: Boolean(activeProviderId)
  });

  const invalidateProviderState = async (providerId?: string) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['providers'] }),
      queryClient.invalidateQueries({ queryKey: ['provider-variants'] }),
      providerId ? queryClient.invalidateQueries({ queryKey: ['provider-catalog', providerId] }) : Promise.resolve(),
      providerId ? queryClient.invalidateQueries({ queryKey: ['provider-health', providerId] }) : Promise.resolve()
    ]);
  };

  const testConnectionMutation = useMutation({
    mutationFn: testProviderConnection
  });

  const saveProviderMutation = useMutation({
    mutationFn: saveProviderConsoleConfiguration,
    onSuccess: async (provider) => {
      await invalidateProviderState(provider.id);
    }
  });

  const syncModelsMutation = useMutation({
    mutationFn: (providerId: string) => syncProviderModels(providerId),
    onSuccess: async (payload) => {
      await invalidateProviderState(payload.providerId);
    }
  });

  const savePreferredModelMutation = useMutation({
    mutationFn: ({ providerId, preferredModelId, selectedModelIds }: { providerId: string; preferredModelId: string | null; selectedModelIds: string[] }) =>
      saveProviderSelectedModels(providerId, buildSelectedModelIds(preferredModelId, selectedModelIds)),
    onSuccess: async (_, variables) => {
      await invalidateProviderState(variables.providerId);
    }
  });

  const startOAuthSessionMutation = useMutation({
    mutationFn: createOpenAiCodexOAuthSession
  });

  const completeOAuthMutation = useMutation({
    mutationFn: completeOpenAiCodexOAuth,
    onSuccess: async ({ provider }) => {
      await invalidateProviderState(provider.id);
    }
  });

  const incompatibleProviders = useMemo(() => {
    const variants = new Set((variantCatalogQuery.data?.variants ?? []).map((item) => item.variant));
    return (providersQuery.data?.providers ?? []).filter((provider) => !provider.variant || !variants.has(provider.variant));
  }, [providersQuery.data?.providers, variantCatalogQuery.data?.variants]);

  return {
    providersQuery,
    variantCatalogQuery,
    catalogQuery,
    healthQuery,
    testConnectionMutation,
    saveProviderMutation,
    syncModelsMutation,
    savePreferredModelMutation,
    startOAuthSessionMutation,
    completeOAuthMutation,
    incompatibleProviders,
    buildSelectedModelIds
  };
}
