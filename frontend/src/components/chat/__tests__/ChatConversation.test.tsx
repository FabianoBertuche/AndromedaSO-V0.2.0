import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChatConversation } from '../ChatConversation';

describe('ChatConversation', () => {
  it('renders distinct user and assistant messages', () => {
    render(
      <ChatConversation
        messages={[
          { id: '1', role: 'user', content: 'Hello operator' },
          { id: '2', role: 'assistant', content: 'Hello from the model' }
        ]}
      />
    );

    expect(screen.getByTestId('chat-message-user')).toHaveTextContent('Hello operator');
    expect(screen.getByTestId('chat-message-assistant')).toHaveTextContent('Hello from the model');
  });
});
