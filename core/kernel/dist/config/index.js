import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: Number(process.env.PORT || 4000),
    databaseUrl: process.env.DATABASE_URL || 'postgres://andromeda:andromeda@localhost:5432/andromeda',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    nodeEnv: process.env.NODE_ENV || 'development'
};
//# sourceMappingURL=index.js.map