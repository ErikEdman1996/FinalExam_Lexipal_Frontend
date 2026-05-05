import { useEffect, useMemo, useState } from 'react';
import { BookOpen, History, Search } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { CodexNavTabs } from '../components/CodexNavTabs';
import { inputClassName } from '../components/form/inputStyles';
import { WordLookupDetailsDialog } from '../components/WordLookupDetailsDialog';
import { formatShortDate } from '../utils/formatting';
import {
  extractDefinitionFromDefinitions,
  extractPartsOfSpeechFromDefinitions,
  extractPhoneticText,
  getWordLookups,
  type WordLookupReadResponseDTO,
} from '../api/api';

const searchInputClassName = `${inputClassName} pl-11 placeholder:text-text-subtle`;

const getDefinitionPreview = (lookup: WordLookupReadResponseDTO) => {
  return extractDefinitionFromDefinitions(lookup.definitions) || 'No definition available right now.';
};

export default function WordLookups() {
  const [lookups, setLookups] = useState<WordLookupReadResponseDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLookup, setSelectedLookup] = useState<WordLookupReadResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLookups = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const nextLookups = await getWordLookups();

        if (isMounted) {
          setLookups(nextLookups);
        }
      } catch (error) {
        console.error('Error loading word lookups:', error);

        if (isMounted) {
          setErrorMessage('Could not load your looked-up words right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLookups();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredLookups = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return lookups;
    }

    return lookups.filter((lookup) => lookup.lemma.toLowerCase().includes(normalizedQuery));
  }, [lookups, searchQuery]);

  return (
    <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">
              Word history
            </p>
            <h1 className="mt-2 text-[2.3rem] font-semibold leading-tight tracking-normal text-text sm:text-[3rem]">
              Looked-up Words
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
              Every word you search for while reading, newest first.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-brand-soft shadow-[0_10px_24px_rgba(154,74,66,0.14)]">
            <History size={25} className="text-brand-strong" aria-hidden="true" />
          </div>
        </header>

        <CodexNavTabs className="mt-6" />

        <section className="mt-6 rounded-[30px] border border-border bg-surface p-4 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-5">
          <label htmlFor="word-history-search" className="sr-only">
            Filter looked-up words by lemma
          </label>
          <div className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle"
              aria-hidden="true"
            />
            <input
              id="word-history-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className={searchInputClassName}
              placeholder="Filter by lemma"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </section>

        <main className="mt-6">
          {isLoading ? (
            <div className="rounded-[30px] border border-border bg-surface px-5 py-12 text-center text-text-muted">
              Loading looked-up words...
            </div>
          ) : errorMessage ? (
            <div className="rounded-[30px] border border-border bg-surface px-5 py-12 text-center">
              <p className="text-lg font-medium text-danger">{errorMessage}</p>
              <Button className="mt-5 rounded-full px-6" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : lookups.length === 0 ? (
            <div className="rounded-[30px] border border-border bg-surface px-5 py-12 text-center shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-surface-muted">
                <BookOpen size={26} className="text-text-muted" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-text">No looked-up words yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">
                Look up words during a reading session and they will appear here.
              </p>
            </div>
          ) : filteredLookups.length === 0 ? (
            <div className="rounded-[30px] border border-border bg-surface px-5 py-10 text-center text-text-muted">
              No looked-up words match that filter.
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredLookups.map((lookup) => {
                const definition = getDefinitionPreview(lookup);
                const phoneticText = extractPhoneticText(lookup.phonetics);
                const partsOfSpeech = extractPartsOfSpeechFromDefinitions(lookup.definitions);

                return (
                  <button
                    key={lookup.id}
                    type="button"
                    onClick={() => setSelectedLookup(lookup)}
                    className="group rounded-[24px] border border-border bg-surface p-4 text-left shadow-[0_12px_26px_rgba(31,41,55,0.05)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-[0_16px_30px_rgba(31,41,55,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-xl font-semibold tracking-normal text-text">{lookup.lemma}</h2>
                          {phoneticText ? (
                            <span className="text-sm font-medium italic text-text-muted">/{phoneticText}/</span>
                          ) : null}
                          {partsOfSpeech[0] ? (
                            <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                              {partsOfSpeech[0]}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                          {definition}
                        </p>
                      </div>
                      <div className="grid shrink-0 grid-cols-3 gap-2 text-center sm:min-w-[18rem]">
                        <div className="rounded-[16px] bg-surface-muted px-3 py-2">
                          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-text-subtle">Count</p>
                          <p className="mt-1 text-sm font-semibold text-text">{lookup.lookupCount}</p>
                        </div>
                        <div className="rounded-[16px] bg-surface-muted px-3 py-2">
                          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-text-subtle">First</p>
                          <p className="mt-1 text-sm font-semibold text-text">{formatShortDate(lookup.firstLookedUpAt)}</p>
                        </div>
                        <div className="rounded-[16px] bg-surface-muted px-3 py-2">
                          <p className="text-[0.62rem] uppercase tracking-[0.16em] text-text-subtle">Last</p>
                          <p className="mt-1 text-sm font-semibold text-text">{formatShortDate(lookup.lastLookedUpAt)}</p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <WordLookupDetailsDialog lookup={selectedLookup} onClose={() => setSelectedLookup(null)} />
      <BottomNav />
    </div>
  );
}
