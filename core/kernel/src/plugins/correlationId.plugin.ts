import { randomUUID } from 'node:crypto';
import type { FastifyPluginAsync } from 'fastify';
import pino from 'pino';

const logger = pino({ name: 'correlationId' });
const MAX_CORRELATION_ID_LENGTH = 128;

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

export const correlationIdPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorateRequest('correlationId', '');

  fastify.addHook('onRequest', async (request, reply) => {
    const incoming = request.headers['x-correlation-id'];
    let correlationId: string;

    if (!incoming || incoming === '') {
      correlationId = randomUUID();
    } else if (typeof incoming === 'string' && incoming.length <= MAX_CORRELATION_ID_LENGTH) {
      correlationId = incoming;
    } else {
      const raw = Array.isArray(incoming) ? incoming[0] : incoming;
      logger.warn({ original: String(raw).slice(0, 50) }, 'x-correlation-id excede 128 caracteres, gerando novo UUID');
      correlationId = randomUUID();
    }

    request.correlationId = correlationId;
    reply.header('x-correlation-id', correlationId);
  });
};
