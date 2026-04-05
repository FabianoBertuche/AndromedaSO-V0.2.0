import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AgentInstance,
  AgentTemplateManifest,
  ResolvedAgentConfig,
  CreateAgentInput,
  UpdateAgentInput,
  DuplicateAgentInput,
  LoadAgentInput
} from '../types/kernel';
import * as api from '../api/kernel';

// Query hooks

export function useAgentTemplates() {
  return useQuery({
    queryKey: ['agentTemplates'],
    queryFn: api.listAgentTemplates,
    staleTime: 5 * 60 * 1000 // 5 minutos
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: api.listAgents,
    staleTime: 30 * 1000 // 30 segundos
  });
}

export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => api.getAgent(agentId),
    enabled: !!agentId
  });
}

export function useAgentConfig(agentId: string, options?: LoadAgentInput) {
  return useQuery({
    queryKey: ['agentConfig', agentId, options],
    queryFn: () => api.loadAgentConfig(agentId, options),
    enabled: !!agentId
  });
}

// Mutation hooks

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAgentInput) => api.createAgent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, payload }: { agentId: string; payload: UpdateAgentInput }) =>
      api.updateAgent(agentId, payload),
    onSuccess: (_data, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    }
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => api.deleteAgent(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}

export function useDuplicateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, payload }: { agentId: string; payload?: DuplicateAgentInput }) =>
      api.duplicateAgent(agentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
    }
  });
}

export function useActivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => api.activateAgent(agentId),
    onSuccess: (_data, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    }
  });
}

export function useDeactivateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => api.deactivateAgent(agentId),
    onSuccess: (_data, agentId) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
    }
  });
}
