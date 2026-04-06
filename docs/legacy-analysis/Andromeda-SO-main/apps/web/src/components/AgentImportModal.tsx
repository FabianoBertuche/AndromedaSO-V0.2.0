import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, X, FileBox, AlertTriangle } from 'lucide-react';
import { importAgent, getImportJobStatus } from '../services/agent-portability.service';
import type { ImportJobStatus } from '../services/agent-portability.service';
import { ImportConflictDialog } from './ImportConflictDialog';

interface AgentImportModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export function AgentImportModal({ onClose, onSuccess }: AgentImportModalProps) {
    const { t } = useTranslation('agents');
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [jobId, setJobId] = useState<string | null>(null);
    const [jobStatus, setJobStatus] = useState<ImportJobStatus | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showConflict, setShowConflict] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const conflictPolicy: 'ABORT' | 'RENAME' | 'OVERWRITE' = 'ABORT';

    useEffect(() => {
        if (!jobId || !isUploading) return;

        const pollInterval = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const status = await getImportJobStatus(jobId, token);
                setJobStatus(status);

                if (status.status === 'COMPLETED') {
                    clearInterval(pollInterval);
                    setIsUploading(false);
                    onSuccess?.();
                    onClose();
                } else if (status.status === 'FAILED') {
                    clearInterval(pollInterval);
                    setIsUploading(false);
                    setError(status.errors?.join('; ') || 'Import failed');
                } else if (status.status === 'CONFLICT_DETECTED') {
                    clearInterval(pollInterval);
                    setIsUploading(false);
                    setShowConflict(true);
                }
            } catch (err: any) {
                clearInterval(pollInterval);
                setIsUploading(false);
                setError(err.message);
            }
        }, 1000);

        return () => clearInterval(pollInterval);
    }, [jobId, isUploading, onSuccess, onClose]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.endsWith('.andromeda-agent')) {
                setError(t('import.invalidFormat', 'Invalid file format. Expected .andromeda-agent'));
                return;
            }
            setFile(selectedFile);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            if (!droppedFile.name.endsWith('.andromeda-agent')) {
                setError(t('import.invalidFormat', 'Invalid file format. Expected .andromeda-agent'));
                return;
            }
            setFile(droppedFile);
            setError(null);
        }
    };

    const handleImport = async () => {
        if (!file) return;

        setIsUploading(true);
        setError(null);
        setJobId(null);
        setJobStatus(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token');

            const result = await importAgent(file, conflictPolicy, token);
            setJobId(result.jobId);
            setJobStatus(result);

            if (result.status === 'CONFLICT_DETECTED') {
                setShowConflict(true);
            }
        } catch (err: any) {
            setIsUploading(false);
            setError(err.message || 'Import failed');
        }
    };

    const handleConflictResolve = async (policy: 'ABORT' | 'RENAME' | 'OVERWRITE') => {
        setShowConflict(false);
        if (policy === 'ABORT') {
            onClose();
        }
    };

    const getStatusMessage = () => {
        if (!jobStatus) return null;

        const messages: Record<string, string> = {
            PENDING: t('import.status.pending', 'Waiting...'),
            VALIDATING: t('import.status.validating', 'Validating bundle...'),
            IMPORTING: t('import.status.importing', 'Importing agent...'),
            COMPLETED: t('import.status.completed', 'Import completed!'),
            FAILED: t('import.status.failed', 'Import failed'),
            CONFLICT_DETECTED: t('import.status.conflict', 'Conflict detected'),
        };

        return messages[jobStatus.status] || jobStatus.status;
    };

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <FileBox className="w-5 h-5" />
                            {t('import.title', 'Import Agent')}
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4 cursor-pointer hover:border-blue-400 transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                            {file ? file.name : t('import.dropzone', 'Drop .andromeda-agent file or click to browse')}
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".andromeda-agent"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {isUploading && jobStatus && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-700 text-sm">
                            {getStatusMessage()}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            disabled={isUploading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {t('common:app.cancel', 'Cancel')}
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || isUploading}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isUploading ? t('import.importing', 'Importing...') : t('import.import', 'Import')}
                        </button>
                    </div>
                </div>
            </div>

            {showConflict && jobStatus && (
                <ImportConflictDialog
                    jobId={jobStatus.jobId}
                    conflictAgentId={jobStatus.conflictAgentId || ''}
                    onResolve={handleConflictResolve}
                    onClose={() => setShowConflict(false)}
                />
            )}
        </>
    );
}