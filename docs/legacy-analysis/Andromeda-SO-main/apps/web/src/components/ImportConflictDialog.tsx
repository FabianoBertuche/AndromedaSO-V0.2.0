import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, X, RefreshCw, Replace, XCircle } from 'lucide-react';
import { resolveImportConflict } from '../services/agent-portability.service';

interface ImportConflictDialogProps {
    jobId: string;
    conflictAgentId: string;
    onResolve: (policy: 'ABORT' | 'RENAME' | 'OVERWRITE') => void;
    onClose: () => void;
}

export function ImportConflictDialog({ jobId, conflictAgentId, onResolve, onClose }: ImportConflictDialogProps) {
    const { t } = useTranslation('agents');
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleResolve = async (policy: 'ABORT' | 'RENAME' | 'OVERWRITE') => {
        if (policy === 'ABORT') {
            onResolve(policy);
            return;
        }

        setIsResolving(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token');

            await resolveImportConflict(jobId, policy, token);
            onResolve(policy);
        } catch (err: any) {
            setError(err.message || 'Failed to resolve conflict');
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-yellow-600">
                        <AlertTriangle className="w-5 h-5" />
                        {t('import.conflict.title', 'Import Conflict')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="mb-4 text-gray-600">
                    {t('import.conflict.description', `An agent with ID "${conflictAgentId}" already exists. How would you like to resolve this conflict?`)}
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => handleResolve('RENAME')}
                        disabled={isResolving}
                        className="w-full px-4 py-3 text-sm font-medium text-left text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <div>
                            <div className="font-medium">{t('import.conflict.rename', 'Rename')}</div>
                            <div className="text-xs text-gray-500">{t('import.conflict.renameDesc', 'Import with a new name')}</div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleResolve('OVERWRITE')}
                        disabled={isResolving}
                        className="w-full px-4 py-3 text-sm font-medium text-left text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                        <Replace className="w-5 h-5" />
                        <div>
                            <div className="font-medium">{t('import.conflict.overwrite', 'Replace')}</div>
                            <div className="text-xs text-gray-500">{t('import.conflict.overwriteDesc', 'Replace existing agent')}</div>
                        </div>
                    </button>

                    <button
                        onClick={() => handleResolve('ABORT')}
                        disabled={isResolving}
                        className="w-full px-4 py-3 text-sm font-medium text-left text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-3"
                    >
                        <XCircle className="w-5 h-5" />
                        <div>
                            <div className="font-medium">{t('import.conflict.abort', 'Cancel')}</div>
                            <div className="text-xs text-gray-500">{t('import.conflict.abortDesc', 'Cancel the import')}</div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}