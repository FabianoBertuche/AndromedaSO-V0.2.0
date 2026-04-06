import CircuitBreaker from "opossum";
import { logger } from "../../shared/logger";

export function setupCircuitBreakerEvents(breaker: CircuitBreaker, name: string): void {
    breaker.on('open', () => {
        logger.warn({ circuitBreaker: name }, `Circuit breaker [${name}] OPENED`);
    });

    breaker.on('halfOpen', () => {
        logger.info({ circuitBreaker: name }, `Circuit breaker [${name}] HALF-OPENED`);
    });

    breaker.on('close', () => {
        logger.info({ circuitBreaker: name }, `Circuit breaker [${name}] CLOSED`);
    });

    breaker.on('fallback', (result, err) => {
        logger.warn({ circuitBreaker: name, err }, `Circuit breaker [${name}] FALLBACK triggered`);
    });

    breaker.on('failure', (err) => {
        logger.error({ circuitBreaker: name, err }, `Circuit breaker [${name}] FAILURE`);
    });
}
