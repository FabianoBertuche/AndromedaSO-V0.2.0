import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm-pg/node';
import { config } from '../config';
const pool = new Pool({ connectionString: config.databaseUrl });
export const db = drizzle(pool);
//# sourceMappingURL=db.js.map