import { useState, useEffect } from 'react';
import { Book, FileText, Search, Vault } from 'lucide-react';
import { CollectionsList } from './CollectionsList';
import type { Collection } from './CollectionsList';
import { DocumentManagement } from './DocumentManagement';
import type { Document } from './DocumentManagement';
import { apiFetch } from '../../lib/api-auth';
import { useTooltipText } from '../../contexts/I18nContext';

type KnowledgeTab = 'collections' | 'documents' | 'retrieval' | 'vaults';

type ApiCollection = {
    id: string;
    name: string;
    description?: string;
    status?: string;
};

type ApiDocument = {
    id: string;
    title: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    mimeType?: string;
    createdAt: string;
};

const KNOWLEDGE_BASE = '/api/knowledge';

export function KnowledgeView() {
    const tooltip = useTooltipText();
    const [activeTab, setActiveTab] = useState<KnowledgeTab>('collections');
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        void fetchCollections();
    }, []);

    useEffect(() => {
        if (selectedCollectionId && activeTab === 'documents') {
            void fetchDocuments(selectedCollectionId);
        }
    }, [selectedCollectionId, activeTab]);

    async function fetchCollections() {
        setIsLoading(true);
        setError('');
        try {
            const data = await requestJson<ApiCollection[]>(`${KNOWLEDGE_BASE}/collections`);
            setCollections(data.map((collection) => ({
                id: collection.id,
                name: collection.name,
                description: collection.description || 'No description yet.',
                documentCount: 0,
                status: collection.status || 'completed',
            })));
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to load collections.');
        } finally {
            setIsLoading(false);
        }
    }

    async function fetchDocuments(collectionId: string) {
        setIsLoading(true);
        setError('');
        try {
            const data = await requestJson<ApiDocument[]>(`${KNOWLEDGE_BASE}/collections/${collectionId}/documents`);
            setDocuments(data.map((document) => ({
                id: document.id,
                title: document.title,
                status: document.status,
                mimeType: document.mimeType || 'unknown',
                createdAt: document.createdAt,
            })));
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to load documents.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleUpload(files: FileList) {
        if (!selectedCollectionId) {
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            for (const file of Array.from(files)) {
                const rawText = await readFileText(file);
                await requestJson(`${KNOWLEDGE_BASE}/collections/${selectedCollectionId}/documents`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: file.name,
                        sourceType: 'upload',
                        sourcePath: file.name,
                        mimeType: file.type || 'text/plain',
                        rawText,
                        metadata: {
                            size: file.size,
                        },
                    }),
                });
            }

            await fetchDocuments(selectedCollectionId);
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to upload document.');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleDeleteDocument(docId: string) {
        if (!window.confirm('Are you sure you want to delete this document?')) {
            return;
        }

        setError('');
        try {
            await requestJson(`${KNOWLEDGE_BASE}/documents/${docId}`, {
                method: 'DELETE',
            });

            if (selectedCollectionId) {
                await fetchDocuments(selectedCollectionId);
            }
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to delete document.');
        }
    }

    async function handleCreateCollection() {
        const name = window.prompt('Collection Name:');
        if (!name) {
            return;
        }

        setError('');
        try {
            await requestJson(`${KNOWLEDGE_BASE}/collections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description: 'Created from Andromeda UI',
                    scopeType: 'shared',
                    scopeId: 'global',
                    sourceType: 'manual',
                    metadata: {},
                }),
            });
            await fetchCollections();
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : 'Failed to create collection.');
        }
    }

    function handleSelectCollection(id: string) {
        setSelectedCollectionId(id);
        setActiveTab('documents');
    }

    return (
        <div className="flex flex-col h-full bg-slate-950/40 backdrop-blur-sm">
            <header className="px-8 py-6 border-b border-white/5">
                <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-3">
                    <Book className="w-6 h-6 text-indigo-400" />
                    Knowledge Layer
                </h2>
                <p className="text-slate-500 text-sm mt-1">Manage corpora, documents and agentic retrieval policies.</p>
            </header>

            <div className="flex-1 flex overflow-hidden">
                <aside className="w-64 border-r border-white/5 py-6 px-4 bg-slate-900/20">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setActiveTab('collections')}
                            title={tooltip('knowledge.nav.collections')}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'collections' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <Book className="w-4 h-4" />
                            Collections
                        </button>
                        <button
                            onClick={() => setActiveTab('documents')}
                            title={tooltip('knowledge.nav.documents')}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'documents' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <FileText className="w-4 h-4" />
                            Documents
                        </button>
                        <button
                            onClick={() => setActiveTab('retrieval')}
                            title={tooltip('knowledge.nav.retrieval')}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'retrieval' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <Search className="w-4 h-4" />
                            Retrieval History
                        </button>
                        <button
                            onClick={() => setActiveTab('vaults')}
                            title={tooltip('knowledge.nav.vaults')}
                            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'vaults' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <Vault className="w-4 h-4" />
                            Vault Management
                        </button>
                    </nav>
                </aside>

                <main className="flex-1 overflow-auto p-8">
                    {activeTab === 'collections' && (
                        <CollectionsList
                            collections={collections}
                            onSelect={handleSelectCollection}
                            onCreate={handleCreateCollection}
                        />
                    )}

                    {activeTab === 'documents' && selectedCollectionId ? (
                        <DocumentManagement
                            collectionId={selectedCollectionId}
                            documents={documents}
                            onUpload={handleUpload}
                            onDelete={handleDeleteDocument}
                        />
                    ) : activeTab === 'documents' ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-500">
                            <FileText className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a collection to manage documents.</p>
                        </div>
                    ) : null}

                    {activeTab === 'retrieval' && (
                        <div className="text-slate-500">Retrieval history tracking coming soon...</div>
                    )}

                    {activeTab === 'vaults' && (
                        <div className="text-slate-500">Obsidian Vault integration settings coming soon...</div>
                    )}

                    {error && (
                        <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    {isLoading && (
                        <div className="mt-6 text-sm text-slate-500">Loading knowledge data...</div>
                    )}
                </main>
            </div>
        </div>
    );
}

async function requestJson<T = unknown>(input: string, init?: RequestInit): Promise<T> {
    const response = await apiFetch(input, init);
    if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Request failed with status ${response.status}`);
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

async function readFileText(file: File): Promise<string> {
    const mimeType = file.type.toLowerCase();
    const textTypes = ['text/', 'application/json', 'application/markdown'];
    if (!textTypes.some((prefix) => mimeType.startsWith(prefix))) {
        return '';
    }

    return file.text();
}
