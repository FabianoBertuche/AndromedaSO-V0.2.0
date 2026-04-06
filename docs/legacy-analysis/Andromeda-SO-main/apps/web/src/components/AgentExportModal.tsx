import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X, FileBox, History, Database } from 'lucide-react';
import { exportAgent, downloadBundle } from '../services/agent-portability.service';

interface AgentExportModalProps {
    agentId: string;
    agentName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export function AgentExportModal({ agentId, agentName, onClose, onSuccess }: AgentExportModalProps) {
    const { t } = useTranslation('agents');
    const [includesKnowledge, setIncludesKnowledge] = useState(false);
    const [includesVersions, setIncludesVersions] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setIsExporting(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token');

            const result = await exportAgent(agentId, { includesKnowledge, includesVersions }, token);
            
            const blob = await downloadBundle(agentId, result.bundleId, token);
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${agentId}-${Date.now()}.andromeda-agent`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileBox className="w-5 h-5" />
                        {t('export.title', 'Export Agent')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="mb-4 text-gray-600">
                    {t('export.description', `Export "${agentName}" to a portable bundle file.`)}
                </p>

                <div className="space-y-3 mb-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includesVersions}
                            onChange={(e) => setIncludesVersions(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <History className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{t('export.includeVersions', 'Include version history')}</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includesKnowledge}
                            onChange={(e) => setIncludesKnowledge(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <Database className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{t('export.includeKnowledge', 'Include knowledge collections')}</span>
                    </label>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isExporting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        {t('common:app.cancel', 'Cancel')}
                    </button>
                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        {isExporting ? t('export.exporting', 'Exporting...') : t('export.export', 'Export')}
                    </button>
                </div>
            </div>
        </div>
    );
}