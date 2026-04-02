import Redis from 'ioredis';
export declare const redis: Redis;
export declare const setModuleState: (id: string, payload: unknown) => Promise<void>;
export declare const getModuleState: (id: string) => Promise<any>;
export declare const getActiveRegistry: () => Promise<any[]>;
