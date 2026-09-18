'use client';

import { SUGGESTED_ADDRESSES } from '@/lib/suggested-addresses';

type WelcomeViewProps = {
  onOpenAddress: (address: string) => void;
  disabled?: boolean;
};

export function WelcomeView({ onOpenAddress, disabled }: WelcomeViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8 sm:py-14">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Small web browser
      </p>
      <h1 className="mt-3 font-display text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">
        Start from a seeded street
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-[var(--muted-strong)]">
        Type a <span className="font-mono text-[var(--foreground)]">.zz</span>{' '}
        address above, or open one of these places. Links stay inside this
        browser; missing doors are kept in history.
      </p>

      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {SUGGESTED_ADDRESSES.map((item) => (
          <li key={item.address}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onOpenAddress(item.address)}
              className="flex w-full flex-col items-start rounded-md border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-left transition-colors hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
            >
              <span className="font-mono text-sm text-[var(--accent)]">
                {item.address}
              </span>
              <span className="mt-1 text-sm text-[var(--muted-strong)]">
                {item.blurb}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
