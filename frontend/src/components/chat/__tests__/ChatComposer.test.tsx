import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChatComposer } from '../ChatComposer';

describe('ChatComposer', () => {
  it('blocks send without useful text, without a model, or while loading', async () => {
    const user = userEvent.setup();
    const onDraftChange = vi.fn();
    const onSend = vi.fn();

    const { rerender } = render(
      <ChatComposer
        draft="   "
        hasSelectedModel
        isSending={false}
        canClear={false}
        errorMessage={null}
        onDraftChange={onDraftChange}
        onSend={onSend}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();

    rerender(
      <ChatComposer
        draft="hello"
        hasSelectedModel={false}
        isSending={false}
        canClear={false}
        errorMessage={null}
        onDraftChange={onDraftChange}
        onSend={onSend}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled();

    rerender(
      <ChatComposer
        draft="hello"
        hasSelectedModel
        isSending
        canClear
        errorMessage="Provider is unavailable or unreachable."
        onDraftChange={onDraftChange}
        onSend={onSend}
        onClear={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled();
    expect(screen.getByText(/provider is unavailable or unreachable/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/message/i), ' test');

    expect(onDraftChange).toHaveBeenCalled();
    expect(onSend).not.toHaveBeenCalled();
  });
});
