import { EventEmitter } from 'node:events';
import { randomUUID } from 'node:crypto';
import type { AgentAssignment } from './AgentPool';
import type { AgentMessage } from './MessageBus';
import type { DecomposedSubtask } from './TaskDecomposer';

export type TaskNode = {
  id: string;
  title: string;
  state: 'pending' | 'running' | 'completed' | 'blocked' | 'human_fallback';
  assignee?: string;
  children?: TaskNode[];
};

export type AgentState = {
  id: string;
  role: string;
  capability: string;
  reputation: number;
  status: 'idle' | 'planning' | 'collaborating' | 'blocked' | 'waiting_human' | 'done';
};

export type OrchestrationSnapshot = {
  taskId: string;
  originalTask: string;
  state: 'decomposed' | 'collaborating' | 'conflict' | 'human_fallback' | 'completed';
  tree: TaskNode[];
  agentStates: AgentState[];
  subtasks: DecomposedSubtask[];
  messages: AgentMessage[];
  requiresHumanFallback: boolean;
  createdAt: string;
  updatedAt: string;
};

type OrchestrationListener = (snapshot: OrchestrationSnapshot) => void;

export class OrchestratorState {
  private readonly snapshots = new Map<string, OrchestrationSnapshot>();
  private readonly emitter = new EventEmitter();

  create(task: string, subtasks: DecomposedSubtask[], assignments: AgentAssignment[]): OrchestrationSnapshot {
    const taskId = randomUUID();
    const createdAt = new Date().toISOString();

    const rootNode: TaskNode = {
      id: `root-${taskId}`,
      title: task,
      state: 'running',
      children: subtasks.map((subtask) => ({
        id: subtask.id,
        title: subtask.title,
        state: subtask.status,
        assignee: assignments.find((agent) => agent.capability === subtask.capability)?.agentId
      }))
    };

    const snapshot: OrchestrationSnapshot = {
      taskId,
      originalTask: task,
      state: 'decomposed',
      tree: [rootNode],
      agentStates: assignments.map((assignment) => ({
        id: assignment.agentId,
        role: assignment.role,
        capability: assignment.capability,
        reputation: assignment.reputation,
        status: assignment.role === 'planner' ? 'planning' : 'idle'
      })),
      subtasks,
      messages: [],
      requiresHumanFallback: false,
      createdAt,
      updatedAt: createdAt
    };

    this.snapshots.set(taskId, snapshot);
    this.emit(snapshot);
    return snapshot;
  }

  get(taskId: string): OrchestrationSnapshot | null {
    return this.snapshots.get(taskId) ?? null;
  }

  list(): OrchestrationSnapshot[] {
    return [...this.snapshots.values()];
  }

  appendMessage(taskId: string, message: AgentMessage) {
    const snapshot = this.snapshots.get(taskId);
    if (!snapshot) {
      return;
    }

    snapshot.messages.push(message);
    snapshot.state = 'collaborating';
    snapshot.updatedAt = new Date().toISOString();
    this.emit(snapshot);
  }

  setHumanFallback(taskId: string) {
    const snapshot = this.snapshots.get(taskId);
    if (!snapshot) {
      return;
    }

    snapshot.state = 'human_fallback';
    snapshot.requiresHumanFallback = true;
    snapshot.tree[0].state = 'human_fallback';
    snapshot.agentStates = snapshot.agentStates.map((agent) => ({
      ...agent,
      status: agent.role === 'planner' ? 'waiting_human' : agent.status
    }));
    snapshot.updatedAt = new Date().toISOString();
    this.emit(snapshot);
  }

  setCompleted(taskId: string) {
    const snapshot = this.snapshots.get(taskId);
    if (!snapshot) {
      return;
    }

    snapshot.state = 'completed';
    snapshot.tree[0].state = 'completed';
    if (snapshot.tree[0].children) {
      snapshot.tree[0].children = snapshot.tree[0].children.map((child) => ({
        ...child,
        state: 'completed'
      }));
    }
    snapshot.agentStates = snapshot.agentStates.map((agent) => ({ ...agent, status: 'done' }));
    snapshot.updatedAt = new Date().toISOString();
    this.emit(snapshot);
  }

  subscribe(listener: OrchestrationListener): () => void {
    this.emitter.on('snapshot', listener);
    return () => this.emitter.off('snapshot', listener);
  }

  private emit(snapshot: OrchestrationSnapshot) {
    this.emitter.emit('snapshot', snapshot);
  }
}

export const orchestratorState = new OrchestratorState();
