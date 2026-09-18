'use client';

import { BrowserToolbar } from './BrowserToolbar';
import { PageView, SearchResultsView } from './ContentViews';
import { HistoryPanel } from './HistoryPanel';
import { NotFoundView } from './NotFoundView';
import { PublishPanel } from './PublishPanel';
import { SearchPanel } from './SearchPanel';
import { WelcomeView } from './WelcomeView';
import { useBrowserController } from '@/hooks/useBrowserController';

export function BrowserApp() {
  const browser = useBrowserController();
  const {
    people,
    peopleError,
    ready,
    state,
    currentEntry,
    addressInput,
    setAddressInput,
    searchQuery,
    setSearchQuery,
    loading,
    statusMessage,
    panel,
    setPanel,
    addressInputRef,
    viewportRef,
    backEnabled,
    forwardEnabled,
    submitAddress,
    onAddressKeyDown,
    goBack,
    goForward,
    navigateToAddress,
    runSearch,
    switchPerson,
    updateScroll,
  } = browser;

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-[var(--page)] px-0 py-0 sm:px-4 sm:py-6">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden border-y border-[var(--border)] bg-[var(--background)] shadow-[0_12px_40px_rgba(20,24,28,0.08)] sm:rounded-xl sm:border">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
                Small web
              </p>
              <h1 className="font-display text-lg text-[var(--foreground)] sm:text-xl">
                Browser
              </h1>
            </div>
            <p className="hidden text-right text-xs text-[var(--muted)] sm:block">
              Ctrl/Cmd+L address · Alt+←/→ history
            </p>
          </div>
        </header>

        <BrowserToolbar
          addressInput={addressInput}
          onAddressChange={setAddressInput}
          onAddressSubmit={(event) => void submitAddress(event)}
          onAddressKeyDown={onAddressKeyDown}
          addressInputRef={addressInputRef}
          loading={loading}
          backEnabled={backEnabled}
          forwardEnabled={forwardEnabled}
          onBack={() => void goBack()}
          onForward={() => void goForward()}
          onOpenSearch={() =>
            setPanel((current) => (current === 'search' ? 'none' : 'search'))
          }
          onOpenHistory={() =>
            setPanel((current) => (current === 'history' ? 'none' : 'history'))
          }
          onOpenPublish={() =>
            setPanel((current) => (current === 'publish' ? 'none' : 'publish'))
          }
          people={people}
          personId={state.personId}
          onPersonChange={switchPerson}
          searchActive={panel === 'search'}
          historyActive={panel === 'history'}
          publishActive={panel === 'publish'}
        />

        {panel === 'search' ? (
          <SearchPanel
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onSubmit={(query) => void runSearch(query)}
            onClose={() => setPanel('none')}
            disabled={loading}
          />
        ) : null}

        {panel === 'history' && state.personId ? (
          <HistoryPanel
            personId={state.personId}
            onOpenAddress={(address) => void navigateToAddress(address, 'history')}
            onClose={() => setPanel('none')}
            disabled={loading}
          />
        ) : null}

        {panel === 'publish' && state.personId ? (
          <PublishPanel
            authorId={state.personId}
            onPublished={(address) => {
              setPanel('none');
              void navigateToAddress(address, 'publish');
            }}
            onClose={() => setPanel('none')}
            disabled={loading}
          />
        ) : null}

        {statusMessage ? (
          <div
            role="status"
            className="border-b border-[var(--border)] bg-[#f3e6e2] px-4 py-2 text-sm text-[#6b2f22]"
          >
            {statusMessage}
          </div>
        ) : null}

        {peopleError ? (
          <div
            role="alert"
            className="border-b border-[var(--border)] bg-[#f3e6e2] px-4 py-2 text-sm text-[#6b2f22]"
          >
            {peopleError}
          </div>
        ) : null}

        <div
          ref={viewportRef}
          className="min-h-[28rem] flex-1 overflow-y-auto bg-[var(--background)]"
          onScroll={(event) => {
            updateScroll(event.currentTarget.scrollTop);
          }}
        >
          {!ready ? (
            <p className="px-4 py-10 text-sm text-[var(--muted-strong)]">
              Preparing browser…
            </p>
          ) : null}

          {ready && !currentEntry ? (
            <WelcomeView
              disabled={loading || !state.personId}
              onOpenAddress={(address) => void navigateToAddress(address, 'typed')}
            />
          ) : null}

          {currentEntry?.kind === 'page' ? (
            <PageView
              title={currentEntry.title}
              sanitizedHtml={currentEntry.sanitizedHtml}
              onNavigateLink={(address) => void navigateToAddress(address, 'link')}
            />
          ) : null}

          {currentEntry?.kind === 'not_found' ? (
            <NotFoundView address={currentEntry.address} />
          ) : null}

          {currentEntry?.kind === 'search' ? (
            <SearchResultsView
              query={currentEntry.query}
              results={currentEntry.results}
              disabled={loading}
              onOpenResult={(address) => void navigateToAddress(address, 'search')}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
