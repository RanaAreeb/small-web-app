import { spawn } from 'node:child_process';
import { getE2eEnv, root } from './env.mjs';

export default async function globalSetup() {
  const env = getE2eEnv();
  await new Promise((resolve, reject) => {
    const child = spawn(
      'pnpm',
      [
        '--filter',
        '@small-web/api',
        'exec',
        'ts-node',
        '-r',
        'tsconfig-paths/register',
        'src/seed/reset-and-seed.ts',
      ],
      {
        cwd: root,
        env,
        stdio: 'inherit',
        shell: true,
      },
    );
    child.on('exit', (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(new Error(`E2E database reset failed with exit code ${code}`));
      }
    });
    child.on('error', reject);
  });
}
