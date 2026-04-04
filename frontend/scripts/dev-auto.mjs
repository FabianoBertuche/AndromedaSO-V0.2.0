import net from 'node:net';
import http from 'node:http';
import { spawn } from 'node:child_process';

function parseArg(name) {
  const prefix = `--${name}=`;
  const entry = process.argv.find((item) => item.startsWith(prefix));
  return entry ? entry.slice(prefix.length) : null;
}

function parsePortList(value, fallback) {
  if (!value) {
    return fallback;
  }
  const ports = value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isInteger(item) && item > 0);
  return ports.length > 0 ? ports : fallback;
}

function checkPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen({ port, host: '127.0.0.1' }, () => {
      server.close(() => resolve(true));
    });
  });
}

function requestHealth(port) {
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: '127.0.0.1',
        port,
        path: '/api/health',
        timeout: 800
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 200);
      }
    );

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function pickUiPort(candidates) {
  for (const port of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const free = await checkPortFree(port);
    if (free) {
      return port;
    }
  }
  throw new Error(`No free UI port found in candidates: ${candidates.join(', ')}`);
}

async function pickApiTarget(candidates, fallbackPort) {
  if (process.env.VITE_API_TARGET) {
    return process.env.VITE_API_TARGET;
  }

  for (const port of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const healthy = await requestHealth(port);
    if (healthy) {
      return `http://localhost:${port}`;
    }
  }

  return `http://localhost:${fallbackPort}`;
}

async function main() {
  const uiCandidates = parsePortList(parseArg('uiPorts'), [5173, 5175, 5180, 5190]);
  const apiCandidates = parsePortList(parseArg('apiPorts'), [4000, 4001, 4010, 4020, 4030]);
  const apiFallback = apiCandidates[0] ?? 4010;

  const uiPort = await pickUiPort(uiCandidates);
  const apiTarget = await pickApiTarget(apiCandidates, apiFallback);

  const isWindows = process.platform === 'win32';
  const command = isWindows ? 'cmd.exe' : 'npx';
  const args = isWindows
    ? ['/d', '/s', '/c', `npx vite --host localhost --port ${uiPort}`]
    : ['vite', '--host', 'localhost', '--port', String(uiPort)];

  const child = spawn(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_API_TARGET: apiTarget
    }
  });

  console.log(`[frontend] Starting on PORT=${uiPort} with API=${apiTarget}`);

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error('[frontend] Failed to start:', error.message);
  process.exit(1);
});
