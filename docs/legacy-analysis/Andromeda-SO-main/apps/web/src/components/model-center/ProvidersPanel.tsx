import React, { useState } from 'react';
import { useTooltipText } from '../../contexts/I18nContext';

export const ProvidersPanel: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const tooltip = useTooltipText();

    const handleSync = async (id: string) => {
        setLoading(true);
        try {
            await fetch(`/model-center/providers/${id}/sync`, { method: 'POST' });
            alert("Modelos sincronizados com sucesso!");
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="text-blue-500 text-3xl">🖧</span> Providers Registry
            </h2>
            <div className="space-y-4">
                <div className="p-5 bg-slate-800 rounded-lg border border-slate-600 flex justify-between items-center hover:border-slate-500 transition-colors">
                    <div>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                            Ollama Local
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 font-mono">http://localhost:11434</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full text-xs font-medium tracking-wide">
                            HEALTHY
                        </span>
                        <button
                            onClick={() => handleSync("ollama-local-id")}
                            disabled={loading}
                            title={tooltip('modelCenter.providers.sync')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                        >
                            {loading ? "Sincronizando..." : "Sincronizar Modelos"}
                        </button>
                    </div>
                </div>
            </div>

            <button title={tooltip('modelCenter.providers.add')} className="mt-6 px-4 py-3 border border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-blue-500 hover:bg-blue-500/5 rounded-lg transition-all w-full flex justify-center items-center gap-2">
                <span className="text-xl">+</span> Adicionar Provider (Em breve)
            </button>
        </div>
    );
};
