import type { FormEvent } from 'react';
import type { CreateOpenAiCodexOAuthSessionResponse } from '../../api/kernel';
import type { ProviderConsoleFieldName, ProviderVariantCatalogItem } from '../../types/model';

interface VariantConnectionFormProps {
  variant: ProviderVariantCatalogItem;
  values: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onTestConnection: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStartOAuth: () => void;
  isSaving: boolean;
  isTesting: boolean;
  canSave: boolean;
  oauthSession: CreateOpenAiCodexOAuthSessionResponse | null;
  saveLabel: string;
}

type FieldDefinition = {
  field: ProviderConsoleFieldName;
  label: string;
  placeholder?: string;
  multiline?: boolean;
};

const fieldDefinitions: Record<ProviderConsoleFieldName, FieldDefinition> = {
  apiKey: { field: 'apiKey', label: 'API Key' },
  baseUrl: { field: 'baseUrl', label: 'Base URL', placeholder: 'http://localhost:11434' },
  organization: { field: 'organization', label: 'Organization', placeholder: 'org_...' },
  callbackUrl: { field: 'callbackUrl', label: 'Callback URL', placeholder: 'http://localhost:5173/oauth/callback?code=...&state=...', multiline: true },
  code: { field: 'code', label: 'Authorization code' },
  state: { field: 'state', label: 'OAuth state' },
  redirectUri: { field: 'redirectUri', label: 'Redirect URI' }
};

function normalizeFieldNames(fieldNames: string[]): ProviderConsoleFieldName[] {
  const expandedFieldNames = fieldNames.flatMap((fieldName) => {
    if (fieldName === 'callbackUrl|code+state') {
      return ['callbackUrl', 'code', 'state'] as ProviderConsoleFieldName[];
    }

    return fieldName in fieldDefinitions ? [fieldName as ProviderConsoleFieldName] : [];
  });

  return [...new Set(expandedFieldNames)];
}

function TextField(props: {
  label: string;
  field: string;
  value: string;
  onChange: (field: string, value: string) => void;
  required?: boolean;
  placeholder?: string;
  multiline?: boolean;
}) {
  const inputClassName = 'mt-1 w-full rounded border border-cyan-500/20 bg-slate-950/80 p-2 text-cyan-100';

  return (
    <label className="block text-xs uppercase tracking-wide text-cyan-300/80">
      {props.label}
      {props.multiline ? (
        <textarea
          aria-label={props.label}
          required={props.required}
          value={props.value}
          onChange={(event) => props.onChange(props.field, event.target.value)}
          placeholder={props.placeholder}
          className={`${inputClassName} min-h-24`}
        />
      ) : (
        <input
          aria-label={props.label}
          required={props.required}
          value={props.value}
          onChange={(event) => props.onChange(props.field, event.target.value)}
          placeholder={props.placeholder}
          className={inputClassName}
        />
      )}
    </label>
  );
}

export function VariantConnectionForm({
  variant,
  values,
  onFieldChange,
  onTestConnection,
  onSubmit,
  onStartOAuth,
  isSaving,
  isTesting,
  canSave,
  oauthSession,
  saveLabel
}: VariantConnectionFormProps) {
  const requiredFieldNames = normalizeFieldNames(variant.requiredFields ?? []);
  const optionalFieldNames = normalizeFieldNames(variant.optionalFields ?? []);
  const visibleFieldNames = [...requiredFieldNames, ...optionalFieldNames.filter((fieldName) => !requiredFieldNames.includes(fieldName))];
  const isOauthManual = variant.authMode === 'oauth-manual';

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4 font-mono text-sm text-cyan-100">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-cyan-100">{variant.displayName}</h3>
          <p className="text-xs text-cyan-300/70">Variant: {variant.variant}</p>
        </div>
        <span className="rounded border border-emerald-500/30 px-2 py-1 text-[10px] uppercase tracking-wide text-emerald-300">
          Auth mode: {variant.authMode}
        </span>
      </div>

      <div className="grid gap-3">
        {isOauthManual && (
          <div className="grid gap-3">
            <div className="rounded border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-200">
              <p className="font-semibold uppercase tracking-wide text-cyan-100">Manual OAuth</p>
              <p className="mt-1 text-cyan-200/75">Start the backend-owned OAuth session, then paste back the callback URL or the code and state values. No raw secret is collected.</p>
            </div>

            <button
              type="button"
              onClick={onStartOAuth}
              className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300"
            >
              Start OpenAI OAuth session
            </button>

            {oauthSession && (
              <div className="rounded border border-cyan-500/20 bg-slate-900/70 p-3 text-xs text-cyan-200">
                <p>Authorization URL: {oauthSession.authUrl}</p>
                <p className="mt-1">Redirect URI: {oauthSession.redirectUri}</p>
                <p className="mt-1">Expires at: {new Date(oauthSession.expiresAt).toLocaleString()}</p>
              </div>
            )}

            {visibleFieldNames.includes('callbackUrl') && (
              <TextField
                label={fieldDefinitions.callbackUrl.label}
                field="callbackUrl"
                value={values.callbackUrl ?? ''}
                onChange={onFieldChange}
                required={requiredFieldNames.includes('callbackUrl')}
                placeholder={fieldDefinitions.callbackUrl.placeholder}
                multiline
              />
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {visibleFieldNames.includes('code') && (
                <TextField
                  label={fieldDefinitions.code.label}
                  field="code"
                  value={values.code ?? ''}
                  onChange={onFieldChange}
                  required={requiredFieldNames.includes('code')}
                />
              )}
              {visibleFieldNames.includes('state') && (
                <TextField
                  label={fieldDefinitions.state.label}
                  field="state"
                  value={values.state ?? ''}
                  onChange={onFieldChange}
                  required={requiredFieldNames.includes('state')}
                />
              )}
            </div>
          </div>
        )}

        {!isOauthManual && visibleFieldNames.map((fieldName) => {
          const fieldDefinition = fieldDefinitions[fieldName];

          return (
            <TextField
              key={fieldName}
              label={fieldDefinition.label}
              field={fieldName}
              value={values[fieldName] ?? ''}
              onChange={onFieldChange}
              required={requiredFieldNames.includes(fieldName)}
              placeholder={fieldDefinition.placeholder}
              multiline={fieldDefinition.multiline}
            />
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" onClick={onTestConnection} disabled={isTesting} className="rounded border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">
          {isTesting ? 'Testing...' : 'Test connection'}
        </button>
        <button type="submit" disabled={!canSave || isSaving} className="rounded border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 disabled:opacity-40">
          {isSaving ? 'Saving...' : saveLabel}
        </button>
      </div>
    </form>
  );
}
