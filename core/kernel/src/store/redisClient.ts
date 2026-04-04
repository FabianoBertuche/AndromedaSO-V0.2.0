/**
 * @reserved Redis Client
 *
 * Este módulo está RESERVADO para uso futuro.
 * O Redis NÃO está ativo no sistema atual.
 *
 * Casos de uso planejados:
 * - Cache de decisões de roteamento LLM (inferRoute)
 * - Pub/Sub para eventos de lifecycle de módulos
 * - Rate limiting distribuído para chamadas a providers
 *
 * Para ativar o Redis:
 * 1. Definir a variável de ambiente REDIS_URL (ex: redis://localhost:6379)
 * 2. Remover a marcação @deprecated de getRedisClient()
 * 3. Substituir as chamadas ao in-memory store pelos métodos Redis correspondentes
 *
 * Dependência já instalada: ioredis ^5.3.2
 */

// import Redis from 'ioredis';
//
// let client: Redis | null = null;
//
// function createRedisClient(): Redis {
//   const url = process.env.REDIS_URL ?? 'redis://localhost:6379';
//   return new Redis(url, {
//     maxRetriesPerRequest: 3,
//     enableReadyCheck: true,
//     lazyConnect: true
//   });
// }

/**
 * Retorna o cliente Redis singleton.
 *
 * @deprecated Não chamar até que o Redis seja ativado oficialmente.
 * Veja os comentários no topo deste arquivo para instruções de ativação.
 */
export function getRedisClient(): never {
  throw new Error(
    'Redis não está ativo. Veja src/store/redisClient.ts para instruções de ativação.'
  );
}
