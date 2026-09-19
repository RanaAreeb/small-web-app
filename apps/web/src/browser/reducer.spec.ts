import {
  browserReducer,
  canGoBack,
  canGoForward,
  createInitialBrowserState,
  getCurrentEntry,
} from './index';
import type { BrowserState, SearchResultSnapshot } from './types';
import { loadBrowserSession, saveBrowserSession } from './session';

function page(
  address: string,
  title = address,
  html = `<p>${address}</p>`,
) {
  return {
    type: 'push_page' as const,
    address,
    title,
    sanitizedHtml: html,
  };
}

function searchResults(label: string): SearchResultSnapshot[] {
  return [
    {
      address: `${label}-one.zz`,
      title: `${label} One`,
      snippet: `${label} snippet one`,
      author: { id: '1', name: 'Ada', slug: 'ada' },
    },
    {
      address: `${label}-two.zz`,
      title: `${label} Two`,
      snippet: `${label} snippet two`,
      author: { id: '2', name: 'Jon', slug: 'jon' },
    },
  ];
}

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

describe('browserReducer', () => {
  it('A -> B -> C -> back -> back -> D loses B/C as forward entries', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('a.zz', 'A'));
    state = browserReducer(state, page('b.zz', 'B'));
    state = browserReducer(state, page('c.zz', 'C'));

    expect(state.entries.map((entry) => entry.kind === 'page' && entry.address)).toEqual([
      'a.zz',
      'b.zz',
      'c.zz',
    ]);

    state = browserReducer(state, { type: 'back' });
    state = browserReducer(state, { type: 'back' });
    expect(getCurrentEntry(state)).toMatchObject({ kind: 'page', address: 'a.zz' });
    expect(canGoForward(state)).toBe(true);

    state = browserReducer(state, page('d.zz', 'D'));

    expect(state.entries.map((entry) => (entry.kind === 'page' ? entry.address : null))).toEqual([
      'a.zz',
      'd.zz',
    ]);
    expect(canGoForward(state)).toBe(false);
    expect(canGoBack(state)).toBe(true);
  });

  it('A -> B -> back -> forward restores the exact B snapshot', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('a.zz', 'A', '<p>A</p>'));
    state = browserReducer(state, page('b.zz', 'B Title', '<p>Exact B</p>'));
    state = browserReducer(state, {
      type: 'update_scroll',
      scrollY: 240,
    });

    const snapshotB = structuredClone(getCurrentEntry(state));

    state = browserReducer(state, { type: 'back' });
    expect(getCurrentEntry(state)).toMatchObject({ address: 'a.zz' });

    state = browserReducer(state, { type: 'forward' });
    expect(getCurrentEntry(state)).toEqual(snapshotB);
    expect(getCurrentEntry(state)).toMatchObject({
      kind: 'page',
      address: 'b.zz',
      title: 'B Title',
      sanitizedHtml: '<p>Exact B</p>',
      scrollY: 240,
    });
  });

  it('Search -> result -> back restores the same query and result order', () => {
    const results = searchResults('garden');
    let state = createInitialBrowserState('person-a');

    state = browserReducer(state, {
      type: 'push_search',
      query: 'garden',
      results,
    });
    state = browserReducer(state, {
      type: 'update_scroll',
      scrollY: 88,
    });

    const searchSnapshot = structuredClone(getCurrentEntry(state));

    state = browserReducer(
      state,
      page(results[0]!.address, results[0]!.title, '<p>Result</p>'),
    );
    expect(getCurrentEntry(state)).toMatchObject({
      kind: 'page',
      address: 'garden-one.zz',
    });

    state = browserReducer(state, { type: 'back' });
    expect(getCurrentEntry(state)).toEqual(searchSnapshot);
    expect(getCurrentEntry(state)).toMatchObject({
      kind: 'search',
      query: 'garden',
      scrollY: 88,
      results: [
        expect.objectContaining({ address: 'garden-one.zz' }),
        expect.objectContaining({ address: 'garden-two.zz' }),
      ],
    });
  });

  it('A -> B -> C -> back restores B with forward enabled', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('a.zz', 'A'));
    state = browserReducer(state, page('b.zz', 'B', '<p>Exact B</p>'));
    state = browserReducer(state, {
      type: 'update_scroll',
      scrollY: 120,
    });
    const snapshotB = structuredClone(getCurrentEntry(state));
    state = browserReducer(state, page('c.zz', 'C'));

    state = browserReducer(state, { type: 'back' });

    expect(getCurrentEntry(state)).toEqual(snapshotB);
    expect(canGoBack(state)).toBe(true);
    expect(canGoForward(state)).toBe(true);
  });

  it('A -> B -> C -> back -> back leaves A with forward only', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('a.zz', 'A'));
    state = browserReducer(state, page('b.zz', 'B'));
    state = browserReducer(state, page('c.zz', 'C'));

    state = browserReducer(state, { type: 'back' });
    state = browserReducer(state, { type: 'back' });

    expect(getCurrentEntry(state)).toMatchObject({ address: 'a.zz' });
    expect(canGoBack(state)).toBe(false);
    expect(canGoForward(state)).toBe(true);
  });

  it('forward walks A <- B <- C back to C', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('a.zz', 'A'));
    state = browserReducer(state, page('b.zz', 'B'));
    state = browserReducer(state, page('c.zz', 'C'));
    state = browserReducer(state, { type: 'back' });
    state = browserReducer(state, { type: 'back' });

    state = browserReducer(state, { type: 'forward' });
    expect(getCurrentEntry(state)).toMatchObject({ address: 'b.zz' });
    expect(canGoBack(state)).toBe(true);
    expect(canGoForward(state)).toBe(true);

    state = browserReducer(state, { type: 'forward' });
    expect(getCurrentEntry(state)).toMatchObject({ address: 'c.zz' });
    expect(canGoForward(state)).toBe(false);
  });

  it('circular revisits append another entry without deduplicating', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('tidepool.zz', 'Tidepool', '<p>1</p>'));
    state = browserReducer(state, page('kettleclub.zz', 'Kettle'));
    state = browserReducer(state, page('tidepool.zz', 'Tidepool', '<p>2</p>'));

    expect(
      state.entries.map((entry) =>
        entry.kind === 'page' ? entry.address : null,
      ),
    ).toEqual(['tidepool.zz', 'kettleclub.zz', 'tidepool.zz']);
    expect(getCurrentEntry(state)).toMatchObject({
      kind: 'page',
      address: 'tidepool.zz',
      sanitizedHtml: '<p>2</p>',
    });
  });

  it('back does not append an entry', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('a.zz'));
    state = browserReducer(state, page('b.zz'));

    const before = state.entries.length;
    state = browserReducer(state, { type: 'back' });

    expect(state.entries).toHaveLength(before);
    expect(state.index).toBe(0);
  });

  it('separate people restore separate sessions', () => {
    const storage = memoryStorage();

    let ada: BrowserState = createInitialBrowserState('ada');
    ada = browserReducer(ada, page('tidepool.zz', 'Tidepool'));
    ada = browserReducer(ada, page('nighttrain.zz', 'Night Train'));
    saveBrowserSession(ada, storage);

    let jon: BrowserState = createInitialBrowserState('jon');
    jon = browserReducer(jon, {
      type: 'push_search',
      query: 'moss',
      results: searchResults('moss'),
    });
    saveBrowserSession(jon, storage);

    const restoredAda = loadBrowserSession('ada', storage);
    const restoredJon = loadBrowserSession('jon', storage);

    expect(restoredAda.entries.map((entry) => (entry.kind === 'page' ? entry.address : null))).toEqual([
      'tidepool.zz',
      'nighttrain.zz',
    ]);
    expect(restoredJon.entries).toHaveLength(1);
    expect(restoredJon.entries[0]).toMatchObject({
      kind: 'search',
      query: 'moss',
    });

    // Switching person with restored session keeps histories isolated.
    const switched = browserReducer(ada, {
      type: 'switch_person',
      personId: 'jon',
      entries: restoredJon.entries,
      index: restoredJon.index,
    });
    expect(switched.personId).toBe('jon');
    expect(getCurrentEntry(switched)).toMatchObject({ kind: 'search', query: 'moss' });
    expect(loadBrowserSession('ada', storage).entries).toHaveLength(2);
  });

  it('push_not_found stores address and scrollY', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, { type: 'push_not_found', address: 'ghostport.zz' });
    state = browserReducer(state, { type: 'update_scroll', scrollY: 12 });

    expect(getCurrentEntry(state)).toEqual({
      kind: 'not_found',
      address: 'ghostport.zz',
      scrollY: 12,
    });
  });

  it('caps sessions at 50 entries', () => {
    let state = createInitialBrowserState('person-a');
    for (let i = 0; i < 55; i += 1) {
      state = browserReducer(state, page(`site-${i}.zz`, `Site ${i}`));
    }

    expect(state.entries).toHaveLength(50);
    expect(state.index).toBe(49);
    expect(state.entries[0]).toMatchObject({ address: 'site-5.zz' });
    expect(state.entries[49]).toMatchObject({ address: 'site-54.zz' });
  });

  it('reset clears entries but keeps personId', () => {
    let state = createInitialBrowserState('person-a');
    state = browserReducer(state, page('a.zz'));
    state = browserReducer(state, { type: 'reset' });

    expect(state).toEqual({
      personId: 'person-a',
      entries: [],
      index: -1,
    });
  });
});
