import type { Config } from 'drizzle-kit';

export default {
  schema: './core/kernel/src/store/schema.ts',
  out: './core/kernel/drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgres://andromeda:andromeda@localhost:5432/andromeda'
  }
} satisfies Config;
