import { v4 as uuidv4 } from "uuid";

export interface BenchmarkResultProps {
    id?: string;
    modelId: string;
    suite: string;
    taskType: string;
    score: number;
    latencyMs: number;
    success: boolean;
    tokensIn?: number;
    tokensOut?: number;
    estimatedCost?: number;
    notes?: string;
    executedAt?: Date;
}

export class BenchmarkResult {
    private id: string;
    private props: BenchmarkResultProps;

    constructor(props: BenchmarkResultProps) {
        this.id = props.id || uuidv4();
        this.props = {
            ...props,
            executedAt: props.executedAt || new Date(),
        };
    }

    getId(): string { return this.id; }
    getModelId(): string { return this.props.modelId; }
    getSuite(): string { return this.props.suite; }
    getTaskType(): string { return this.props.taskType; }
    getScore(): number { return this.props.score; }
    getLatencyMs(): number { return this.props.latencyMs; }
    isSuccess(): boolean { return this.props.success; }

    toJSON() {
        return {
            id: this.id,
            ...this.props,
        };
    }
}
