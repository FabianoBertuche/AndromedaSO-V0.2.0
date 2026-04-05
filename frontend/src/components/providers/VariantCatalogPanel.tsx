import type { Provider, ProviderVariantCatalogItem } from '../../types/model';

interface VariantCatalogPanelProps {
  variants: ProviderVariantCatalogItem[];
  selectedVariant: string | null;
  savedProviders: Provider[];
  onSelectVariant: (variant: string) => void;
}

export function VariantCatalogPanel({ variants, selectedVariant, savedProviders, onSelectVariant }: VariantCatalogPanelProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {variants.map((variant) => {
        const provider = savedProviders.find((item) => item.variant === variant.variant);
        const isSelected = selectedVariant === variant.variant;

        return (
          <button
            key={variant.variant}
            type="button"
            onClick={() => onSelectVariant(variant.variant)}
            className={`rounded-xl border p-4 text-left font-mono transition ${isSelected
              ? 'border-cyan-300 bg-cyan-500/10 text-cyan-100'
              : 'border-cyan-900/70 bg-slate-950/70 text-cyan-200 hover:border-cyan-500/50'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold">{variant.displayName}</h3>
              <span className="rounded border border-emerald-500/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-emerald-300">
                {variant.authMode}
              </span>
            </div>
            <p className="mt-2 text-xs text-cyan-200/70">{variant.description}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-emerald-300/80">
              {(variant.capabilities ?? []).map((capability) => (
                <span key={capability} className="rounded border border-emerald-500/30 px-2 py-0.5">
                  {capability}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-cyan-300/70">
              Saved provider: {provider?.name ?? 'none'}
            </p>
          </button>
        );
      })}
    </div>
  );
}
