import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ConnectionTestPanel } from '../components/providers/ConnectionTestPanel';
import { PreferredModelSelector } from '../components/providers/PreferredModelSelector';
import { VariantCatalogPanel } from '../components/providers/VariantCatalogPanel';
import { VariantConnectionForm } from '../components/providers/VariantConnectionForm';
import { VariantHealthSummary } from '../components/providers/VariantHealthSummary';
import { useLlmConnectionConsole } from '../hooks/useLlmConnectionConsole';
import type {
  Provider,
  ProviderConnectionTestRequest,
  ProviderConsoleSavePayload,
  ProviderVariantCatalogItem
} from '../types/model';

type FormValues = Record<string, string>;

function buildInitialValues(variant: ProviderVariantCatalogItem | null, provider: Provider | null): FormValues {
  if (!variant) {
    return {};
  }

  return {
    apiKey: '',
    baseUrl: provider?.baseUrl ?? (variant.variant === 'ollama' ? 'http://localhost:11434' : ''),
    organization: '',
    callbackUrl: '',
    code: '',
    state: '',
    redirectUri: ''
  };
}

function hasOauthCompletionValues(values: FormValues): boolean {
  return Boolean(values.callbackUrl.trim()) || Boolean(values.code.trim() && values.state.trim());
}

function canSaveVariant(variant: ProviderVariantCatalogItem | null, values: FormValues): boolean {
  if (!variant) {
    return false;
  }

  if (variant.authMode === 'oauth-manual') {
    return hasOauthCompletionValues(values);
  }

  return (variant.requiredFields ?? []).every((fieldName) => {
    if (fieldName === 'callbackUrl|code+state') {
      return hasOauthCompletionValues(values);
    }

    return Boolean(values[fieldName]?.trim());
  });
}

function buildConnectionTestPayload(variant: ProviderVariantCatalogItem, values: FormValues): ProviderConnectionTestRequest {
  if (variant.authMode === 'oauth-manual') {
    return {
      variant: variant.variant,
      auth: {
        mode: 'oauth-manual',
        callbackUrl: values.callbackUrl.trim() || undefined,
        code: values.code.trim() || undefined,
        state: values.state.trim() || undefined
      }
    };
  }

  return {
    variant: variant.variant,
    config: {
      apiKey: values.apiKey.trim() || undefined,
      baseUrl: values.baseUrl.trim() || undefined,
      organization: values.organization.trim() || undefined
    }
  };
}

function buildSavePayload(
  variant: ProviderVariantCatalogItem,
  values: FormValues,
  activeProvider: Provider | null,
  selectedModelIds: string[]
): ProviderConsoleSavePayload {
  if (variant.authMode === 'oauth-manual') {
    return {
      variant: variant.variant,
      name: activeProvider?.name,
      selectedModelIds,
      auth: {
        mode: 'oauth-manual',
        callbackUrl: values.callbackUrl.trim() || undefined,
        code: values.code.trim() || undefined,
        state: values.state.trim() || undefined
      }
    };
  }

  return {
    variant: variant.variant,
    name: activeProvider?.name,
    selectedModelIds,
    config: {
      apiKey: values.apiKey.trim() || undefined,
      baseUrl: values.baseUrl.trim() || undefined,
      organization: values.organization.trim() || undefined
    }
  };
}

