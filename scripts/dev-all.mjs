import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const root = process.cwd();
const backendCwd = path.join(root, 'core', 'kernel');
const frontendCwd = path.join(root, 'frontend');

const isWindows = process.platform === 'win32';

function runNpm(cwd, args, extraEnv = {}) {
  if (isWindows) {
    return spawn('cmd.exe', ['/d', '/s', '/c', `npm ${args.join(' ')}`], {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...extraEnv
      }
    });
  }

  return spawn('npm', args, {
    cwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      ...extraEnv
    }
  });
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

async function pickBackendPort() {
  const candidates = [4000, 4001, 4010, 4020, 4030];
  for (const port of candidates) {
    // eslint-disable-next-line no-await-in-loop
    const free = await checkPortFree(port);
    if (free) {
      return port;
    }
  }
  throw new Error(`No free backend port found: ${candidates.join(', ')}`);
}

const selectedBackendPort = await pickBackendPort();
const apiTarget = `http://localhost:${selectedBackendPort}`;

const backend = runNpm(backendCwd, ['start'], {
  PORT: String(selectedBackendPort)
});

const frontend = runNpm(frontendCwd, ['run', 'dev'], {
  VITE_API_TARGET: apiTarget
});

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;

  if (!backend.killed) {
    backend.kill('SIGTERM');
  }
  if (!frontend.killed) {
    frontend.kill('SIGTERM');
  }

  setTimeout(() => {
    process.exit(code);
  }, 400);
}

backend.on('exit', (code) => {
  if (!shuttingDown && code && code !== 0) {
    shutdown(code);
  }
});

frontend.on('exit', (code) => {
  if (!shuttingDown && code && code !== 0) {
    shutdown(code);
  }
});

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

console.log(`[dev-all] Starting backend and frontend with API=${apiTarget}`);
