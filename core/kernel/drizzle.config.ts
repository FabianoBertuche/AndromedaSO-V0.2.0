import type { Config } from 'drizzle-kit';

export default {
  dialect: 'postgresql',
  schema: './src/store/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://andromeda:andromeda@localhost:5432/andromeda'
  }
} satisfies Config;
