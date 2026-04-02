import { describe, it, expect } from 'vitest';
import { GenericContainer } from 'testcontainers';
import { Pool } from 'pg';
import Redis from 'ioredis';
describe('integration harness', () => {
    it('starts PostgreSQL container and executes a query', async () => {
        const postgresContainer = await new GenericContainer('postgres', '15-alpine')
            .withEnv('POSTGRES_USER', 'andromeda')
            .withEnv('POSTGRES_PASSWORD', 'andromeda')
            .withEnv('POSTGRES_DB', 'andromeda')
            .withExposedPorts(5432)
            .start();
        const mappedPort = postgresContainer.getMappedPort(5432);
        const client = new Pool({
            host: postgresContainer.getHost(),
            port: mappedPort,
            user: 'andromeda',
            password: 'andromeda',
            database: 'andromeda'
        });
        const result = await client.query('SELECT 1 AS ok');
        await client.end();
        await postgresContainer.stop();
        expect(result.rows[0].ok).toBe(1);
    }, 120000);
    it('starts Redis container and performs key operations', async () => {
        const redisContainer = await new GenericContainer('redis', '7-alpine')
            .withExposedPorts(6379)
            .start();
        const redisClient = new Redis({
            host: redisContainer.getHost(),
            port: redisContainer.getMappedPort(6379)
        });
        await redisClient.set('integration:test', 'ok');
        const value = await redisClient.get('integration:test');
        await redisClient.disconnect();
        await redisContainer.stop();
        expect(value).toBe('ok');
    }, 120000);
});
//# sourceMappingURL=harness.integration.spec.js.map