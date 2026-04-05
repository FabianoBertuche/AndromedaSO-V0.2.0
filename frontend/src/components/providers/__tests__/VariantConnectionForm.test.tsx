import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VariantConnectionForm } from '../VariantConnectionForm';

const baseProps = {
  values: {},
  onFieldChange: vi.fn(),
  onTestConnection: vi.fn(),
  onSubmit: vi.fn((event) => event.preventDefault()),
  onStartOAuth: vi.fn(),
  isSaving: false,
  isTesting: false,
  canSave: true,
  oauthSession: null,
  saveLabel: 'Save configuration'
} as const;

describe('VariantConnectionForm', () => {
  it('renders non-oauth fields from catalog metadata', () => {
    render(<VariantConnectionForm {...baseProps} variant={{ variant: 'openai-api', authMode: 'api-key', displayName: 'OpenAI API', requiredFields: ['apiKey'], optionalFields: ['baseUrl', 'organization'], capabilities: [] }} />);

    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/base url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/organization/i)).toBeInTheDocument();
  });

  it('renders oauth-manual fields from contract metadata without a raw secret input', () => {
    render(<VariantConnectionForm {...baseProps} variant={{ variant: 'openai-oauth', authMode: 'oauth-manual', displayName: 'OpenAI OAuth', requiredFields: ['callbackUrl|code+state'], optionalFields: ['redirectUri'], capabilities: [] }} />);

    expect(screen.getByText(/manual oauth/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/api key/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/callback url/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/authorization code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/oauth state/i)).toBeInTheDocument();
  });

  it('renders ollama with required baseUrl', () => {
    render(<VariantConnectionForm {...baseProps} variant={{ variant: 'ollama', authMode: 'base-url', displayName: 'Ollama', requiredFields: ['baseUrl'], optionalFields: [], capabilities: [] }} />);

    const baseUrlInput = screen.getByLabelText(/base url/i);
    expect(baseUrlInput).toBeRequired();
  });
});
