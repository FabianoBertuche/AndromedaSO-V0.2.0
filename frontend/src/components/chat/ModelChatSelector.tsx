import type { ChatModelOption } from '../../types/model';

type ModelChatSelectorProps = {
  options: ChatModelOption[];
  selectedModelId: string | null;
  disabled: boolean;
  onSelectModel: (modelId: string) => void;
};

export function ModelChatSelector({ options, selectedModelId, disabled, onSelectModel }: ModelChatSelectorProps) {
  return (
    <label className="flex flex-col gap-2 font-mono text-sm text-cyan-100">
      <span className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Model</span>
      <select
        aria-label="Model"
        value={selectedModelId ?? ''}
        disabled={disabled || options.length === 0}
        onChange={(event) => onSelectModel(event.target.value)}
        className="rounded-2xl border border-cyan-400/30 bg-slate-950/80 px-4 py-3 text-sm text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.15)] outline-none transition focus:border-emerald-400/60"
      >
        {options.length === 0 ? (
          <option value="">No synced models available</option>
        ) : (
          options.map((option) => (
            <option key={`${option.providerId}:${option.modelId}`} value={option.modelId}>
              {option.label}
            </option>
          ))
        )}
      </select>
    </label>
  );
}
