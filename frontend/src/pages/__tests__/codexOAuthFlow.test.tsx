import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithQuery } from '../../test/renderWithQuery';
import { OAuthCallbackHandler } from '../OAuthCallbackHandler';

describe('OAuth callback helper', () => {
  it('renders callback helper success data from query params', () => {
    window.history.pushState({}, '', '/oauth/callback?code=test-code&state=test-state');

    renderWithQuery(<OAuthCallbackHandler />);

    expect(screen.getByRole('heading', { name: 'OpenAI OAuth authorization received' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-code')).toBeInTheDocument();
    expect(screen.getByDisplayValue('test-state')).toBeInTheDocument();
  });

  it('renders friendly callback helper errors for missing state and oauth failures', () => {
    window.history.pushState({}, '', '/oauth/callback?code=test-code');
    const { rerender } = renderWithQuery(<OAuthCallbackHandler />);

    expect(screen.getByText(/callback is incomplete/i)).toBeInTheDocument();

    window.history.pushState({}, '', '/oauth/callback?error=access_denied&error_description=missing_codex_entitlement');
    rerender(<OAuthCallbackHandler />);

    expect(screen.getByText(/ask your workspace administrator to enable openai oauth access/i)).toBeInTheDocument();
  });
});
