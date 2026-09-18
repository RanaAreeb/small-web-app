export const MAX_BROWSER_ENTRIES = 50;
export const BROWSER_SESSION_VERSION = 1 as const;
export const MAX_SESSION_BYTES = 1_500_000;

export type SearchResultSnapshot = {
  address: string;
  title: string;
  snippet: string;
  author: {
    id: string;
    name: string;
    slug: string;
  };
};

export type PageEntry = {
  kind: 'page';
  address: string;
  title: string;
  sanitizedHtml: string;
  scrollY: number;
};

export type NotFoundEntry = {
  kind: 'not_found';
  address: string;
  scrollY: number;
};

export type SearchEntry = {
  kind: 'search';
  query: string;
  results: SearchResultSnapshot[];
  scrollY: number;
};

export type BrowserEntry = PageEntry | NotFoundEntry | SearchEntry;

export type BrowserState = {
  personId: string | null;
  entries: BrowserEntry[];
  index: number;
};

export type BrowserAction =
  | {
      type: 'push_page';
      address: string;
      title: string;
      sanitizedHtml: string;
    }
  | { type: 'push_not_found'; address: string }
  | {
      type: 'push_search';
      query: string;
      results: SearchResultSnapshot[];
    }
  | { type: 'back' }
  | { type: 'forward' }
  | { type: 'update_scroll'; scrollY: number }
  | { type: 'reset' }
  | {
      type: 'switch_person';
      personId: string;
      entries?: BrowserEntry[];
      index?: number;
    };

export type PersistedBrowserSession = {
  version: typeof BROWSER_SESSION_VERSION;
  personId: string;
  entries: BrowserEntry[];
  index: number;
};

export function createInitialBrowserState(
  personId: string | null = null,
): BrowserState {
  return {
    personId,
    entries: [],
    index: -1,
  };
}

export function canGoBack(state: BrowserState): boolean {
  return state.index > 0;
}

export function canGoForward(state: BrowserState): boolean {
  return state.index >= 0 && state.index < state.entries.length - 1;
}

export function getCurrentEntry(
  state: BrowserState,
): BrowserEntry | null {
  if (state.index < 0 || state.index >= state.entries.length) {
    return null;
  }
  return state.entries[state.index] ?? null;
}
