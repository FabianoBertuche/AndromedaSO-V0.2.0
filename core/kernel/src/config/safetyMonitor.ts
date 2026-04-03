import pino from 'pino';
import { SAFETY } from './safety';

const logger = pino({ name: 'safetyMonitor' });

export class SafetyMonitor {
  private readonly failures: Map<string, number[]> = new Map();

  constructor(
    private readonly threshold: number = 5,
    private readonly windowMs: number = 30_000
  ) {}

  recordFailure(operation: string, moduleId: string): boolean {
    const key = `${operation}:${moduleId}`;
    const now = Date.now();
    const existing = this.failures.get(key) ?? [];
    const recent = existing.filter((ts) => now - ts <= this.windowMs);
    recent.push(now);
    this.failures.set(key, recent);

    const isStorm = recent.length >= this.threshold;
    if (isStorm) {
      logger.warn({ operation, moduleId, failures: recent.length, windowMs: this.windowMs }, 'Retry storm detected');
    }

    return isStorm;
  }

  reset() {
    this.failures.clear();
  }
}

export const safetyMonitor = new SafetyMonitor(SAFETY.STORM);
