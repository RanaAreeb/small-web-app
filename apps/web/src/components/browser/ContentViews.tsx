'use client';

import type { SearchResultSnapshot } from '@/browser';

type SearchResultsViewProps = {
  query: string;
  results: SearchResultSnapshot[];
  onOpenResult: (address: string) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function SearchResultsView({
  query,
  results,
  onOpenResult,
  disabled,
  loading = false,
  error = null,
  onRetry,
}: SearchResultsViewProps) {
  const count = results.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Search
      </p>
      <h1 className="mt-2 font-display text-3xl text-[var(--foreground)]">
        {query ? `Results for “${query}”` : 'Search the small web'}
      </h1>

      {loading ? (
        <p className="mt-6 text-[var(--muted-strong)]" role="status" aria-live="polite">
          Searching titles and page text…
        </p>
      ) : null}

      {!loading && error ? (
        <div className="mt-6 rounded-md border border-[#d8b4a8] bg-[#f3e6e2] px-4 py-3" role="alert">
          <p className="text-sm text-[#6b2f22]">{error}</p>
          {onRetry ? (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-[var(--accent)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              onClick={onRetry}
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {!loading && !error ? (
        <p className="mt-2 text-sm text-[var(--muted)]" data-testid="search-result-count">
          {count === 1 ? '1 result' : `${count} results`}
        </p>
      ) : null}

      {!loading && !error && count === 0 ? (
        <p className="mt-6 text-[var(--muted-strong)]" data-testid="search-empty">
          No sites matched “{query}”. Try another word from a title or page body.
        </p>
      ) : null}

      {!loading && !error && count > 0 ? (
        <ol className="mt-6 space-y-3" data-testid="search-results">
          {results.map((result) => (
            <li key={result.address}>
              <button
                type="button"
                disabled={disabled}
                data-testid={`search-result-${result.address}`}
                onClick={() => onOpenResult(result.address)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
              >
                <div className="font-medium text-[var(--foreground)]">{result.title}</div>
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
      ) : null}
    </div>
  );
}
