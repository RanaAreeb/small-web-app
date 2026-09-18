import {
  BrowserAction,
  BrowserEntry,
  BrowserState,
  MAX_BROWSER_ENTRIES,
  createInitialBrowserState,
} from './types';

function truncateForward(entries: BrowserEntry[], index: number): BrowserEntry[] {
  if (index < 0) {
    return [];
  }
  return entries.slice(0, index + 1);
}

function capEntries(
  entries: BrowserEntry[],
  index: number,
): { entries: BrowserEntry[]; index: number } {
  if (entries.length <= MAX_BROWSER_ENTRIES) {
    return { entries, index };
  }

  const overflow = entries.length - MAX_BROWSER_ENTRIES;
  return {
    entries: entries.slice(overflow),
    index: index - overflow,
  };
}

function pushEntry(state: BrowserState, entry: BrowserEntry): BrowserState {
  const truncated = truncateForward(state.entries, state.index);
  const nextEntries = [...truncated, entry];
  const nextIndex = nextEntries.length - 1;
  const capped = capEntries(nextEntries, nextIndex);

  return {
    ...state,
    entries: capped.entries,
    index: capped.index,
  };
}

/**
 * Pure browser history reducer.
 * Snapshots are immutable on back/forward; fresh navigation truncates forward entries.
 */
export function browserReducer(
  state: BrowserState,
  action: BrowserAction,
): BrowserState {
  switch (action.type) {
    case 'push_page':
      return pushEntry(state, {
        kind: 'page',
        address: action.address,
        title: action.title,
        sanitizedHtml: action.sanitizedHtml,
        scrollY: 0,
      });

    case 'push_not_found':
      return pushEntry(state, {
        kind: 'not_found',
        address: action.address,
        scrollY: 0,
      });

    case 'push_search':
      return pushEntry(state, {
        kind: 'search',
        query: action.query,
        results: action.results.map((result) => ({ ...result, author: { ...result.author } })),
        scrollY: 0,
      });

    case 'back': {
      if (state.index <= 0) {
        return state;
      }
      return {
        ...state,
        index: state.index - 1,
      };
    }

    case 'forward': {
      if (state.index < 0 || state.index >= state.entries.length - 1) {
        return state;
      }
      return {
        ...state,
        index: state.index + 1,
      };
    }

    case 'update_scroll': {
      if (state.index < 0 || state.index >= state.entries.length) {
        return state;
      }

      const current = state.entries[state.index];
      if (!current || current.scrollY === action.scrollY) {
        return state;
      }

      const entries = state.entries.slice();
      entries[state.index] = {
        ...current,
        scrollY: action.scrollY,
      };

      return {
        ...state,
        entries,
      };
    }

    case 'reset':
      return createInitialBrowserState(state.personId);

    case 'switch_person': {
      const entries = action.entries ? action.entries.slice(0, MAX_BROWSER_ENTRIES) : [];
      let index =
        typeof action.index === 'number' ? action.index : entries.length > 0 ? entries.length - 1 : -1;

      if (entries.length === 0) {
        index = -1;
      } else if (index < 0 || index >= entries.length) {
        index = entries.length - 1;
      }

      return {
        personId: action.personId,
        entries,
        index,
      };
    }

    default:
      return state;
  }
}
