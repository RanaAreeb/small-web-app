'use client';

type NotFoundViewProps = {
  address: string;
};

export function NotFoundView({ address }: NotFoundViewProps) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-8">
      <p className="text-sm font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        Not found
      </p>
      <h1 className="mt-3 font-display text-3xl text-[var(--foreground)]">
        No page at this address
      </h1>
      <p className="mt-4 font-mono text-base text-[var(--accent)]">{address}</p>
      <p className="mt-4 text-base leading-relaxed text-[var(--muted-strong)]">
        The address was recorded in this person’s history. Use Back to return,
        or try another <span className="font-mono">.zz</span> name.
      </p>
    </div>
  );
}
