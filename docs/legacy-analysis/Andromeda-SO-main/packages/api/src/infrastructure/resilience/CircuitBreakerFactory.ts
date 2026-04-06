import CircuitBreaker from "opossum";
import { setupCircuitBreakerEvents } from "./circuit-breaker.events";

const defaultTimeout = Number(
    process.env.LLM_PROVIDER_TIMEOUT_MS || (process.env.NODE_ENV === "development" ? 180000 : 15000)
);

export interface CircuitBreakerConfig {
    timeout?: number;
    errorThresholdPercentage?: number;
    resetTimeout?: number;
}

export class CircuitBreakerFactory {
    static create<T extends any[], R>(
        name: string,
        action: (...args: T) => Promise<R>,
        config?: CircuitBreakerConfig
    ): CircuitBreaker<T, R> {
        const options = {
            timeout: config?.timeout ?? defaultTimeout,
            errorThresholdPercentage: config?.errorThresholdPercentage || 50, // 50% de falha abre o circuito
            resetTimeout: config?.resetTimeout || 30000, // Tenta novamente após 30 secs
            name,
            volumeThreshold: 5, // Exige 5 chamadas antes de avaliar o erro (5x failures -> circuit_open)
        };

        const breaker = new CircuitBreaker<T, R>(action, options);
        setupCircuitBreakerEvents(breaker, name);

        return breaker;
    }
}
