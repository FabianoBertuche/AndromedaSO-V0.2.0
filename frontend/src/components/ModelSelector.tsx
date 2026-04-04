interface FlatCatalogModel {
  modelId: string;
  displayName: string;
  providerId: string;
  providerName: string;
}

interface ModelSelectorProps {
  models: FlatCatalogModel[];
  value: string | null;
  onChange: (modelId: string) => void;
}

export function ModelSelector({ models, value, onChange }: ModelSelectorProps) {
  if (models.length === 0) {
    return (
      <p className="font-mono text-sm text-slate-400">
        Nenhum modelo disponível. Sincronize um provider primeiro.
      </p>
    );
  }

  // Group by provider
  const grouped = models.reduce<Record<string, FlatCatalogModel[]>>((acc, model) => {
    const key = model.providerName;
    if (!acc[key]) acc[key] = [];
    acc[key].push(model);
    return acc;
  }, {});

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="rounded bg-slate-900/80 p-2 font-mono text-cyan-100"
    >
      <option value="" disabled>Selecione um modelo...</option>
      {Object.entries(grouped).map(([providerName, providerModels]) => (
        <optgroup key={providerName} label={providerName}>
          {providerModels.map((model) => (
            <option key={model.modelId} value={model.modelId}>
              {model.displayName}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
