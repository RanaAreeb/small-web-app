'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Visit } from '@/types';
import { ToolbarButton } from './ToolbarButton';

type HistoryPanelProps = {
  personId: string;
  onOpenAddress: (address: string) => void;
  onClose: () => void;
  disabled?: boolean;
};

export function HistoryPanel({
  personId,
  onOpenAddress,
  onClose,
  disabled,
}: HistoryPanelProps) {
  const [items, setItems] = useState<Visit[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
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
  }, [personId]);

  async function loadMore() {
    if (!nextCursor || loading) {
      return;
    }
    setLoading(true);
    try {
      const page = await api.getHistory(personId, {
        cursor: nextCursor,
        limit: 30,
      });
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-label="Browsing history"
      className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          History
        </h2>
        <ToolbarButton label="Close history" onClick={onClose}>
          Close
        </ToolbarButton>
      </div>

      {error ? (
        <p className="text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}

      {loading && items.length === 0 ? (
        <p className="text-sm text-[var(--muted-strong)]">Loading history…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <p className="text-sm text-[var(--muted-strong)]">No visits yet.</p>
      ) : null}

      <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
        {items.map((visit) => (
          <li key={visit.id}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onOpenAddress(visit.address)}
              className="flex w-full flex-col rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-left hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
            >
              <span className="font-mono text-sm text-[var(--accent)]">
                {visit.address}
              </span>
              <span className="mt-0.5 text-xs text-[var(--muted)]">
                {visit.outcome}
                {visit.site?.title ? ` · ${visit.site.title}` : ''}
                {' · '}
                {new Date(visit.visitedAt).toLocaleString()}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {nextCursor ? (
        <div className="mt-3">
          <ToolbarButton
            label="Load more history"
            onClick={() => void loadMore()}
            disabled={loading}
          >
            Load more
          </ToolbarButton>
        </div>
      ) : null}
    </section>
  );
}
