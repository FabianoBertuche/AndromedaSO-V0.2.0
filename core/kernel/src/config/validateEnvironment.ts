import { Client } from 'pg';
import pino from 'pino';

const logger = pino({ name: 'validateEnvironment' });

export async function validateEnvironment(): Promise<void> {
  const pgRequired = String(process.env.PG_REQUIRED || 'false').toLowerCase() === 'true';
  const databaseUrl = process.env.DATABASE_URL;

  if (!pgRequired) {
    if (!databaseUrl) {
      logger.warn('DATABASE_URL não definida. Banco de dados desabilitado (PG_REQUIRED=false).');
    }
    return;
  }

  // PG_REQUIRED=true: DATABASE_URL é obrigatória
  if (!databaseUrl) {
    logger.error('DATABASE_URL não definida mas PG_REQUIRED=true. Encerrando processo.');
    process.exit(1);
  }

  // Testar conexão com timeout de 5000ms
  const client = new Client({ connectionString: databaseUrl });
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout de conexão com o banco de dados (5000ms)')), 5000)
  );

  try {
    await Promise.race([client.connect(), timeout]);
    await client.end();
    logger.info('Conexão com o banco de dados verificada com sucesso.');
  } catch (err) {
    logger.error({ err }, 'Falha ao conectar ao banco de dados. PG_REQUIRED=true. Encerrando processo.');
    process.exit(1);
  }
}
