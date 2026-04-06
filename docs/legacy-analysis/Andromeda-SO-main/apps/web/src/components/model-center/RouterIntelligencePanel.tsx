import React, { useEffect, useState } from 'react';
import { useTooltipText } from '../../contexts/I18nContext';

interface RouterWeights {
    quality: number;
    latency: number;
    cost: number;
    stability: number;
    capabilityFit: number;
}

interface CandidateScore {
    modelId: string;
    displayName: string;
    locality: 'local' | 'cloud';
    qualityScore: number;
    latencyScore: number;
    costScore: number;
    capabilityFitScore: number;
    stabilityScore: number;
    weightedScore: number;
    estimatedCost: number;
    withinBudget: boolean;
    latencyMs: number;
}

interface RoutingDecisionView {
    id: string;
    activityType: string;
    requiredCapabilities: string[];
    chosenModelId: string;
    fallbackModelId?: string;
    score: number;
    estimatedCost?: number;
    latencyMs?: number;
    justification: string;
    createdAt?: string;
    weights?: RouterWeights;
    candidateScores?: CandidateScore[];
}

interface ActivityOption {
    value: string;
    label: string;
    requiredCapabilities: string[];
}

interface ActivityGroup {
    label: string;
    options: ActivityOption[];
}

const defaultWeights: RouterWeights = {
    quality: 0.5,
    latency: 0.2,
    cost: 0.2,
    stability: 0,
    capabilityFit: 0.1,
};

