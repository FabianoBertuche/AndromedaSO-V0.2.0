import { useTranslation } from 'react-i18next';

interface ImportProgressBarProps {
    status: 'PENDING' | 'VALIDATING' | 'IMPORTING' | 'COMPLETED' | 'FAILED';
    progress?: number;
}

export function ImportProgressBar({ status, progress = 0 }: ImportProgressBarProps) {
    const { t } = useTranslation('agents');

    const getStatusLabel = () => {
        const labels: Record<string, string> = {
            PENDING: t('import.progress.pending', 'Waiting...'),
            VALIDATING: t('import.progress.validating', 'Validating...'),
            IMPORTING: t('import.progress.importing', 'Importing...'),
            COMPLETED: t('import.progress.completed', 'Completed!'),
            FAILED: t('import.progress.failed', 'Failed'),
        };
        return labels[status] || status;
    };

    const getColor = () => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-500';
            case 'FAILED':
                return 'bg-red-500';
            case 'VALIDATING':
            case 'IMPORTING':
                return 'bg-blue-500';
            default:
                return 'bg-gray-300';
        }
    };

    const getProgress = () => {
        switch (status) {
            case 'PENDING':
                return 10;
            case 'VALIDATING':
                return 30;
            case 'IMPORTING':
                return 60;
            case 'COMPLETED':
                return 100;
            case 'FAILED':
                return progress;
            default:
                return 0;
        }
    };

    return (
        <div className="w-full">
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{getStatusLabel()}</span>
                <span className="text-sm text-gray-500">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${getColor()}`}
                    style={{ width: `${getProgress()}%` }}
                />
            </div>
        </div>
    );
}