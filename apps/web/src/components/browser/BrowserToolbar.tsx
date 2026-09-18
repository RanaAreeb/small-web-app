'use client';

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  LoaderCircle,
  PenLine,
  Search,
} from 'lucide-react';
import type {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  RefObject,
} from 'react';
import type { Person } from '@/types';
import { ToolbarButton } from './ToolbarButton';

type BrowserToolbarProps = {
  addressInput: string;
  onAddressChange: (value: string) => void;
  onAddressSubmit: (event: FormEvent) => void;
  onAddressKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  addressInputRef: RefObject<HTMLInputElement | null>;
  loading: boolean;
  backEnabled: boolean;
  forwardEnabled: boolean;
  onBack: () => void;
  onForward: () => void;
  onOpenSearch: () => void;
  onOpenHistory: () => void;
  onOpenPublish: () => void;
  people: Person[];
  personId: string | null;
  onPersonChange: (personId: string) => void;
  searchActive: boolean;
  historyActive: boolean;
  publishActive: boolean;
};

export function BrowserToolbar({
  addressInput,
  onAddressChange,
  onAddressSubmit,
  onAddressKeyDown,
  addressInputRef,
  loading,
  backEnabled,
  forwardEnabled,
  onBack,
  onForward,
  onOpenSearch,
  onOpenHistory,
  onOpenPublish,
  people,
  personId,
  onPersonChange,
  searchActive,
  historyActive,
  publishActive,
}: BrowserToolbarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 sm:px-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex items-center gap-1.5">
          <ToolbarButton
            label="Back (Alt+Left)"
            disabled={!backEnabled}
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </ToolbarButton>
          <ToolbarButton
            label="Forward (Alt+Right)"
            disabled={!forwardEnabled}
            onClick={onForward}
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Forward</span>
          </ToolbarButton>
        </div>

        <form
          className="flex min-w-0 flex-1 items-center gap-1.5"
          onSubmit={onAddressSubmit}
          role="search"
          aria-label="Address"
        >
          <label htmlFor="browser-address" className="sr-only">
            Address
          </label>
          <input
            id="browser-address"
            ref={addressInputRef}
            value={addressInput}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onAddressChange(event.target.value)
            }
            onKeyDown={onAddressKeyDown}
            placeholder="name.zz"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            disabled={loading}
            className="h-9 min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 font-mono text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-60"
          />
          <ToolbarButton
            label="Go"
            type="submit"
            disabled={loading || addressInput.trim().length === 0}
          >
            Go
          </ToolbarButton>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          <ToolbarButton
            label="Search"
            active={searchActive}
            disabled={loading || !personId}
            onClick={onOpenSearch}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Search</span>
          </ToolbarButton>
          <ToolbarButton
            label="History"
            active={historyActive}
            disabled={loading || !personId}
            onClick={onOpenHistory}
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">History</span>
          </ToolbarButton>
          <ToolbarButton
            label="Publish"
            active={publishActive}
            disabled={loading || !personId}
            onClick={onOpenPublish}
          >
            <PenLine className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Publish</span>
          </ToolbarButton>

          <label htmlFor="person-selector" className="sr-only">
            Browsing as
          </label>
          <select
            id="person-selector"
            value={personId ?? ''}
            disabled={loading || people.length === 0}
            onChange={(event) => onPersonChange(event.target.value)}
            className="h-9 max-w-[11rem] rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-sm text-[var(--foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:opacity-40"
          >
            {people.length === 0 ? (
              <option value="">No people</option>
            ) : (
              people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))
            )}
          </select>

          <div
            className="inline-flex h-9 w-9 items-center justify-center"
            aria-live="polite"
            aria-atomic="true"
          >
            {loading ? (
              <>
                <LoaderCircle
                  className="h-4 w-4 animate-spin text-[var(--accent)]"
                  aria-hidden="true"
                />
                <span className="sr-only">Loading</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
