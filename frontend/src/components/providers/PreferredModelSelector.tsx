import type { CatalogModel } from '../../types/model';

interface PreferredModelSelectorProps {
  models: CatalogModel[];
  selectedModelIds: string[];
  preferredModelId: string | null;
  onPreferredModelChange: (modelId: string) => void;
  missingSelectedModelIds: string[];
  onSaveSelection: () => void;
  isSaving: boolean;
}

export function PreferredModelSelector({
  models,
  selectedModelIds,
  preferredModelId,
  onPreferredModelChange,
  missingSelectedModelIds,
  onSaveSelection,
  isSaving
}: PreferredModelSelectorProps) {
  return (
    <section className="rounded-xl border border-cyan-500/20 bg-slate-950/70 p-4 font-mono text-sm text-cyan-100">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">Preferred model</h3>
        <button type="button" onClick={onSaveSelection} disabled={isSaving || models.length === 0} className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 disabled:opacity-40">
          {isSaving ? 'Saving...' : 'Save preferred model'}
        </button>
      </div>

      {models.length === 0 ? (
        <p className="mt-3 text-cyan-300/70">No synced models yet. Run sync to populate the catalog.</p>
      ) : (
        <div className="mt-3 grid gap-2">
          {models.map((model) => (
            <label key={model.id} className="flex items-center gap-3 rounded border border-cyan-500/10 bg-slate-900/60 p-3">
              <input
                type="radio"
                name="preferred-model"
                checked={preferredModelId === model.modelId || (!preferredModelId && selectedModelIds[0] === model.modelId)}
                onChange={() => onPreferredModelChange(model.modelId)}
              />
              <span className="flex-1">
                <span className="block text-cyan-100">{model.displayName}</span>
                <span className="text-xs text-cyan-300/70">{model.modelId}</span>
              </span>
            </label>
          ))}
        </div>
      )}

      {missingSelectedModelIds.length > 0 && (
        <p className="mt-3 text-xs text-yellow-300">Previously selected models are missing after sync: {missingSelectedModelIds.join(', ')}</p>
      )}
    </section>
  );
}
