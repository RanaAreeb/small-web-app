'use client';

import type { FormEvent } from 'react';
import { ToolbarButton } from './ToolbarButton';

type SearchPanelProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: (query: string) => void;
  onClose: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function SearchPanel({
  query,
  onQueryChange,
  onSubmit,
  onClose,
  disabled,
  loading,
}: SearchPanelProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(query);
  }

  return (
    <section
      aria-label="Search sites"
      className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-4"
    >
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={handleSubmit}
      >
        <div className="min-w-0 flex-1">
          <label
            htmlFor="site-search"
            className="mb-1 block text-xs font-medium uppercase tracking-[0.12em] text-[var(--muted)]"
          >
            Search title and page body
          </label>
          <input
            id="site-search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            disabled={disabled || loading}
            placeholder="moss, lantern, tide…"
            className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-50"
          />
        </div>
        <div className="flex gap-1.5">
          <ToolbarButton
            label="Run search"
            type="submit"
            disabled={disabled || loading || query.trim().length === 0}
          >
            {loading ? 'Searching…' : 'Search'}
          </ToolbarButton>
          <ToolbarButton label="Close search" onClick={onClose} disabled={loading}>
            Close
          </ToolbarButton>
        </div>
      </form>
    </section>
  );
}
