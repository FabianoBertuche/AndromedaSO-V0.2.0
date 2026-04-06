const API_BASE = '/v1';

export interface ExportOptions {
    includesKnowledge?: boolean;
    includesVersions?: boolean;
}

export interface ExportResult {
    bundleId: string;
    downloadUrl: string;
    checksum: string;
    exportedAt: string;
}

export interface ImportJobStatus {
    jobId: string;
    status: 'PENDING' | 'VALIDATING' | 'CONFLICT_DETECTED' | 'IMPORTING' | 'COMPLETED' | 'FAILED';
    importedAgentId?: string;
    conflictAgentId?: string;
    errors?: string[];
}

export interface ConflictResolution {
    policy: 'ABORT' | 'RENAME' | 'OVERWRITE';
}

export async function exportAgent(agentId: string, options: ExportOptions, token: string): Promise<ExportResult> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/export`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(options),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
    }

    return response.json();
}

export async function listAgentBundles(agentId: string, token: string): Promise<ExportResult[]> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/bundles`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to list bundles');
    }

    return response.json();
}

export async function downloadBundle(agentId: string, bundleId: string, token: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/agents/${agentId}/bundles/${bundleId}/download`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Download failed');
    }

    return response.blob();
}

export async function importAgent(file: File, conflictPolicy: 'ABORT' | 'RENAME' | 'OVERWRITE', token: string): Promise<ImportJobStatus> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conflictPolicy', conflictPolicy);

    const response = await fetch(`${API_BASE}/agents/import`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
    }

    return response.json();
}

export async function getImportJobStatus(jobId: string, token: string): Promise<ImportJobStatus> {
    const response = await fetch(`${API_BASE}/agents/import/${jobId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get job status');
    }

    return response.json();
}

export async function resolveImportConflict(jobId: string, policy: 'ABORT' | 'RENAME' | 'OVERWRITE', token: string): Promise<ImportJobStatus> {
    const response = await fetch(`${API_BASE}/agents/import/${jobId}/resolve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ policy }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resolve conflict');
    }

    return response.json();
}