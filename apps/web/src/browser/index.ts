export {
  browserReducer,
} from './reducer';
export {
  canGoBack,
  canGoForward,
  createInitialBrowserState,
  getCurrentEntry,
  MAX_BROWSER_ENTRIES,
} from './types';
export type {
  BrowserAction,
  BrowserEntry,
  BrowserState,
  NotFoundEntry,
  PageEntry,
  PersistedBrowserSession,
  SearchEntry,
  SearchResultSnapshot,
} from './types';
export {
  clearBrowserSession,
  loadBrowserSession,
  saveBrowserSession,
  validatePersistedSession,
} from './session';
