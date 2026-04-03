import pino from 'pino';
import { Gauge, Registry } from 'prom-client';

const logger = pino({ name: 'metrics' });
const registry = new Registry();
const retryStormTotal = new Gauge({
  name: 'retry_storm_total',
  help: 'Storms',
  registers: [registry]
});

export class MetricsService {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  incrementCounter(name: string, value: number = 1) {
    const current = this.counters.get(name) || 0;
    const next = current + value;
    this.counters.set(name, next);
    if (name === 'retry_storm_alerts') {
      retryStormTotal.set(next);
    }
    logger.debug({ name, value: next }, 'Incremented counter');
  }

  setGauge(name: string, value: number) {
    this.gauges.set(name, value);
    logger.debug({ name, value }, 'Set gauge');
  }

  getMetrics() {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      prometheus: {
        retry_storm_total: this.counters.get('retry_storm_alerts') || 0
      },
      timestamp: new Date().toISOString()
    };
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
    logger.info('Metrics reset');
  }
}

export const metrics = new MetricsService();