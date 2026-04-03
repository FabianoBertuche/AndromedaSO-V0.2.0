import { FastifyPluginAsync } from 'fastify';
import { agentEvolutionService } from '../evolution/evolutionService';
import { agentPool } from '../services/orchestrator/AgentPool';
import { conflictResolution } from '../services/orchestrator/ConflictResolution';
import { messageBus } from '../services/orchestrator/MessageBus';
import { orchestratorState } from '../services/orchestrator/OrchestratorState';
import { taskDecomposer } from '../services/orchestrator/TaskDecomposer';

function writeSseEvent(raw: NodeJS.WritableStream, event: string, data: unknown) {
  raw.write(`event: ${event}\n`);
  raw.write(`data: ${JSON.stringify(data)}\n\n`);
}

export const orchestratorRoutes: FastifyPluginAsync = async (server) => {
  server.post('/tasks/multi', async (request, reply) => {
    const body = request.body as { task?: string };
    if (!body?.task || body.task.trim().length === 0) {
      return reply.status(400).send({ error: 'task is required' });
    }

    const subtasks = taskDecomposer.decompose(body.task);
    const assignments = agentPool.assign(subtasks);

    for (const assignment of assignments) {
      const budgetCheck = agentEvolutionService.spendBudget(assignment.agentId, 10);
      if (!budgetCheck.allowed) {
        return reply.status(429).send({
          error: 'Budget limit exceeded during multi-task orchestration',
          blockedAgent: assignment.agentId,
          budget: budgetCheck
        });
      }
    }

    const snapshot = orchestratorState.create(body.task, subtasks, assignments);

    const plannerId = assignments.find((item) => item.role === 'planner')?.agentId ?? 'agent-planner';
    assignments
      .filter((item) => item.agentId !== plannerId)
      .forEach((agent) => {
        const dispatch = messageBus.send({
          from: plannerId,
          to: agent.agentId,
          content: `Execute ${agent.capability} subtask for ${snapshot.taskId}`,
          taskId: snapshot.taskId
        });
        orchestratorState.appendMessage(snapshot.taskId, dispatch);
      });

    const forceConflict = body.task.toLowerCase().includes('conflict');
    const votes = forceConflict
      ? [
        { option: 'approve', agentId: 'agent-review' },
        { option: 'revise', agentId: 'agent-code' }
      ]
      : [
        { option: 'approve', agentId: 'agent-review' },
        { option: 'approve', agentId: 'agent-code' },
        { option: 'revise', agentId: 'agent-copy' }
      ];

    const resolution = conflictResolution.resolve(votes);
    if (resolution.requiresHumanFallback) {
      orchestratorState.setHumanFallback(snapshot.taskId);
    } else {
      orchestratorState.setCompleted(snapshot.taskId);
    }

    const latest = orchestratorState.get(snapshot.taskId);
    return {
      taskId: snapshot.taskId,
      subtasks,
      resolution,
      requiresHumanFallback: latest?.requiresHumanFallback ?? false
    };
  });

  server.get('/tasks/:id/orchestration', async (request, reply) => {
    const { id } = request.params as { id: string };
    const snapshot = orchestratorState.get(id);
    if (!snapshot) {
      return reply.status(404).send({ error: 'Task orchestration not found' });
    }

    return {
      tree: snapshot.tree,
      agentStates: snapshot.agentStates,
      messages: snapshot.messages,
      requiresHumanFallback: snapshot.requiresHumanFallback
    };
  });

  server.post('/agents/:id/message', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { to?: string; content?: string; taskId?: string };

    if (!body?.to || !body?.content) {
      return reply.status(400).send({ error: 'to and content are required' });
    }

    const delivered = messageBus.send({ from: id, to: body.to, content: body.content, taskId: body.taskId });
    if (body.taskId) {
      orchestratorState.appendMessage(body.taskId, delivered);
    }
    return { delivered: true };
  });

  server.get('/agents/:id/inbox', async (request) => {
    const { id } = request.params as { id: string };
    return { agentId: id, messages: messageBus.getInbox(id) };
  });

  server.get('/orchestrator/status', async () => {
    const snapshots = orchestratorState.list();
    const activeTeams = snapshots.filter((snapshot) => snapshot.state !== 'completed').length;
    const pending = snapshots
      .flatMap((snapshot) => snapshot.subtasks)
      .filter((subtask) => subtask.status === 'pending' || subtask.status === 'running').length;

    return {
      activeTeams,
      pending
    };
  });

  server.get('/orchestrator/:taskId/stream', async (request, reply) => {
    const { taskId } = request.params as { taskId: string };

    reply.hijack();
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    });

    const heartbeat = setInterval(() => {
      writeSseEvent(reply.raw, 'heartbeat', { taskId, at: new Date().toISOString() });
    }, 5000);

    const current = orchestratorState.get(taskId);
    if (current) {
      writeSseEvent(reply.raw, 'snapshot', current);
    }

    const unsubState = orchestratorState.subscribe((snapshot) => {
      if (snapshot.taskId === taskId) {
        writeSseEvent(reply.raw, 'snapshot', snapshot);
      }
    });

    const unsubMessages = messageBus.subscribe((message) => {
      if (message.taskId === taskId) {
        writeSseEvent(reply.raw, 'message', message);
      }
    });

    request.raw.on('close', () => {
      clearInterval(heartbeat);
      unsubState();
      unsubMessages();
      reply.raw.end();
    });
  });
};
