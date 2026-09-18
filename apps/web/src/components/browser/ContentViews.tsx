'use client';

import type { SearchResultSnapshot } from '@/browser';

type SearchResultsViewProps = {
  query: string;
  results: SearchResultSnapshot[];
  onOpenResult: (address: string) => void;
  disabled?: boolean;
};

export function SearchResultsView({
  query,
  results,
  onOpenResult,
  disabled,
}: SearchResultsViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Search
      </p>
      <h1 className="mt-2 font-display text-3xl text-[var(--foreground)]">
        Results for “{query}”
      </h1>
      {results.length === 0 ? (
        <p className="mt-6 text-[var(--muted-strong)]">No sites matched.</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {results.map((result) => (
            <li key={result.address}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onOpenResult(result.address)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
              >
                <div className="font-medium text-[var(--foreground)]">
                  {result.title}
                </div>
                <div className="mt-0.5 font-mono text-sm text-[var(--accent)]">
                  {result.address}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--muted-strong)]">
                  {result.snippet}
                </p>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  by {result.author.name}
                </p>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
