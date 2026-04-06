import { Book, Plus, ExternalLink } from 'lucide-react';
import { useTooltipText } from '../../contexts/I18nContext';

export interface Collection {
    id: string;
    name: string;
    description: string;
    documentCount: number;
    status: string;
}

interface CollectionsListProps {
    collections: Collection[];
    onSelect: (id: string) => void;
    onCreate: () => void;
}

export function CollectionsList({ collections, onSelect, onCreate }: CollectionsListProps) {
    const tooltip = useTooltipText();
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-white">Knowledge Collections</h3>
                    <p className="text-slate-500 text-sm">Organize your data into semantic clusters.</p>
                </div>
                <button
                    onClick={onCreate}
                    title={tooltip('knowledge.createCollection')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Create Collection
                </button>
            </div>

            {collections.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                        <Book className="w-8 h-8 text-slate-600" />
                    </div>
                    <h4 className="text-lg text-slate-300 font-medium">No collections yet</h4>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs text-center">
                        Collections are logical groups of documents that agents can use for retrieval.
                    </p>
                    <button
                        onClick={onCreate}
                        title={tooltip('knowledge.createCollection')}
                        className="mt-6 text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-2"
                    >
                        Create your first collection <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {collections.map((col) => (
                        <div
                            key={col.id}
                            onClick={() => onSelect(col.id)}
                            title={tooltip('knowledge.collectionCard')}
                            className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-indigo-500/50 transition-all cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                    <Book className="w-6 h-6 text-indigo-400" />
                                </div>
                                <span className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                    {col.status}
                                </span>
                            </div>
                            <h4 className="text-lg font-medium text-white mb-1">{col.name}</h4>
                            <p className="text-slate-500 text-sm line-clamp-2 mb-4">{col.description}</p>
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <span className="text-xs text-slate-500">{col.documentCount} Documents</span>
                                <span className="text-xs text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                    View Docs <ExternalLink className="w-3 h-3" />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
