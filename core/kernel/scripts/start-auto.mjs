import net from 'node:net';
import { spawn } from 'node:child_process';

function parsePreferredPorts() {
  const arg = process.argv.find((item) => item.startsWith('--preferred='));
  if (!arg) {
    return [4000, 4001, 4010, 4020, 4030];
  }
  const values = arg.slice('--preferred='.length).split(',').map((item) => Number(item.trim())).filter((item) => Number.isInteger(item) && item > 0);
  return values.length > 0 ? values : [4000, 4001, 4010, 4020, 4030];
}

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ port, host: '0.0.0.0' }, () => {
      server.close(() => resolve(true));
    });
  });
}

async function pickPort(candidates) {
  if (process.env.PORT) {
    const envPort = Number(process.env.PORT);
    if (Number.isInteger(envPort) && envPort > 0) {
      return envPort;
    }
  }

  for (const port of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const free = await checkPortFree(port);
    if (free) {
      return port;
    }
  }

  throw new Error(`No free port found in candidates: ${candidates.join(', ')}`);
}

async function main() {
  const preferred = parsePreferredPorts();
  const selectedPort = await pickPort(preferred);
  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'npx';
  const args = isWindows
    ? ['/d', '/s', '/c', 'npx tsx src/index.ts']
    : ['tsx', 'src/index.ts'];

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: String(selectedPort)
    }
  });

  console.log(`[kernel] Starting on PORT=${selectedPort}`);

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('[kernel] Failed to start:', error.message);
  process.exit(1);
});
