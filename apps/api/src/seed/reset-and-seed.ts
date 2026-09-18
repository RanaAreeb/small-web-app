import mongoose from 'mongoose';
import { runSeed, printSeedSummary } from './seed';

/**
 * Drop the configured database and re-seed so E2E starts from a known state.
 * Intended for the isolated `small-web-e2e` database only.
 */
export async function resetAndSeed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is required');
  }

  if (!/\/small-web-e2e(\?|$)/.test(uri)) {
    throw new Error(
      'Refusing to reset: MONGODB_URI must target the small-web-e2e database',
    );
  }

  await mongoose.connect(uri);
  try {
    await mongoose.connection.dropDatabase();
    const summary = await runSeed();
    printSeedSummary(summary);
  } finally {
    await mongoose.disconnect();
  }
}

async function main(): Promise<void> {
  await resetAndSeed();
}

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