const activityGroups: ActivityGroup[] = [
    {
        label: 'Core',
        options: [
            { value: 'coding.generate', label: 'coding.generate', requiredCapabilities: ['coding'] },
            { value: 'coding.debug', label: 'coding.debug', requiredCapabilities: ['coding'] },
            { value: 'coding.architecture', label: 'coding.architecture', requiredCapabilities: ['architecture'] },
            { value: 'agent.planning', label: 'agent.planning', requiredCapabilities: ['planning'] },
            { value: 'chat.general', label: 'chat.general', requiredCapabilities: ['chat'] },
            { value: 'reasoning.deep', label: 'reasoning.deep', requiredCapabilities: ['reasoning'] },
            { value: 'translation', label: 'translation', requiredCapabilities: ['chat'] },
            { value: 'uncensored.general', label: 'modelo sem censura', requiredCapabilities: ['chat'] },
            { value: 'hacking.pentest', label: 'hacking/pentest', requiredCapabilities: ['security', 'pentest'] },
        ],
    },
    {
        label: 'Data and Retrieval',
        options: [
            { value: 'rag.retrieval', label: 'rag.retrieval', requiredCapabilities: ['rag'] },
            { value: 'embeddings.semantic', label: 'embeddings.semantic', requiredCapabilities: ['rag'] },
            { value: 'data.analysis', label: 'data.analysis', requiredCapabilities: ['analysis'] },
            { value: 'scientific.analysis', label: 'scientific.analysis', requiredCapabilities: ['analysis'] },
            { value: 'math.advanced', label: 'math.advanced', requiredCapabilities: ['analysis'] },
            { value: 'strategy.planning', label: 'strategy.planning', requiredCapabilities: ['planning'] },
            { value: 'logs.devops', label: 'logs.devops', requiredCapabilities: ['devops'] },
            { value: 'ocr.extraction', label: 'ocr.extraction', requiredCapabilities: ['extraction'] },
        ],
    },
    {
        label: 'Security',
        options: [
            { value: 'security.offensive', label: 'security.offensive', requiredCapabilities: ['security'] },
            { value: 'security.defensive', label: 'security.defensive', requiredCapabilities: ['security'] },
        ],
    },
    {
        label: 'Creative and Writing',
        options: [
            { value: 'humor.creativity', label: 'humor.creativity', requiredCapabilities: ['chat'] },
            { value: 'writing.literature', label: 'writing.literature', requiredCapabilities: ['chat'] },
            { value: 'music.generation', label: 'music.generation', requiredCapabilities: ['audio'] },
        ],
    },
    {
        label: 'Multimodal',
        options: [
            { value: 'multimodal.understanding', label: 'Multimodal', requiredCapabilities: ['vision'] },
            { value: 'audio_text_to_text', label: 'Audio-Text-to-Text', requiredCapabilities: ['audio'] },
            { value: 'image_text_to_text', label: 'Image-Text-to-Text', requiredCapabilities: ['vision'] },
            { value: 'image_text_to_image', label: 'Image-Text-to-Image', requiredCapabilities: ['vision'] },
            { value: 'image_text_to_video', label: 'Image-Text-to-Video', requiredCapabilities: ['vision'] },
            { value: 'video_text_to_text', label: 'Video-Text-to-Text', requiredCapabilities: ['vision'] },
            { value: 'visual_question_answering', label: 'Visual Question Answering', requiredCapabilities: ['vision'] },
            { value: 'document_question_answering', label: 'Document Question Answering', requiredCapabilities: ['vision'] },
            { value: 'visual_document_retrieval', label: 'Visual Document Retrieval', requiredCapabilities: ['vision'] },
            { value: 'any_to_any', label: 'Any-to-Any', requiredCapabilities: ['vision'] },
        ],
    },
    {
        label: 'Computer Vision',
        options: [
            { value: 'vision.general', label: 'vision.general', requiredCapabilities: ['vision'] },
            { value: 'vision.analysis', label: 'vision.analysis', requiredCapabilities: ['vision'] },
            { value: 'depth_estimation', label: 'Depth Estimation', requiredCapabilities: ['vision'] },
            { value: 'image_classification', label: 'Image Classification', requiredCapabilities: ['vision'] },
            { value: 'object_detection', label: 'Object Detection', requiredCapabilities: ['vision'] },
            { value: 'image_segmentation', label: 'Image Segmentation', requiredCapabilities: ['vision'] },
            { value: 'text_to_image', label: 'Text-to-Image', requiredCapabilities: ['vision'] },
            { value: 'image_to_text', label: 'Image-to-Text', requiredCapabilities: ['vision'] },
            { value: 'image_to_image', label: 'Image-to-Image', requiredCapabilities: ['vision'] },
            { value: 'image_to_video', label: 'Image-to-Video', requiredCapabilities: ['vision'] },
            { value: 'unconditional_image_generation', label: 'Unconditional Image Generation', requiredCapabilities: ['vision'] },
            { value: 'video_classification', label: 'Video Classification', requiredCapabilities: ['vision'] },
            { value: 'text_to_video', label: 'Text-to-Video', requiredCapabilities: ['vision'] },
            { value: 'zero_shot_image_classification', label: 'Zero-Shot Image Classification', requiredCapabilities: ['vision'] },
            { value: 'mask_generation', label: 'Mask Generation', requiredCapabilities: ['vision'] },
            { value: 'zero_shot_object_detection', label: 'Zero-Shot Object Detection', requiredCapabilities: ['vision'] },
            { value: 'text_to_3d', label: 'Text-to-3D', requiredCapabilities: ['vision'] },
            { value: 'image_to_3d', label: 'Image-to-3D', requiredCapabilities: ['vision'] },
            { value: 'image_feature_extraction', label: 'Image Feature Extraction', requiredCapabilities: ['vision'] },
            { value: 'keypoint_detection', label: 'Keypoint Detection', requiredCapabilities: ['vision'] },
            { value: 'video_to_video', label: 'Video-to-Video', requiredCapabilities: ['vision'] },
        ],
    },
    {
        label: 'NLP',
        options: [
            { value: 'text_classification', label: 'Text Classification', requiredCapabilities: ['classification'] },
            { value: 'token_classification', label: 'Token Classification', requiredCapabilities: ['classification'] },
            { value: 'table_question_answering', label: 'Table Question Answering', requiredCapabilities: ['analysis'] },
            { value: 'question_answering', label: 'Question Answering', requiredCapabilities: ['chat'] },
            { value: 'zero_shot_classification', label: 'Zero-Shot Classification', requiredCapabilities: ['classification'] },
            { value: 'summarization', label: 'Summarization', requiredCapabilities: ['summarization'] },
            { value: 'feature_extraction', label: 'Feature Extraction', requiredCapabilities: ['extraction'] },
            { value: 'text_generation', label: 'Text Generation', requiredCapabilities: ['chat'] },
            { value: 'fill_mask', label: 'Fill-Mask', requiredCapabilities: ['chat'] },
            { value: 'sentence_similarity', label: 'Sentence Similarity', requiredCapabilities: ['analysis'] },
            { value: 'text_ranking', label: 'Text Ranking', requiredCapabilities: ['analysis'] },
        ],
    },
    {
        label: 'Audio',
        options: [
            { value: 'audio.stt', label: 'audio.stt', requiredCapabilities: ['audio'] },
            { value: 'audio.tts', label: 'audio.tts', requiredCapabilities: ['audio'] },
            { value: 'text_to_audio', label: 'Text-to-Audio', requiredCapabilities: ['audio'] },
            { value: 'automatic_speech_recognition', label: 'Automatic Speech Recognition', requiredCapabilities: ['audio'] },
            { value: 'audio_to_audio', label: 'Audio-to-Audio', requiredCapabilities: ['audio'] },
            { value: 'audio_classification', label: 'Audio Classification', requiredCapabilities: ['audio'] },
            { value: 'voice_activity_detection', label: 'Voice Activity Detection', requiredCapabilities: ['audio'] },
        ],
    },
    {
        label: 'Tabular and Forecasting',
        options: [
            { value: 'tabular_classification', label: 'Tabular Classification', requiredCapabilities: ['analysis'] },
            { value: 'tabular_regression', label: 'Tabular Regression', requiredCapabilities: ['analysis'] },
            { value: 'time_series_forecasting', label: 'Time Series Forecasting', requiredCapabilities: ['analysis'] },
        ],
    },
    {
        label: 'Other',
        options: [
            { value: 'reinforcement_learning', label: 'Reinforcement Learning', requiredCapabilities: ['analysis'] },
            { value: 'robotics', label: 'Robotics', requiredCapabilities: ['automation'] },
            { value: 'graph_machine_learning', label: 'Graph Machine Learning', requiredCapabilities: ['analysis'] },
        ],
    },
];

