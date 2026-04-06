import React, { useState } from 'react';
import { ProvidersPanel } from './ProvidersPanel';
import { ModelCatalogPanel } from './ModelCatalogPanel';
import { RouterIntelligencePanel } from './RouterIntelligencePanel';
import { BenchmarkLabPanel } from './BenchmarkLabPanel';
import { useTooltipText } from '../../contexts/I18nContext';

type Tab = 'providers' | 'catalog' | 'router' | 'benchmark';

export const ModelCenterView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('catalog');
    const tooltip = useTooltipText();

    const tabs = [
        { id: 'providers', label: 'Providers', icon: '🖧' },
        { id: 'catalog', label: 'Catálogo de Modelos', icon: '📚' },
        { id: 'router', label: 'Router Intelligence', icon: '🧠' },
        { id: 'benchmark', label: 'Benchmark Lab', icon: '🧪' },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            <h1 className="text-3xl md:text-4xl font-bold font-sans tracking-tight text-white mb-2">Central de Modelos</h1>
            <p className="text-slate-400 text-lg mb-8 max-w-2xl">
                Gerencie provedores, catálogos e benchmarks para criar um roteamento de Inteligência Artificial baseado em evidência.
            </p>

            {/* Navegação */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-800 pb-px">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as Tab)}
                        title={tooltip(`modelCenter.tab.${tab.id}`)}
                        className={`flex items-center gap-2 px-5 py-3 font-medium text-sm rounded-t-lg transition-all border-b-2 
                            ${activeTab === tab.id
                                ? 'text-white border-blue-500 bg-slate-800/50'
                                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/30'
                            }`}
                    >
                        <span className="text-lg">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo dinâmico das abas */}
            <div className="transition-opacity duration-300">
                {activeTab === 'providers' && <ProvidersPanel />}
                {activeTab === 'catalog' && <ModelCatalogPanel />}
                {activeTab === 'router' && <RouterIntelligencePanel />}
                {activeTab === 'benchmark' && <BenchmarkLabPanel />}
            </div>
        </div>
    );
};
