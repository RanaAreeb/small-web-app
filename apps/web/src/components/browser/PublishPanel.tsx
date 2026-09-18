'use client';

import { useState, type FormEvent } from 'react';
import { api } from '@/lib/api';
import { ToolbarButton } from './ToolbarButton';

type PublishPanelProps = {
  authorId: string;
  onPublished: (address: string) => void;
  onClose: () => void;
  disabled?: boolean;
};

export function PublishPanel({
  authorId,
  onPublished,
  onClose,
  disabled,
}: PublishPanelProps) {
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState(
    '<h1>Hello</h1>\n<p>Write something for the small web.</p>\n<p><a href="tidepool.zz">Visit tidepool.zz</a></p>',
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || disabled) {
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const site = await api.publishSite({
        address,
        title,
        html,
        authorId,
      });
      onPublished(site.address);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  }

  const busy = submitting || disabled;

  return (
    <section
      aria-label="Publish a site"
      className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-3 sm:px-4"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted)]">
          Publish
        </h2>
        <ToolbarButton label="Close publish" onClick={onClose} disabled={busy}>
          Close
        </ToolbarButton>
      </div>

      <form className="grid gap-3 md:grid-cols-2" onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label htmlFor="publish-address" className="mb-1 block text-xs text-[var(--muted)]">
            Address
          </label>
          <input
            id="publish-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            disabled={busy}
            required
            placeholder="my-page.zz"
            className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <div>
          <label htmlFor="publish-title" className="mb-1 block text-xs text-[var(--muted)]">
            Title
          </label>
          <input
            id="publish-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={busy}
            required
            maxLength={120}
            className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="publish-html" className="mb-1 block text-xs text-[var(--muted)]">
            HTML
          </label>
          <textarea
            id="publish-html"
            value={html}
            onChange={(event) => setHtml(event.target.value)}
            disabled={busy}
            required
            rows={8}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          />
        </div>
        {error ? (
          <p className="md:col-span-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        <div className="md:col-span-2">
          <ToolbarButton label="Publish site" type="submit" disabled={busy}>
            {submitting ? 'Publishing…' : 'Publish'}
          </ToolbarButton>
        </div>
      </form>
    </section>
  );
}
