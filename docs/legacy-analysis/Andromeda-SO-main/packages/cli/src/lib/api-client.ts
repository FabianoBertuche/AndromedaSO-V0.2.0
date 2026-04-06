const DEFAULT_API_URL = 'http://localhost:5000';

export interface ApiClientConfig {
    baseUrl: string;
    token?: string;
}

export interface AgentProfile {
    id: string;
    name: string;
    role: string;
    description: string;
    version: string;
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

export class ApiClient {
    private baseUrl: string;
    private token?: string;

    constructor(config?: Partial<ApiClientConfig>) {
        this.baseUrl = config?.baseUrl || process.env.ANDROMEDA_API_URL || DEFAULT_API_URL;
        this.token = config?.token || process.env.ANDROMEDA_TOKEN;
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((options.headers as Record<string, string>) || {}),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        if (response.status === 204) {
            return undefined as unknown as T;
        }

        return response.json() as Promise<T>;
    }

    async getAgent(agentId: string): Promise<AgentProfile> {
        return this.request<AgentProfile>(`/v1/agents/${agentId}`);
    }

    async listAgents(): Promise<AgentProfile[]> {
        return this.request<AgentProfile[]>('/v1/agents');
    }

    async exportAgent(agentId: string, options: { includesKnowledge?: boolean; includesVersions?: boolean } = {}): Promise<ExportResult> {
        return this.request<ExportResult>(`/v1/agents/${agentId}/export`, {
            method: 'POST',
            body: JSON.stringify(options),
        });
    }

    async downloadBundle(agentId: string, bundleId: string): Promise<ArrayBuffer> {
        const url = `${this.baseUrl}/v1/agents/${agentId}/bundles/${bundleId}/download`;
        const headers: Record<string, string> = {};

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to download bundle: HTTP ${response.status}`);
        }

        return response.arrayBuffer();
    }

    async importAgent(file: File, conflictPolicy: 'ABORT' | 'RENAME' | 'OVERWRITE'): Promise<ImportJobStatus> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('conflictPolicy', conflictPolicy);

        const url = `${this.baseUrl}/v1/agents/import`;
        const headers: Record<string, string> = {};

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: response.statusText })) as { error?: string };
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json() as Promise<ImportJobStatus>;
    }

    async getImportJobStatus(jobId: string): Promise<ImportJobStatus> {
        return this.request<ImportJobStatus>(`/v1/agents/import/${jobId}`);
    }

    async resolveImportConflict(jobId: string, policy: 'ABORT' | 'RENAME' | 'OVERWRITE'): Promise<ImportJobStatus> {
        return this.request<ImportJobStatus>(`/v1/agents/import/${jobId}/resolve`, {
            method: 'POST',
            body: JSON.stringify({ policy }),
        });
    }

    async listLocales(): Promise<Array<{ code: string; name: string }>> {
        return this.request<Array<{ code: string; name: string }>>('/v1/i18n/locales');
    }

    async getMessages(locale: string, category?: string): Promise<Array<{ key: string; value: string }>> {
        const params = new URLSearchParams({ locale });
        if (category) {
            params.append('category', category);
        }
        return this.request<Array<{ key: string; value: string }>>(`/v1/i18n/messages?${params}`);
    }
}