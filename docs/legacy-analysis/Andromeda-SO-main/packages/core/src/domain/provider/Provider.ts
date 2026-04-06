import { v4 as uuidv4 } from "uuid";

export interface ProviderProps {
    id?: string;
    name: string;
    type: string; // e.g., 'ollama', 'openai', 'anthropic'
    baseUrl: string;
    enabled: boolean;
    credentials?: Record<string, any>;
    metadata?: Record<string, any>;
}

export class Provider {
    private id: string;
    private props: ProviderProps;

    constructor(props: ProviderProps) {
        this.id = props.id || uuidv4();
        this.props = {
            ...props,
            enabled: props.enabled ?? true,
        };
    }

    getId(): string { return this.id; }
    getName(): string { return this.props.name; }
    getType(): string { return this.props.type; }
    getBaseUrl(): string { return this.props.baseUrl; }
    isEnabled(): boolean { return this.props.enabled; }
    getCredentials(): Record<string, any> | undefined { return this.props.credentials; }
    getMetadata(): Record<string, any> | undefined { return this.props.metadata; }

    enable() { this.props.enabled = true; }
    disable() { this.props.enabled = false; }

    toJSON() {
        return {
            id: this.id,
            ...this.props,
        };
    }
}
