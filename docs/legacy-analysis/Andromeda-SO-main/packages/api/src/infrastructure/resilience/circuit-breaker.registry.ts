import CircuitBreaker from "opossum";

class CircuitBreakerRegistry {
    private breakers: Map<string, CircuitBreaker<any, any>> = new Map();

    register(name: string, breaker: CircuitBreaker<any, any>): void {
        this.breakers.set(name, breaker);
    }

    get(name: string): CircuitBreaker<any, any> | undefined {
        return this.breakers.get(name);
    }

    getAllStats(): Record<string, any> {
        const stats: Record<string, any> = {};
        for (const [name, breaker] of this.breakers.entries()) {
            stats[name] = breaker.stats;
        }
        return stats;
    }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();
