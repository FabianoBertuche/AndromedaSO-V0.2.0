import React, { useEffect, useState } from 'react';
import { createGatewayTask, pollGatewayTask } from '../../lib/gateway';
import { useTooltipText } from '../../contexts/I18nContext';

interface CatalogModel {
    id: string;
    providerId: string;
    externalModelId: string;
    displayName: string;
    locality: 'local' | 'cloud';
    capabilities: string[];
    pricing?: {
        inputPer1M?: number;
        outputPer1M?: number;
        currency?: string;
        source?: string;
    };
    scores?: Record<string, number | undefined>;
}

const scoreOrder = ['overall', 'coding', 'chat', 'structured_output', 'reasoning', 'vision'];

export const ModelCatalogPanel: React.FC = () => {
    const tooltip = useTooltipText();
    const [models, setModels] = useState<CatalogModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [playgroundModel, setPlaygroundModel] = useState<CatalogModel | null>(null);
    const [testPrompt, setTestPrompt] = useState('Olá, como você está?');
    const [testResult, setTestResult] = useState('');

    const fetchModels = async () => {
        setLoading(true);
        try {
            const response = await fetch('/model-center/models');
            if (response.ok) {
                const data = await response.json() as CatalogModel[];
                setModels(data);
            }
        } catch (error) {
            console.error('Erro ao buscar catálogo de modelos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchModels();
    }, []);

    const handlePull = async () => {
        const modelName = prompt('Digite o nome do modelo para baixar (ex: llama3, mistral):');
        if (!modelName) return;

        try {
            setLoading(true);
            const response = await fetch('/model-center/providers/ollama-local-id/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ modelName }),
            });

            if (response.ok) {
                alert(`Solicitação de pull para ${modelName} enviada! Aguarde a conclusão.`);
                await fetchModels();
            } else {
                alert('Erro ao solicitar pull do modelo.');
            }
        } catch (error) {
            console.error('Erro no pull:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (providerId: string, name: string) => {
        if (!confirm(`Tem certeza que deseja remover o modelo ${name}?`)) return;

        try {
            setLoading(true);
            const response = await fetch(`/model-center/providers/${providerId}/models/${name}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                await fetchModels();
            } else {
                alert('Erro ao deletar modelo.');
            }
        } catch (error) {
            console.error('Erro ao deletar:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowInfo = async (id: string) => {
        try {
            const response = await fetch(`/model-center/models/${id}`);
            if (response.ok) {
                const info = await response.json();
                alert(JSON.stringify(info, null, 2));
            }
        } catch (error) {
            console.error('Erro ao buscar info:', error);
        }
    };

    const handleTest = async () => {
        if (!playgroundModel) return;
        setTestResult('Processando...');

        try {
            const gatewayResponse = await createGatewayTask({
                channel: 'web',
                session: { id: `playground-${playgroundModel.id}` },
                content: { type: 'text', text: testPrompt },
                metadata: { modelId: playgroundModel.id },
            });

            const taskId = gatewayResponse.task?.id;
            if (!taskId) {
                throw new Error('Gateway não retornou o identificador da task.');
            }

            const status = await pollGatewayTask(taskId);
            setTestResult(status.result?.content || status.result?.error || 'Sem resposta do modelo.');
        } catch (error) {
            setTestResult(`Erro: ${String(error)}`);
        }
    };

    const getScoreEntries = (model: CatalogModel): Array<[string, number]> => {
        const entries = Object.entries(model.scores || {})
            .filter((entry): entry is [string, number] => typeof entry[1] === 'number');

        return entries.sort((left, right) => {
            const leftIndex = scoreOrder.indexOf(left[0]);
            const rightIndex = scoreOrder.indexOf(right[0]);
            return (leftIndex === -1 ? 999 : leftIndex) - (rightIndex === -1 ? 999 : rightIndex);
        });
    };

    const formatPricing = (model: CatalogModel) => {
        if (model.locality === 'local') {
            return 'Local / custo zero';
        }

        const pricing = model.pricing;
        if (pricing?.inputPer1M === undefined && pricing?.outputPer1M === undefined) {
            return 'Pricing pendente';
        }

        return `${pricing?.currency || 'USD'} ${pricing?.inputPer1M ?? 0}/${pricing?.outputPer1M ?? 0} por 1M`;
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl overflow-hidden relative">
            {playgroundModel && (
                <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-indigo-400" /> Playground: {playgroundModel.externalModelId}
                        </h3>
                        <p className="text-sm text-slate-400 mb-4">Teste o modelo enviando um prompt direto.</p>

                        <textarea
                            value={testPrompt}
                            onChange={event => setTestPrompt(event.target.value)}
                            title={tooltip('modelCenter.catalog.playgroundPrompt')}
                            className="w-full h-32 bg-slate-950 border border-slate-700 rounded-xl p-4 text-slate-200 focus:border-indigo-500 outline-none transition-all mb-2"
                        />

                        {testResult && (
                            <div className={`text-xs p-3 rounded-lg border mb-4 ${testResult.startsWith('Erro')
                                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                }`}>
                                {testResult}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setPlaygroundModel(null);
                                    setTestResult('');
                                }}
                                title={tooltip('modelCenter.catalog.cancel')}
                                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleTest}
                                title={tooltip('modelCenter.catalog.runTest')}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20"
                            >
                                Enviar Teste
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <span className="text-purple-500 text-3xl">📚</span> Catálogo de Modelos
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={fetchModels}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors"
                        title={tooltip('modelCenter.catalog.refresh')}
                    >
                        🔄
                    </button>
                    <button
                        onClick={handlePull}
                        disabled={loading}
                        title={tooltip('modelCenter.catalog.pull')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        📥 Pull Model
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-sm">
                            <th className="pb-3 pl-4 font-medium">Modelo</th>
                            <th className="pb-3 font-medium">Ambiente</th>
                            <th className="pb-3 font-medium">Capacidades</th>
                            <th className="pb-3 font-medium">Scores</th>
                            <th className="pb-3 font-medium text-right pr-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-200">
                        {models.map((model) => (
                            <tr key={model.id} className="border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors align-top">
                                <td className="py-4 pl-4">
                                    <div className="font-medium text-white">{model.displayName || model.externalModelId}</div>
                                    <div className="text-xs text-slate-500 mt-1">{formatPricing(model)}</div>
                                </td>
                                <td className="py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${model.locality === 'local' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                                        {(model.locality || 'local').toUpperCase()}
                                    </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex flex-wrap gap-1 max-w-[280px]">
                                        {(model.capabilities || []).map(capability => (
                                            <span key={capability} className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 rounded text-[10px] uppercase tracking-wider">
                                                {capability}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="py-4">
                                    <div className="flex flex-wrap gap-1 max-w-[240px]">
                                        {getScoreEntries(model).length > 0 ? getScoreEntries(model).map(([key, value]) => (
                                            <span key={key} className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-300">
                                                <span className="text-slate-500">{key}</span> {value.toFixed(1)}
                                            </span>
                                        )) : (
                                            <span className="text-xs text-slate-500">Sem benchmark ainda</span>
                                        )}
                                    </div>
                                </td>
                                <td className="py-4 pr-4 text-right">
                                    <div className="flex justify-end gap-2 text-xl">
                                        <button
                                            onClick={() => {
                                                setPlaygroundModel(model);
                                                setTestResult('');
                                            }}
                                            className="p-1.5 hover:bg-indigo-500/20 rounded border border-slate-700 hover:border-indigo-500/50 text-indigo-400 transition-colors"
                                            title={tooltip('modelCenter.catalog.chat')}
                                        >
                                            💬
                                        </button>
                                        <button
                                            onClick={() => handleShowInfo(model.id)}
                                            className="p-1.5 hover:bg-slate-700 rounded border border-slate-700 text-slate-400 hover:text-white transition-colors"
                                            title={tooltip('modelCenter.catalog.info')}
                                        >
                                            ℹ️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(model.providerId, model.externalModelId)}
                                            className="p-1.5 hover:bg-red-500/20 rounded border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-400 transition-colors"
                                            title={tooltip('modelCenter.catalog.remove')}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {models.length === 0 && !loading && (
                <div className="py-20 text-center text-slate-500">
                    Nenhum modelo encontrado. Clique em Sync no painel de Providers ou faça um Pull.
                </div>
            )}
        </div>
    );
};

const Cpu = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="15" x2="23" y2="15" />
        <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="15" x2="4" y2="15" />
    </svg>
);
