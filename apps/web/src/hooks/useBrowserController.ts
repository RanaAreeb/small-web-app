'use client';

import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import {
  browserReducer,
  canGoBack,
  canGoForward,
  createInitialBrowserState,
  getCurrentEntry,
  loadBrowserSession,
  saveBrowserSession,
  type BrowserState,
} from '@/browser';
import { normalizeAddress, InvalidAddressError } from '@/lib/address';
import { api } from '@/lib/api';
import { ApiError, type Person, type VisitVia } from '@/types';

export type BrowserPanel = 'none' | 'search' | 'history' | 'publish';

function addressFromState(state: BrowserState): string {
  const entry = getCurrentEntry(state);
  if (!entry) {
    return '';
  }
  if (entry.kind === 'page' || entry.kind === 'not_found') {
    return entry.address;
  }
  return '';
}

export function useBrowserController() {
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [state, dispatch] = useReducer(
    browserReducer,
    undefined,
    () => createInitialBrowserState(null),
  );
  const [addressInput, setAddressInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [panel, setPanel] = useState<BrowserPanel>('none');
  const [ready, setReady] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const currentEntry = getCurrentEntry(state);
  const backEnabled = canGoBack(state) && !loading;
  const forwardEnabled = canGoForward(state) && !loading;

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const list = await api.listPeople();
        if (cancelled) {
          return;
        }
        setPeople(list);
        const initial = list[0];
        if (!initial) {
          setPeopleError('No people available. Run the API seed first.');
          setReady(true);
          return;
        }
        const restored = loadBrowserSession(initial.id);
        dispatch({
          type: 'switch_person',
          personId: initial.id,
          entries: restored.entries,
          index: restored.index,
        });
        setAddressInput(addressFromState(restored));
        setReady(true);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setPeopleError(
          error instanceof Error ? error.message : 'Failed to load people',
        );
        setReady(true);
      }
    }

    void boot();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!state.personId || !ready) {
      return;
    }
    saveBrowserSession(state);
  }, [state, ready]);

  useEffect(() => {
    setAddressInput(addressFromState(state));
    // Sync the editable field when navigation identity changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps
  }, [state.index, state.personId, currentEntry?.kind]);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node || !currentEntry) {
      return;
    }
    node.scrollTop = currentEntry.scrollY;
    // Restore scroll only when the active entry changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional narrow deps
  }, [state.index, currentEntry?.kind]);

  const recordVisit = useCallback(
    async (input: {
      address: string;
      outcome: 'shown' | 'not_found';
      via: VisitVia;
      siteId?: string;
    }) => {
      const personId = stateRef.current.personId;
      if (!personId) {
        return;
      }
      try {
        await api.createVisit({
          personId,
          address: input.address,
          outcome: input.outcome,
          via: input.via,
          ...(input.siteId ? { siteId: input.siteId } : {}),
        });
      } catch {
        // Visits are best-effort for the browser chrome.
      }
    },
    [],
  );

  const navigateToAddress = useCallback(
    async (rawAddress: string, via: VisitVia) => {
      if (loading) {
        return;
      }

      let address: string;
      try {
        address = normalizeAddress(rawAddress);
      } catch (error) {
        setStatusMessage(
          error instanceof InvalidAddressError
            ? error.message
            : 'Invalid address',
        );
        return;
      }

      if (!stateRef.current.personId) {
        setStatusMessage('Select a person before browsing.');
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setStatusMessage(null);
      setPanel('none');
      setAddressInput(address);

      try {
        const site = await api.resolveSite(address, controller.signal);
        if (requestId !== requestIdRef.current) {
          return;
        }

        dispatch({
          type: 'push_page',
          address: site.address,
          title: site.title,
          sanitizedHtml: site.sanitizedHtml,
        });
        setAddressInput(site.address);
        await recordVisit({
          address: site.address,
          outcome: 'shown',
          via,
        });
      } catch (error) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }

        if (error instanceof ApiError && error.status === 404) {
          dispatch({ type: 'push_not_found', address });
          setAddressInput(address);
          await recordVisit({
            address,
            outcome: 'not_found',
            via,
          });
          return;
        }

        setStatusMessage(
          error instanceof Error ? error.message : 'Navigation failed',
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [loading, recordVisit],
  );

  const goBack = useCallback(async () => {
    if (!canGoBack(stateRef.current) || loading) {
      return;
    }

    const nextState = browserReducer(stateRef.current, { type: 'back' });
    dispatch({ type: 'back' });
    stateRef.current = nextState;

    const entry = getCurrentEntry(nextState);
    if (!entry) {
      return;
    }

    if (entry.kind === 'page') {
      setAddressInput(entry.address);
      await recordVisit({
        address: entry.address,
        outcome: 'shown',
        via: 'back',
      });
    } else if (entry.kind === 'not_found') {
      setAddressInput(entry.address);
      await recordVisit({
        address: entry.address,
        outcome: 'not_found',
        via: 'back',
      });
    } else {
      setAddressInput('');
    }
  }, [loading, recordVisit]);

  const goForward = useCallback(async () => {
    if (!canGoForward(stateRef.current) || loading) {
      return;
    }

    const nextState = browserReducer(stateRef.current, { type: 'forward' });
    dispatch({ type: 'forward' });
    stateRef.current = nextState;

    const entry = getCurrentEntry(nextState);
    if (!entry) {
      return;
    }

    if (entry.kind === 'page') {
      setAddressInput(entry.address);
      await recordVisit({
        address: entry.address,
        outcome: 'shown',
        via: 'forward',
      });
    } else if (entry.kind === 'not_found') {
      setAddressInput(entry.address);
      await recordVisit({
        address: entry.address,
        outcome: 'not_found',
        via: 'forward',
      });
    } else {
      setAddressInput('');
    }
  }, [loading, recordVisit]);

  const submitAddress = useCallback(
    async (event?: FormEvent) => {
      event?.preventDefault();
      await navigateToAddress(addressInput, 'typed');
    },
    [addressInput, navigateToAddress],
  );

  const runSearch = useCallback(
    async (query: string) => {
      if (loading) {
        return;
      }
      const trimmed = query.trim();
      if (!trimmed) {
        setStatusMessage('Enter a search query.');
        return;
      }
      if (!stateRef.current.personId) {
        setStatusMessage('Select a person before searching.');
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setStatusMessage(null);
      setPanel('none');

      try {
        const results = await api.search(trimmed, 20, controller.signal);
        if (requestId !== requestIdRef.current) {
          return;
        }
        dispatch({
          type: 'push_search',
          query: trimmed,
          results: results.map((result) => ({
            address: result.address,
            title: result.title,
            snippet: result.snippet,
            author: result.author,
          })),
        });
        setAddressInput('');
        setSearchQuery(trimmed);
      } catch (error) {
        if (controller.signal.aborted || requestId !== requestIdRef.current) {
          return;
        }
        setStatusMessage(
          error instanceof Error ? error.message : 'Search failed',
        );
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [loading],
  );

  const switchPerson = useCallback(
    (personId: string) => {
      if (!personId || personId === stateRef.current.personId || loading) {
        return;
      }

      saveBrowserSession(stateRef.current);
      const restored = loadBrowserSession(personId);
      dispatch({
        type: 'switch_person',
        personId,
        entries: restored.entries,
        index: restored.index,
      });
      setAddressInput(addressFromState(restored));
      setPanel('none');
      setStatusMessage(null);
    },
    [loading],
  );

  const updateScroll = useCallback((scrollY: number) => {
    dispatch({ type: 'update_scroll', scrollY });
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        void goBack();
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        void goForward();
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'l'
      ) {
        event.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goBack, goForward]);

  const onAddressKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        void submitAddress();
      }
    },
    [submitAddress],
  );

  return {
    people,
    peopleError,
    ready,
    state,
    currentEntry,
    addressInput,
    setAddressInput,
    searchQuery,
    setSearchQuery,
    loading,
    statusMessage,
    setStatusMessage,
    panel,
    setPanel,
    addressInputRef,
    viewportRef,
    backEnabled,
    forwardEnabled,
    submitAddress,
    onAddressKeyDown,
    goBack,
    goForward,
    navigateToAddress,
    runSearch,
    switchPerson,
    updateScroll,
    recordVisit,
  };
}
