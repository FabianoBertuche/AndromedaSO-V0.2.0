import { ExecutionStrategy } from "./ExecutionStrategy";
import { Task } from "../task/Task";

export class ExecutionStrategyFactory {
    private strategies: Map<string, ExecutionStrategy> = new Map();

    register(name: string, strategy: ExecutionStrategy): void {
        this.strategies.set(name, strategy);
    }

    getStrategy(task: Task): ExecutionStrategy {
        // Lógica simples: se tiver metadata.skill, usa skill strategy.
        // Se não, usa LLM strategy ou fallback.
        const metadata = task.getMetadata();

        if (metadata.skill && this.strategies.has("skill")) {
            return this.strategies.get("skill")!;
        }

        if (this.strategies.has("llm")) {
            return this.strategies.get("llm")!;
        }

        throw new Error("Nenhuma estratégia de execução disponível");
    }
}
