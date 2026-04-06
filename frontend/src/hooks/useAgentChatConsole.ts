import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AgentInstance, ChatMessage } from '../types/kernel.js';
import { chatWithAgent } from '../api/kernel.js';
import { useAgents } from './useAgents.js';

function createChatMessageId(): string {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readErrorMessage(error: unknown): string {
  const fallbackMessage = 'Unable to send the message right now. Please try again.';

  if (error instanceof Error) {
    const trimmedMessage = error.message.trim();
    if (!trimmedMessage) return fallbackMessage;
    
    // Check for agent-specific errors
    if (trimmedMessage.includes('not active')) {
      return 'This agent is not active. Please activate it first.';
    }
    if (trimmedMessage.includes('does not have a preferred model')) {
      return 'This agent does not have a configured model. Please configure a model in the agent settings.';
    }
    
    return trimmedMessage;
  }

  return fallbackMessage;
}

export type AgentChatOption = {
  id: string;
  name: string;
  slug: string;
  description: string;
  preferredModel: string | null;
  status: string;
};

export function useAgentChatConsole(): {
  agentOptions: AgentChatOption[];
  selectedAgentId: string | null;
  selectedAgent: AgentChatOption | null;
  messages: ChatMessage[];
  draft: string;
  isLoadingAgents: boolean;
  isSending: boolean;
  errorMessage: string | null;
  agentsError: Error | null;
  agentNotices: string[];
  hasConfiguredModel: boolean;
  setDraft: (value: string) => void;
  selectAgent: (agentId: string) => void;
  sendMessage: () => Promise<void>;
  clearConversation: () => void;
} {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const agentsQuery = useAgents();

  const agentOptions = useMemo(() => {
    if (!agentsQuery.data) return [];
    const agents = Array.isArray(agentsQuery.data) ? agentsQuery.data : agentsQuery.data.agents;
    if (!agents) return [];

    return agents
      .filter((agent: AgentInstance) => agent.status === 'active' || agent.status === 'disabled')
      .map((agent: AgentInstance): AgentChatOption => ({
        id: agent.id,
        name: agent.name,
        slug: agent.slug,
        description: agent.shortDescription || agent.longDescription,
        preferredModel: agent.preferredModel,
        status: agent.status
      }));
  }, [agentsQuery.data]);

  const agentNotices = useMemo(() => {
    const notices: string[] = [];
    if (agentsQuery.error) {
      notices.push('Unable to load agents. Please try again later.');
    }
    return notices;
  }, [agentsQuery.error]);

  const selectedAgent = useMemo(() => {
    return agentOptions.find((agent) => agent.id === selectedAgentId) ?? null;
  }, [agentOptions, selectedAgentId]);

  const hasConfiguredModel = useMemo(() => {
    return selectedAgent?.preferredModel !== null && selectedAgent?.preferredModel !== undefined;
  }, [selectedAgent]);

  useEffect(() => {
    if (agentOptions.length === 0) {
      setSelectedAgentId(null);
      return;
    }
    if (selectedAgentId && agentOptions.some((agent) => agent.id === selectedAgentId)) {
      return;
    }
    setSelectedAgentId(agentOptions[0].id);
  }, [agentOptions, selectedAgentId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setErrorMessage(null);
  }, []);

  const selectAgent = useCallback((agentId: string) => {
    setSelectedAgentId((currentAgentId) => {
      if (currentAgentId === agentId) {
        return currentAgentId;
      }
      setMessages([]);
      setErrorMessage(null);
      return agentId;
    });
  }, []);

  const sendMessage = useCallback(async () => {
    const trimmedDraft = draft.trim();

    if (!selectedAgent || !trimmedDraft || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createChatMessageId(),
      role: 'user',
      content: trimmedDraft
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setErrorMessage(null);
    setIsSending(true);

    try {
      const response = await chatWithAgent(selectedAgent.id, {
        messages: nextMessages.map((message) => ({
          role: message.role,
          content: message.content
        }))
      });

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createChatMessageId(),
          role: 'assistant',
          content: response.message.content
        }
      ]);
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, messages, selectedAgent]);

  return {
    agentOptions,
    selectedAgentId,
    selectedAgent,
    messages,
    draft,
    isLoadingAgents: agentsQuery.isLoading,
    isSending,
    errorMessage,
    agentsError: agentsQuery.error as Error | null,
    agentNotices,
    hasConfiguredModel,
    setDraft,
    selectAgent,
    sendMessage,
    clearConversation
  };
}