export const RouterIntelligencePanel: React.FC = () => {
    const tooltip = useTooltipText();
    const [simulating, setSimulating] = useState(false);
    const [savingConfig, setSavingConfig] = useState(false);
    const [activity, setActivity] = useState('coding.generate');
    const [maxCost, setMaxCost] = useState('');
    const [decisions, setDecisions] = useState<RoutingDecisionView[]>([]);
    const [lastDecision, setLastDecision] = useState<RoutingDecisionView | null>(null);
    const [weights, setWeights] = useState<RouterWeights>(defaultWeights);

    const fetchDecisions = async () => {
        try {
            const response = await fetch('/model-center/router/decisions');
            if (!response.ok) return;
            const data = await response.json() as RoutingDecisionView[];
            setDecisions(data);
        } catch (error) {
            console.error('Erro ao buscar decisões:', error);
        }
    };

    const fetchConfig = async () => {
        try {
            const response = await fetch('/model-center/router/config');
            if (!response.ok) return;
            const data = await response.json() as { weights?: Partial<RouterWeights> };
            setWeights({ ...defaultWeights, ...data.weights });
        } catch (error) {
            console.error('Erro ao buscar config do roteador:', error);
        }
    };

    useEffect(() => {
        void fetchDecisions();
        void fetchConfig();
    }, []);

    const handleSimulate = async () => {
        setSimulating(true);
        setLastDecision(null);

        const parsedMaxCost = Number.parseFloat(maxCost);
        const selectedActivity = activityGroups
            .flatMap(group => group.options)
            .find(option => option.value === activity);

        try {
            const response = await fetch('/model-center/router/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    taskId: `sim-${Date.now()}`,
                    activityType: activity,
                    requiredCapabilities: selectedActivity?.requiredCapabilities || ['chat'],
                    maxCost: Number.isFinite(parsedMaxCost) ? parsedMaxCost : undefined,
                }),
            });

            if (!response.ok) {
                throw new Error('Falha ao simular decisão');
            }

            const data = await response.json() as RoutingDecisionView;
            setLastDecision(data);
            await fetchDecisions();
        } catch (error) {
            console.error('Erro na simulação:', error);
        } finally {
            setSimulating(false);
        }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);

        try {
            const response = await fetch('/model-center/router/config', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weights }),
            });

            if (!response.ok) {
                throw new Error('Falha ao salvar configuração');
            }

            await fetchConfig();
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
        } finally {
            setSavingConfig(false);
        }
    };

    const updateWeight = (key: keyof RouterWeights, value: string) => {
        const parsed = Number.parseFloat(value);
        setWeights(current => ({
            ...current,
            [key]: Number.isFinite(parsed) ? parsed : 0,
        }));
    };

    const renderComparison = (decision: RoutingDecisionView) => {
        const [winner, runnerUp] = (decision.candidateScores || []).slice(0, 2);
        if (!winner) {
            return 'Sem comparativo';
        }
        if (!runnerUp) {
            return `${winner.displayName} foi o único elegível`;
        }

        return `${winner.displayName} ${winner.weightedScore.toFixed(2)} vs ${runnerUp.displayName} ${runnerUp.weightedScore.toFixed(2)} · Q ${winner.qualityScore.toFixed(1)}/${runnerUp.qualityScore.toFixed(1)} · C ${winner.costScore.toFixed(1)}/${runnerUp.costScore.toFixed(1)}`;
    };

    const getChosenDisplayName = (decision: RoutingDecisionView) => {
        return decision.candidateScores?.[0]?.displayName || decision.chosenModelId;
    };

    return (
        <div className="p-6 bg-slate-900 rounded-xl border border-slate-700 shadow-xl">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
                <span className="text-indigo-500 text-3xl">🧠</span> Router Intelligence
            </h2>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                <div className="space-y-6">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
                        <h3 className="text-lg font-medium text-white mb-4">Simulador de Roteamento</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Tipo de Atividade</label>
                                <select
                                    value={activity}
                                    onChange={(event) => setActivity(event.target.value)}
                                    title={tooltip('modelCenter.router.activity')}
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-indigo-500"
                                >
                                    {activityGroups.map(group => (
                                        <optgroup key={group.label} label={group.label}>
                                            {group.options.map(option => (
                                                <option key={option.value} value={option.value}>{option.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">Max Cost (opcional)</label>
                                <input
                                    value={maxCost}
                                    onChange={(event) => setMaxCost(event.target.value)}
                                    title={tooltip('modelCenter.router.maxCost')}
                                    placeholder="0.03"
                                    className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-indigo-500"
                                />
                            </div>

                            <button
                                onClick={handleSimulate}
                                disabled={simulating}
                                title={tooltip('modelCenter.router.simulate')}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50"
                            >
                                {simulating ? 'Processando...' : 'Simular Decisão'}
                            </button>

                            {lastDecision && (
                                <div className="space-y-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                    <p className="text-xs text-emerald-400 uppercase font-bold">Modelo Escolhido</p>
                                    <p className="text-lg font-mono text-white">{getChosenDisplayName(lastDecision)}</p>
                                    <p className="text-[11px] text-slate-300">
                                        Score {(lastDecision.score ?? 0).toFixed(2)} · Latência {lastDecision.latencyMs ?? 0}ms · Custo {(lastDecision.estimatedCost ?? 0).toFixed(5)}
                                    </p>
                                    <p className="text-[11px] text-slate-400">{lastDecision.justification}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-white">Pesos Dinâmicos</h3>
                            <button
                                onClick={handleSaveConfig}
                                disabled={savingConfig}
                                title={tooltip('modelCenter.router.save')}
                                className="px-3 py-2 text-xs bg-slate-900 hover:bg-slate-700 border border-slate-600 text-white rounded-lg disabled:opacity-50"
                            >
                                {savingConfig ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>

                        <div className="space-y-3">
                            {([
                                ['quality', 'Quality'],
                                ['latency', 'Latency'],
                                ['cost', 'Cost'],
                                ['stability', 'Stability'],
                                ['capabilityFit', 'Capability Fit'],
                            ] as Array<[keyof RouterWeights, string]>).map(([key, label]) => (
                                <label key={key} className="block">
                                    <span className="block text-sm text-slate-400 mb-1">{label}</span>
                                    <input
                                        type="number"
                                        step="0.05"
                                        value={weights[key]}
                                        onChange={(event) => updateWeight(key, event.target.value)}
                                        title={tooltip('modelCenter.router.weight')}
                                        className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg p-2.5 outline-none focus:border-indigo-500"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
                        <h3 className="text-lg font-medium text-white mb-4">Justificativa Comparativa</h3>
                        {lastDecision?.candidateScores?.length ? (
                            <div className="overflow-hidden rounded-lg border border-slate-700">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900 text-slate-400">
                                        <tr>
                                            <th className="px-4 py-3">Modelo</th>
                                            <th className="px-4 py-3">Weighted</th>
                                            <th className="px-4 py-3 hidden md:table-cell">Quality</th>
                                            <th className="px-4 py-3 hidden md:table-cell">Latency</th>
                                            <th className="px-4 py-3 hidden md:table-cell">Cost</th>
                                            <th className="px-4 py-3 hidden lg:table-cell">Budget</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700 text-slate-300">
                                        {lastDecision.candidateScores.map(candidate => (
                                            <tr key={candidate.modelId} className={candidate.modelId === lastDecision.chosenModelId ? 'bg-emerald-500/5' : ''}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-white">{candidate.displayName}</div>
                                                    <div className="text-[11px] text-slate-500">{candidate.locality.toUpperCase()}</div>
                                                </td>
                                                <td className="px-4 py-3 text-emerald-400 font-semibold">{candidate.weightedScore.toFixed(2)}</td>
                                                <td className="px-4 py-3 hidden md:table-cell">{candidate.qualityScore.toFixed(1)}</td>
                                                <td className="px-4 py-3 hidden md:table-cell">{candidate.latencyScore.toFixed(1)} · {candidate.latencyMs}ms</td>
                                                <td className="px-4 py-3 hidden md:table-cell">{candidate.costScore.toFixed(1)} · {candidate.estimatedCost.toFixed(5)}</td>
                                                <td className="px-4 py-3 hidden lg:table-cell">
                                                    <span className={`px-2 py-0.5 rounded border text-[10px] ${candidate.withinBudget ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border-amber-500/20'}`}>
                                                        {candidate.withinBudget ? 'Dentro' : 'Acima'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-sm text-slate-500">Simule uma decisão para ver o comparativo ponderado entre candidatos.</div>
                        )}
                    </div>

                    <div className="bg-slate-800 rounded-lg border border-slate-700 p-5">
                        <h3 className="text-lg font-medium text-white mb-4">Histórico de Decisões</h3>
                        <div className="overflow-hidden rounded-lg border border-slate-700">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900 text-slate-400">
                                    <tr>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3">Atividade</th>
                                        <th className="px-4 py-3">Modelo</th>
                                        <th className="px-4 py-3 hidden md:table-cell">Score</th>
                                        <th className="px-4 py-3 hidden lg:table-cell">Comparativo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700 text-slate-300">
                                    {decisions.map(decision => (
                                        <tr key={decision.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {(decision.createdAt ? new Date(decision.createdAt) : null)?.toLocaleTimeString() ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">{decision.activityType}</td>
                                            <td className="px-4 py-3 text-indigo-400 font-medium">{getChosenDisplayName(decision)}</td>
                                            <td className="px-4 py-3 hidden md:table-cell text-green-400 font-semibold">{(decision.score ?? 0).toFixed(2)}</td>
                                            <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">{renderComparison(decision)}</td>
                                        </tr>
                                    ))}
                                    {decisions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-10 text-center text-slate-500">Nenhuma decisão registrada.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
