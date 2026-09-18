import { spawn } from 'node:child_process';
import {
  E2E_API_ORIGIN,
  E2E_API_URL,
  E2E_WEB_ORIGIN,
  E2E_WEB_PORT,
  getE2eEnv,
  root,
} from './env.mjs';

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: 'inherit',
      shell: true,
    });
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
      }
    });
    child.on('error', reject);
  });
}

function start(command, args, env) {
  const child = spawn(command, args, {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: true,
    windowsHide: true,
  });
  return child;
}

function killTree(child) {
  if (!child || child.killed || child.exitCode !== null) {
    return;
  }
  if (process.platform === 'win32' && child.pid) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }
  child.kill('SIGTERM');
}

async function waitForUrl(url, timeoutMs = 120_000) {
  const startAt = Date.now();
  let lastError;
  while (Date.now() - startAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`);
}

async function main() {
  const env = getE2eEnv();
  console.log(`[e2e] Using API ${E2E_API_URL}`);
  console.log(`[e2e] Using web ${E2E_WEB_ORIGIN}`);
  console.log(`[e2e] Mongo DB from MONGODB_URI rewritten to small-web-e2e`);

  await run('pnpm', ['--filter', '@small-web/api', 'build'], env);
  await run(
    'pnpm',
    ['--filter', '@small-web/web', 'build'],
    { ...env, NEXT_PUBLIC_API_URL: E2E_API_URL },
  );

  const children = [];
  const shutdown = () => {
    for (const child of children) {
      killTree(child);
    }
  };
  process.on('exit', shutdown);
  process.on('SIGINT', () => {
    shutdown();
    process.exit(130);
  });
  process.on('SIGTERM', () => {
    shutdown();
    process.exit(143);
  });

  children.push(
    start(
      'pnpm',
      ['--filter', '@small-web/api', 'start'],
      env,
    ),
  );
  children.push(
    start(
      'pnpm',
      ['--filter', '@small-web/web', 'exec', 'next', 'start', '--port', String(E2E_WEB_PORT), '--hostname', '127.0.0.1'],
      { ...env, PORT: String(E2E_WEB_PORT) },
    ),
  );

  await waitForUrl(`${E2E_API_ORIGIN}/api/health`);
  await waitForUrl(E2E_WEB_ORIGIN);

  const playwright = spawn(
    'pnpm',
    ['exec', 'playwright', 'test'],
    {
      cwd: root,
      env: {
        ...env,
        E2E_WEB_ORIGIN,
        E2E_API_URL,
      },
      stdio: 'inherit',
      shell: true,
    },
  );

  const code = await new Promise((resolve) => {
    playwright.on('exit', (exitCode) => resolve(exitCode ?? 1));
  });

  shutdown();
  process.exit(code);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
