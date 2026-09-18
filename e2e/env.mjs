import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const E2E_WEB_PORT = 3100;
export const E2E_API_PORT = 4100;
export const E2E_WEB_ORIGIN = `http://127.0.0.1:${E2E_WEB_PORT}`;
export const E2E_API_ORIGIN = `http://127.0.0.1:${E2E_API_PORT}`;
export const E2E_API_URL = `${E2E_API_ORIGIN}/api`;
export const E2E_DB_NAME = 'small-web-e2e';

export function loadDotEnv() {
  const candidates = [resolve(root, '.env'), resolve(root, 'apps/api/.env')];
  for (const file of candidates) {
    if (!existsSync(file)) {
      continue;
    }
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const eq = trimmed.indexOf('=');
      if (eq <= 0) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

/** Rewrite the MongoDB URI path to the isolated E2E database name. */
export function withDatabaseName(uri, dbName) {
  const match = uri.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)\/?([^?]*)(.*)$/i);
  if (!match) {
    throw new Error('Invalid MONGODB_URI');
  }
  const [, prefix, , query = ''] = match;
  return `${prefix}/${dbName}${query}`;
}

export function getE2eEnv() {
  loadDotEnv();
  const baseUri = process.env.MONGODB_URI;
  if (!baseUri) {
    throw new Error('MONGODB_URI is required for E2E tests');
  }

  return {
    ...process.env,
    MONGODB_URI: withDatabaseName(baseUri, E2E_DB_NAME),
    PORT: String(E2E_API_PORT),
    WEB_ORIGIN: E2E_WEB_ORIGIN,
    NEXT_PUBLIC_API_URL: E2E_API_URL,
  };
}

export { root };