export function LlmConnectionConsole() {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [activeProviderId, setActiveProviderId] = useState<string | null>(null);
  const consoleState = useLlmConnectionConsole(activeProviderId);

  const variants = consoleState.variantCatalogQuery.data?.variants ?? [];
  const providers = consoleState.providersQuery.data?.providers ?? [];
  const activeProvider = useMemo(
    () => providers.find((provider) => provider.variant === selectedVariant) ?? null,
    [providers, selectedVariant]
  );
  const activeVariant = variants.find((variant) => variant.variant === selectedVariant) ?? null;
  const [formValues, setFormValues] = useState<FormValues>({});
  const [preferredModelId, setPreferredModelId] = useState<string | null>(null);

  useEffect(() => {
    if (variants.length === 0) {
      setSelectedVariant(null);
      return;
    }

    if (selectedVariant && variants.some((variant) => variant.variant === selectedVariant)) {
      return;
    }

    setSelectedVariant(variants[0].variant);
  }, [selectedVariant, variants]);

  useEffect(() => {
    setActiveProviderId(activeProvider?.id ?? null);
  }, [activeProvider?.id]);

  useEffect(() => {
    setFormValues(buildInitialValues(activeVariant, activeProvider));
  }, [activeProvider, activeVariant]);

  useEffect(() => {
    const selectedModelIds = consoleState.catalogQuery.data?.selectedModelIds ?? [];
    setPreferredModelId(selectedModelIds[0] ?? null);
  }, [consoleState.catalogQuery.data?.selectedModelIds]);

  const catalogModels = consoleState.catalogQuery.data?.models ?? [];
  const selectedModelIds = consoleState.catalogQuery.data?.selectedModelIds ?? [];
  const missingSelectedModelIds = selectedModelIds.filter(
    (modelId) => !catalogModels.some((model) => model.modelId === modelId)
  );
  const canSave = canSaveVariant(activeVariant, formValues);

  const handleFieldChange = (field: string, value: string) => {
    setFormValues((currentValues) => ({
      ...currentValues,
      [field]: value
    }));
  };

  const handleTestConnection = () => {
    if (!activeVariant) {
      return;
    }

    void consoleState.testConnectionMutation.mutateAsync(buildConnectionTestPayload(activeVariant, formValues));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeVariant || !canSave) {
      return;
    }

    if (activeVariant.authMode === 'oauth-manual') {
      const callbackUrl = formValues.callbackUrl.trim();

      if (callbackUrl) {
        void consoleState.completeOAuthMutation.mutateAsync({ callbackUrl });
        return;
      }

      void consoleState.completeOAuthMutation.mutateAsync({
        code: formValues.code.trim(),
        state: formValues.state.trim()
      });
      return;
    }

    void consoleState.saveProviderMutation.mutateAsync(
      buildSavePayload(activeVariant, formValues, activeProvider, selectedModelIds)
    );
  };

  const handleStartOAuth = () => {
    void consoleState.startOAuthSessionMutation.mutateAsync({
      origin: window.location.origin
    });
  };

  const handleSyncModels = () => {
    if (!activeProviderId) {
      return;
    }

    void consoleState.syncModelsMutation.mutateAsync(activeProviderId);
  };

  const handleSavePreferredModel = () => {
    if (!activeProviderId) {
      return;
    }

    void consoleState.savePreferredModelMutation.mutateAsync({
      providerId: activeProviderId,
      preferredModelId,
      selectedModelIds
    });
  };

  if (consoleState.providersQuery.isLoading || consoleState.variantCatalogQuery.isLoading) {
    return (
      <section className="rounded-[1.75rem] border border-cyan-500/20 bg-slate-950/80 p-6 font-mono text-cyan-100 shadow-[0_0_40px_rgba(34,211,238,0.12)]">
        Loading provider console...
      </section>
    );
  }

  if (consoleState.providersQuery.error || consoleState.variantCatalogQuery.error) {
    const error = (consoleState.providersQuery.error ?? consoleState.variantCatalogQuery.error) as Error;

    return (
      <section className="rounded-[1.75rem] border border-red-500/30 bg-red-500/10 p-6 font-mono text-red-200 shadow-[0_0_30px_rgba(239,68,68,0.12)]">
        {error.message || 'Unable to load the provider console.'}
      </section>
    );
  }

  if (!activeVariant) {
    return (
      <section className="rounded-[1.75rem] border border-yellow-500/30 bg-yellow-500/10 p-6 font-mono text-yellow-100 shadow-[0_0_30px_rgba(234,179,8,0.12)]">
        No provider variants are registered for the Models console.
      </section>
    );
  }

  return (
    <section className="space-y-6 rounded-[2rem] border border-cyan-400/25 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.16),_transparent_38%),radial-gradient(circle_at_right,_rgba(34,211,238,0.14),_transparent_30%),linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,0.92))] p-4 shadow-[0_0_60px_rgba(34,211,238,0.08)] md:p-6">
      <header className="space-y-3 font-mono">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300/80">Models Console</p>
        <div className="space-y-2">
          <h2 className="text-3xl text-cyan-50 md:text-4xl">Provider and model management</h2>
          <p className="max-w-3xl text-sm leading-6 text-cyan-200/75">
            Configure provider variants, validate connection details, sync catalog snapshots, inspect health, and choose the preferred model without leaving the Models workflow.
          </p>
        </div>
      </header>

      {consoleState.incompatibleProviders.length > 0 && (
        <div className="rounded-[1.5rem] border border-yellow-400/25 bg-yellow-500/10 p-4 font-mono text-sm text-yellow-100 shadow-[0_0_30px_rgba(250,204,21,0.08)]">
          Incompatible saved providers were detected and hidden from the variant-first console: {consoleState.incompatibleProviders.map((provider) => provider.name).join(', ')}.
        </div>
      )}

      <VariantCatalogPanel
        variants={variants}
        selectedVariant={selectedVariant}
        savedProviders={providers}
        onSelectVariant={setSelectedVariant}
      />

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <VariantConnectionForm
            variant={activeVariant}
            values={formValues}
            onFieldChange={handleFieldChange}
            onTestConnection={handleTestConnection}
            onSubmit={handleSubmit}
            onStartOAuth={handleStartOAuth}
            isSaving={consoleState.saveProviderMutation.isPending || consoleState.completeOAuthMutation.isPending}
            isTesting={consoleState.testConnectionMutation.isPending}
            canSave={canSave}
            oauthSession={consoleState.startOAuthSessionMutation.data ?? null}
            saveLabel={activeVariant.authMode === 'oauth-manual' ? 'Complete OAuth and save' : activeProvider ? 'Update provider' : 'Save provider'}
          />

          <ConnectionTestPanel
            result={consoleState.testConnectionMutation.data ?? null}
            error={(consoleState.testConnectionMutation.error as Error | null) ?? null}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4 font-mono text-sm text-cyan-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-cyan-100">Catalog sync</h3>
                <p className="mt-1 text-xs text-cyan-300/70">
                  {activeProvider ? 'Refresh the saved provider catalog before choosing the preferred model.' : 'Save this provider to enable catalog sync and model selection.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSyncModels}
                disabled={!activeProviderId || consoleState.syncModelsMutation.isPending}
                className="rounded border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100 disabled:opacity-40"
              >
                {consoleState.syncModelsMutation.isPending ? 'Syncing...' : 'Sync models'}
              </button>
            </div>
            <p className="mt-3 text-xs text-cyan-200/80">Synced models: {catalogModels.length}</p>
            {consoleState.syncModelsMutation.error && (
              <p className="mt-3 rounded border border-red-500/30 bg-red-500/5 p-3 text-red-200">
                {(consoleState.syncModelsMutation.error as Error).message}
              </p>
            )}
          </div>

          <VariantHealthSummary provider={activeProvider} healthDetails={consoleState.healthQuery.data?.healthDetails} />

          <PreferredModelSelector
            models={catalogModels}
            selectedModelIds={selectedModelIds}
            preferredModelId={preferredModelId}
            onPreferredModelChange={setPreferredModelId}
            missingSelectedModelIds={missingSelectedModelIds}
            onSaveSelection={handleSavePreferredModel}
            isSaving={consoleState.savePreferredModelMutation.isPending}
          />
        </div>
      </div>
    </section>
  );
}
