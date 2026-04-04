import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  benchmarkModel,
  createProvider,
  deleteProvider,
  getProviderCatalog,
  getProviderHealth,
  listProviders,
  openProviderHealthStream,
  saveProviderSelectedModels,
  syncProviderModels
} from '../api/kernel';
import type { Provider } from '../types/model';

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

export function useProviderCatalog(providerId: string | null) {
  return useQuery({
    queryKey: ['provider-catalog', providerId],
    queryFn: () => getProviderCatalog(providerId as string),
    enabled: Boolean(providerId)
  });
}

export function useSaveSelectedModels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ providerId, modelIds }: { providerId: string; modelIds: string[] }) =>
      saveProviderSelectedModels(providerId, modelIds),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['provider-catalog', variables.providerId] });
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}

export function useProviderHealthStream(providerId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!providerId) {
      return;
    }

    const source = openProviderHealthStream(providerId);

    source.addEventListener('health', (event: Event) => {
      const messageEvent = event as MessageEvent;
      try {
        const data = JSON.parse(messageEvent.data as string) as { health: string; latencyMs?: number };
        queryClient.setQueryData<{ providers: Provider[] }>(['providers'], (old) => {
          if (!old) return old;
          return {
            providers: old.providers.map((p) =>
              p.id === providerId
                ? { ...p, health: data.health, latencyMs: data.latencyMs ?? p.latencyMs }
                : p
            )
          };
        });
      } catch {
        // ignore malformed SSE payloads
      }
    });

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [providerId, queryClient]);
}

export function useProviderLoadingState() {
  const [loadingSet, setLoadingSet] = useState<Set<string>>(new Set());

  const isLoading = useCallback((providerId: string) => loadingSet.has(providerId), [loadingSet]);

  const setLoading = useCallback((providerId: string, loading: boolean) => {
    setLoadingSet((prev) => {
      const next = new Set(prev);
      if (loading) {
        next.add(providerId);
      } else {
        next.delete(providerId);
      }
      return next;
    });
  }, []);

  return { isLoading, setLoading };
}

export interface BenchmarkResultRow {
  modelId: string;
  taskType: 'coding' | 'chat';
  score: number;
  latencyMs: number;
  simulated: boolean;
}

export function useBenchmark() {
  const mutation = useMutation({
    mutationFn: ({ modelId, taskType }: { modelId: string; taskType: 'coding' | 'chat' }) =>
      benchmarkModel(modelId, taskType)
  });

  const run = useCallback(
    async (modelId: string, taskType: 'coding' | 'chat'): Promise<BenchmarkResultRow> => {
      const response = await mutation.mutateAsync({ modelId, taskType });
      return {
        modelId: response.result.modelId,
        taskType: response.result.taskType,
        score: response.result.score,
        latencyMs: response.result.latencyMs,
        simulated: response.result.simulated ?? true
      };
    },
    [mutation]
  );

  return { run, isPending: mutation.isPending };
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProvider(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
  });
}
