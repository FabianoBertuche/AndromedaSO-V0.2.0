import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  createMultiTask,
  fetchOrchestration,
  fetchOrchestratorStatus,
  openOrchestratorStream,
  sendAgentMessage
} from '../api/kernel';
import type { MultiTaskResponse, OrchestrationDetail } from '../types/kernel';

export function useOrchestrator() {
  const [taskId, setTaskId] = useState<string>('');
  const [streamEvents, setStreamEvents] = useState<Array<{ type: string; payload: string }>>([]);

  const createTask = useMutation({
    mutationFn: (task: string) => createMultiTask(task),
    onSuccess: (result: MultiTaskResponse) => {
      setTaskId(result.taskId);
    }
  });

  const orchestration = useQuery({
    queryKey: ['orchestration', taskId],
    queryFn: () => fetchOrchestration(taskId),
    enabled: taskId.length > 0,
    refetchInterval: 2500
  });

  const orchestratorStatus = useQuery({
    queryKey: ['orchestrator-status'],
    queryFn: fetchOrchestratorStatus,
    refetchInterval: 2500
  });

  const messageMutation = useMutation({
    mutationFn: (payload: { from: string; to: string; content: string }) =>
      sendAgentMessage(payload.from, payload.to, payload.content, taskId)
  });

  useEffect(() => {
    if (!taskId) {
      return;
    }

    const stream = openOrchestratorStream(taskId);
    const snapshotHandler = (event: MessageEvent<string>) => {
      setStreamEvents((previous) => [
        ...previous.slice(-49),
        { type: 'snapshot', payload: event.data }
      ]);
    };

    const messageHandler = (event: MessageEvent<string>) => {
      setStreamEvents((previous) => [
        ...previous.slice(-49),
        { type: 'message', payload: event.data }
      ]);
    };

    stream.addEventListener('snapshot', snapshotHandler as EventListener);
    stream.addEventListener('message', messageHandler as EventListener);

    return () => {
      stream.removeEventListener('snapshot', snapshotHandler as EventListener);
      stream.removeEventListener('message', messageHandler as EventListener);
      stream.close();
    };
  }, [taskId]);

  const latestOrchestration: OrchestrationDetail | undefined = orchestration.data;

  return useMemo(() => ({
    taskId,
    createTask,
    orchestration: latestOrchestration,
    orchestrationQuery: orchestration,
    orchestratorStatus,
    streamEvents,
    sendMessage: messageMutation
  }), [taskId, createTask, latestOrchestration, orchestration, orchestratorStatus, streamEvents, messageMutation]);
}
