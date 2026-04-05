import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ModelChatSelector } from '../ModelChatSelector';

describe('ModelChatSelector', () => {
  it('renders disambiguated model options and reports selection changes', async () => {
    const user = userEvent.setup();
    const onSelectModel = vi.fn();

    render(
      <ModelChatSelector
        options={[
          { providerId: 'provider-1', providerName: 'OpenAI Workspace', modelId: 'gpt-4o', displayName: 'GPT-4o', label: 'GPT-4o - openai-api' },
          { providerId: 'provider-2', providerName: 'Local Ollama', modelId: 'qwen2.5:14b', displayName: 'Qwen 2.5 14B', label: 'Qwen 2.5 14B - ollama' }
        ]}
        selectedModelId="gpt-4o"
        disabled={false}
        onSelectModel={onSelectModel}
      />
    );

    expect(screen.getByRole('option', { name: 'GPT-4o - openai-api' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Qwen 2.5 14B - ollama' })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/model/i), 'qwen2.5:14b');

    expect(onSelectModel).toHaveBeenCalledWith('qwen2.5:14b');
  });
});
