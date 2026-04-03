import { EventEmitter } from 'node:events';

export type AgentMessage = {
  from: string;
  to: string;
  content: string;
  taskId?: string;
  timestamp: string;
};

type MessageListener = (message: AgentMessage) => void;

export class MessageBus {
  private readonly inbox = new Map<string, AgentMessage[]>();
  private readonly emitter = new EventEmitter();

  send(message: Omit<AgentMessage, 'timestamp'>): AgentMessage {
    const payload: AgentMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };

    const messages = this.inbox.get(payload.to) ?? [];
    messages.push(payload);
    this.inbox.set(payload.to, messages);
    this.emitter.emit('message', payload);
    return payload;
  }

  getInbox(agentId: string): AgentMessage[] {
    return this.inbox.get(agentId) ?? [];
  }

  subscribe(listener: MessageListener): () => void {
    this.emitter.on('message', listener);
    return () => this.emitter.off('message', listener);
  }
}

export const messageBus = new MessageBus();
