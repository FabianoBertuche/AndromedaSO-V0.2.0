import { v4 as uuidv4 } from "uuid";

export interface AgentProps {
    id?: string;
    name: string;
    description: string;
    model: string;
    systemPrompt: string;
    temperature?: number;
}

export class Agent {
    private id: string;
    private props: AgentProps;

    constructor(props: AgentProps) {
        this.id = props.id || uuidv4();
        this.props = {
            ...props,
            temperature: props.temperature ?? 0.7,
        };
    }

    getId(): string { return this.id; }
    getName(): string { return this.props.name; }
    getDescription(): string { return this.props.description; }
    getModel(): string { return this.props.model; }
    getSystemPrompt(): string { return this.props.systemPrompt; }
    getTemperature(): number { return this.props.temperature!; }

    toJSON() {
        return {
            id: this.id,
            ...this.props,
        };
    }
}
