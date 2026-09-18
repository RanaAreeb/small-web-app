'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { api } from '@/lib/api';
import type { Visit } from '@/types';
import { ToolbarButton } from './ToolbarButton';

type HistoryDrawerProps = {
  personId: string;
  personName?: string;
  open: boolean;
  onOpenAddress: (address: string) => void;
  onClose: () => void;
  disabled?: boolean;
};

function formatVia(via: Visit['via']): string {
  return via.replace(/_/g, ' ');
}

function formatOutcome(outcome: Visit['outcome']): string {
  return outcome === 'not_found' ? 'not found' : outcome;
}

export function HistoryDrawer({
  personId,
  personName,
  open,
  onOpenAddress,
  onClose,
  disabled,
}: HistoryDrawerProps) {
  const [items, setItems] = useState<Visit[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const nextCursorRef = useRef<string | undefined>(undefined);

  nextCursorRef.current = nextCursor;
  loadingMoreRef.current = loadingMore;

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      setItems([]);
      setNextCursor(undefined);
      try {
        const page = await api.getHistory(personId, {
          limit: 30,
          signal: controller.signal,
        });
        if (cancelled) {
          return;
        }
        setItems(page.items);
        setNextCursor(page.nextCursor);
      } catch (err) {
        if (cancelled || controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [personId, open]);

  async function loadMore() {
    const cursor = nextCursorRef.current;
    if (!cursor || loadingMoreRef.current || loading) {
      return;
    }
    setLoadingMore(true);
    try {
      const page = await api.getHistory(personId, {
        cursor,
        limit: 30,
      });
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load older visits');
    } finally {
      setLoadingMore(false);
    }
  }

  async function deleteVisit(visitId: string) {
    if (disabled || deletingId) {
      return;
    }
    setDeletingId(visitId);
    setError(null);
    try {
      await api.deleteVisit(visitId);
      setItems((current) => current.filter((visit) => visit.id !== visitId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete visit');
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!open || !nextCursor || loading) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                void loadMore();
              }
            },
            { root: null, rootMargin: '100px', threshold: 0 },
          );

    if (!observer) {
      return;
    }

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nextCursor, loading, items.length]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close history drawer"
        className="absolute inset-0 bg-black/25"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Browsing history"
        className="relative flex h-full w-full max-w-md flex-col border-l border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
          <div>
            <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
              History
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-strong)]">
              {personName ? `${personName}’s visits` : 'Selected person'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close history"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error ? (
            <p className="mb-3 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className="text-sm text-[var(--muted-strong)]" role="status">
              Loading history…
            </p>
          ) : null}

          {!loading && items.length === 0 ? (
            <p className="text-sm text-[var(--muted-strong)]">No visits yet.</p>
          ) : null}

          <ul className="space-y-2" data-testid="history-list">
            {items.map((visit) => {
              const heading = visit.site?.title || visit.address;
              return (
                <li key={visit.id}>
                  <div className="flex items-stretch gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] p-2">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onOpenAddress(visit.address)}
                      className="flex min-w-0 flex-1 flex-col px-1.5 py-1.5 text-left hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
                    >
                      <span className="font-medium text-[var(--foreground)]">
                        {heading}
                      </span>
                      <span className="mt-0.5 font-mono text-sm text-[var(--accent)]">
                        {visit.address}
                      </span>
                      <span className="mt-1 text-xs text-[var(--muted)]">
                        via {formatVia(visit.via)} · {formatOutcome(visit.outcome)} ·{' '}
                        {new Date(visit.visitedAt).toLocaleString()}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete visit to ${visit.address}`}
                      disabled={disabled || deletingId === visit.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        void deleteVisit(visit.id);
                      }}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-md border border-[var(--border)] text-[#8a3b2e] hover:bg-[#f3e6e2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>

          {nextCursor ? (
            <div className="mt-4 space-y-2">
              <ToolbarButton
                label="Load older visits"
                onClick={() => void loadMore()}
                disabled={loadingMore || disabled}
              >
                {loadingMore ? 'Loading…' : 'Load older'}
              </ToolbarButton>
              <div ref={sentinelRef} className="h-2" aria-hidden="true" />
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
