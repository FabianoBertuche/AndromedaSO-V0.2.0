export enum SkillType {
    SCRIPT = "script",
    API = "api",
    TOOL = "tool",
}

export interface SkillProps {
    id: string;
    name: string;
    description: string;
    type: SkillType;
    schema?: Record<string, any>; // JSON Schema para parâmetros
    code?: string; // Para scripts
}

export class Skill {
    private readonly id: string;
    private readonly name: string;
    private readonly description: string;
    private readonly type: SkillType;
    private readonly schema: Record<string, any>;
    private readonly code?: string;

    constructor(props: SkillProps) {
        this.id = props.id;
        this.name = props.name;
        this.description = props.description;
        this.type = props.type;
        this.schema = props.schema || {};
        this.code = props.code;
    }

    getId(): string { return this.id; }
    getName(): string { return this.name; }
    getDescription(): string { return this.description; }
    getType(): SkillType { return this.type; }
    getSchema(): Record<string, any> { return this.schema; }
    getCode(): string | undefined { return this.code; }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            schema: this.schema,
            code: this.code,
        };
    }
}
