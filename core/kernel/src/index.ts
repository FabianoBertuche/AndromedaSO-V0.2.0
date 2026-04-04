import { config } from './config/index.js';
import { buildServer } from './server.js';

const start = async () => {
  try {
    const server = await buildServer();
    await server.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Core/Kernel API running at http://0.0.0.0:${config.port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
