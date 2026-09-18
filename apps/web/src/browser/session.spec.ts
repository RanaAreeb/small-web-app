import {
  loadBrowserSession,
  saveBrowserSession,
  validatePersistedSession,
} from './session';
import { BROWSER_SESSION_VERSION, MAX_BROWSER_ENTRIES } from './types';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? (map.get(key) ?? null) : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('browser session persistence', () => {
  it('discards corrupt localStorage payloads', () => {
    const storage = memoryStorage({
      'small-web:browser-session:ada': '{not-json',
    });

    const state = loadBrowserSession('ada', storage);
    expect(state.entries).toEqual([]);
    expect(storage.getItem('small-web:browser-session:ada')).toBeNull();
  });

  it('discards oversized entry arrays', () => {
    const entries = Array.from({ length: MAX_BROWSER_ENTRIES + 1 }, (_, i) => ({
      kind: 'not_found' as const,
      address: `x${i}.zz`,
      scrollY: 0,
    }));

    expect(
      validatePersistedSession({
        version: BROWSER_SESSION_VERSION,
        personId: 'ada',
        entries,
        index: 0,
      }),
    ).toBeNull();
  });

  it('discards sessions for the wrong person id', () => {
    expect(
      validatePersistedSession(
        {
          version: BROWSER_SESSION_VERSION,
          personId: 'jon',
          entries: [],
          index: -1,
        },
        'ada',
      ),
    ).toBeNull();
  });

  it('round-trips a valid session', () => {
    const storage = memoryStorage();
    saveBrowserSession(
      {
        personId: 'ada',
        index: 0,
        entries: [
          {
            kind: 'page',
            address: 'tidepool.zz',
            title: 'Tidepool',
            sanitizedHtml: '<p>Hi</p>',
            scrollY: 40,
          },
        ],
      },
      storage,
    );

    expect(loadBrowserSession('ada', storage)).toEqual({
      personId: 'ada',
      index: 0,
      entries: [
        {
          kind: 'page',
          address: 'tidepool.zz',
          title: 'Tidepool',
          sanitizedHtml: '<p>Hi</p>',
          scrollY: 40,
        },
      ],
    });
  });
});
