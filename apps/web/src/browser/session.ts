import {
  BROWSER_SESSION_VERSION,
  BrowserEntry,
  BrowserState,
  MAX_BROWSER_ENTRIES,
  MAX_SESSION_BYTES,
  PersistedBrowserSession,
  SearchResultSnapshot,
  createInitialBrowserState,
} from './types';

function storageKey(personId: string): string {
  return `small-web:browser-session:${personId}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isAuthor(value: unknown): value is SearchResultSnapshot['author'] {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.slug === 'string'
  );
}

function isSearchResult(value: unknown): value is SearchResultSnapshot {
  return (
    isObject(value) &&
    typeof value.address === 'string' &&
    typeof value.title === 'string' &&
    typeof value.snippet === 'string' &&
    isAuthor(value.author)
  );
}

function isBrowserEntry(value: unknown): value is BrowserEntry {
  if (!isObject(value) || typeof value.kind !== 'string' || !isFiniteNumber(value.scrollY)) {
    return false;
  }

  if (value.kind === 'page') {
    return (
      typeof value.address === 'string' &&
      typeof value.title === 'string' &&
      typeof value.sanitizedHtml === 'string'
    );
  }

  if (value.kind === 'not_found') {
    return typeof value.address === 'string';
  }

  if (value.kind === 'search') {
    return (
      typeof value.query === 'string' &&
      Array.isArray(value.results) &&
      value.results.every(isSearchResult)
    );
  }

  return false;
}

/** Validate restored localStorage payloads before hydration. */
export function validatePersistedSession(
  value: unknown,
  expectedPersonId?: string,
): PersistedBrowserSession | null {
  if (!isObject(value)) {
    return null;
  }

  if (value.version !== BROWSER_SESSION_VERSION) {
    return null;
  }

  if (typeof value.personId !== 'string' || value.personId.length === 0) {
    return null;
  }

  if (expectedPersonId && value.personId !== expectedPersonId) {
    return null;
  }

  if (!Array.isArray(value.entries) || value.entries.length > MAX_BROWSER_ENTRIES) {
    return null;
  }

  if (!value.entries.every(isBrowserEntry)) {
    return null;
  }

  if (!isFiniteNumber(value.index)) {
    return null;
  }

  if (value.entries.length === 0) {
    if (value.index !== -1) {
      return null;
    }
  } else if (value.index < 0 || value.index >= value.entries.length) {
    return null;
  }

  return {
    version: BROWSER_SESSION_VERSION,
    personId: value.personId,
    entries: value.entries as BrowserEntry[],
    index: value.index,
  };
}

export function sessionToState(
  session: PersistedBrowserSession | null,
  personId: string,
): BrowserState {
  if (!session) {
    return createInitialBrowserState(personId);
  }

  return {
    personId: session.personId,
    entries: session.entries,
    index: session.index,
  };
}

export function stateToSession(state: BrowserState): PersistedBrowserSession | null {
  if (!state.personId) {
    return null;
  }

  return {
    version: BROWSER_SESSION_VERSION,
    personId: state.personId,
    entries: state.entries,
    index: state.index,
  };
}

export function loadBrowserSession(
  personId: string,
  storage: Pick<Storage, 'getItem' | 'removeItem'> = globalThis.localStorage,
): BrowserState {
  try {
    const raw = storage.getItem(storageKey(personId));
    if (!raw) {
      return createInitialBrowserState(personId);
    }

    if (raw.length > MAX_SESSION_BYTES) {
      storage.removeItem(storageKey(personId));
      return createInitialBrowserState(personId);
    }

    const parsed: unknown = JSON.parse(raw);
    const validated = validatePersistedSession(parsed, personId);
    if (!validated) {
      storage.removeItem(storageKey(personId));
      return createInitialBrowserState(personId);
    }

    return sessionToState(validated, personId);
  } catch {
    try {
      storage.removeItem(storageKey(personId));
    } catch {
      // ignore storage failures
    }
    return createInitialBrowserState(personId);
  }
}

export function saveBrowserSession(
  state: BrowserState,
  storage: Pick<Storage, 'setItem' | 'removeItem'> = globalThis.localStorage,
): void {
  if (!state.personId) {
    return;
  }

  const session = stateToSession(state);
  if (!session) {
    return;
  }

  try {
    const serialized = JSON.stringify(session);
    if (serialized.length > MAX_SESSION_BYTES) {
      storage.removeItem(storageKey(state.personId));
      return;
    }
    storage.setItem(storageKey(state.personId), serialized);
  } catch {
    try {
      storage.removeItem(storageKey(state.personId));
    } catch {
      // ignore storage failures
    }
  }
}

export function clearBrowserSession(
  personId: string,
  storage: Pick<Storage, 'removeItem'> = globalThis.localStorage,
): void {
  try {
    storage.removeItem(storageKey(personId));
  } catch {
    // ignore storage failures
  }
}
