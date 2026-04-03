import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProvider, getProviderHealth, listProviders, syncProviderModels } from '../api/kernel';

export function useProviders() {
  return useQuery({
    queryKey: ['providers'],
    queryFn: listProviders,
    refetchInterval: 3000,
    refetchOnWindowFocus: true
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProvider,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}

export function useSyncProviderModels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => syncProviderModels(providerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}

export function useProviderHealthCheck() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (providerId: string) => getProviderHealth(providerId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}
