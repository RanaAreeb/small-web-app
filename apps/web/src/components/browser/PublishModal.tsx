'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { ApiError } from '@/types';
import { api } from '@/lib/api';
import { ToolbarButton } from './ToolbarButton';

const MAX_HTML_BYTES = 100 * 1024;
const EXAMPLE_HTML = `<h1>Hello from my page</h1>
<p>A short note for the small web.</p>
<p>Start next door at <a href="tidepool.zz">tidepool.zz</a>.</p>`;

type PublishModalProps = {
  open: boolean;
  authorId: string;
  authorName: string;
  onPublished: (address: string) => void;
  onClose: () => void;
  disabled?: boolean;
};

export function PublishModal({
  open,
  authorId,
  authorName,
  onPublished,
  onClose,
  disabled,
}: PublishModalProps) {
  const titleId = useId();
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState(EXAMPLE_HTML);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    setError(null);
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting) {
        onClose();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, submitting]);

  if (!open) {
    return null;
  }

  const htmlBytes = new Blob([html]).size;
  const busy = submitting || Boolean(disabled);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) {
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
      setAddress('');
      setTitle('');
      setHtml(EXAMPLE_HTML);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setError('That address is already published. Choose a different .zz name.');
        } else {
          setError(err.message);
        }
      } else {
        setError(err instanceof Error ? err.message : 'Publish failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close publish dialog"
        className="absolute inset-0 bg-black/30"
        onClick={() => {
          if (!busy) {
            onClose();
          }
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 shadow-lg sm:p-5"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2
              id={titleId}
              className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--muted)]"
            >
              Publish
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-strong)]">
              Create a new .zz page for the selected author.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close publish"
            disabled={busy}
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] hover:bg-[var(--surface-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <form className="grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
          <div>
            <label htmlFor="publish-author" className="mb-1 block text-xs text-[var(--muted)]">
              Author
            </label>
            <input
              id="publish-author"
              value={authorName}
              readOnly
              className="h-9 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--muted-strong)]"
            />
          </div>

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
            <p className="mt-1 text-xs text-[var(--muted)]">
              Use one valid <span className="font-mono">.zz</span> host (no scheme, path, port, or
              query). Example: <span className="font-mono">garden-notes.zz</span>
            </p>
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
            <p className="mt-1 text-xs text-[var(--muted)]">Up to 120 characters.</p>
          </div>

          <div>
            <div className="mb-1 flex items-end justify-between gap-2">
              <label htmlFor="publish-html" className="block text-xs text-[var(--muted)]">
                HTML
              </label>
              <span
                className={`text-xs ${htmlBytes > MAX_HTML_BYTES ? 'text-red-800' : 'text-[var(--muted)]'}`}
              >
                {htmlBytes.toLocaleString()} / {MAX_HTML_BYTES.toLocaleString()} bytes
              </span>
            </div>
            <textarea
              id="publish-html"
              value={html}
              onChange={(event) => setHtml(event.target.value)}
              disabled={busy}
              required
              rows={10}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Max 100 KB. Links may only target .zz addresses. The starter example includes{' '}
              <span className="font-mono">tidepool.zz</span>.
            </p>
          </div>

          {error ? (
            <p className="text-sm text-red-800" role="alert" data-testid="publish-error">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-1">
            <ToolbarButton
              label="Publish site"
              type="submit"
              disabled={busy || htmlBytes > MAX_HTML_BYTES}
            >
              {submitting ? 'Publishing…' : 'Publish'}
            </ToolbarButton>
            <ToolbarButton label="Cancel publish" onClick={onClose} disabled={busy}>
              Cancel
            </ToolbarButton>
          </div>
        </form>
      </div>
    </div>
  );
}
