import { useEffect, useMemo, useState } from 'react';
import { BookOpen, History, Search, X } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../components/dialog/AppDialog';
import { inputClassName } from '../components/form/inputStyles';
import { formatShortDate, formatShortDateTime } from '../utils/formatting';
import {
  extractDefinitionFromDefinitions,
  extractDictionarySenses,
  extractPartsOfSpeechFromDefinitions,
  extractPhoneticText,
  getWordLookups,
  type DictionarySense,
  type WordLookupReadResponseDTO,
} from '../api/api';

const searchInputClassName = `${inputClassName} pl-11 placeholder:text-text-subtle`;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return value !== null && typeof value === 'object';
};

const collectPhoneticValues = (value: unknown, collected: string[]) => {
  if (Array.isArray(value)) {
    value.forEach((entry) => collectPhoneticValues(entry, collected));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  Object.entries(value).forEach(([key, nestedValue]) => {
    const normalizedKey = key.toLowerCase();

    if (
      (normalizedKey === 'text' || normalizedKey === 'phonetic')
      && typeof nestedValue === 'string'
      && nestedValue.trim()
    ) {
      collected.push(nestedValue.trim());
    }

    collectPhoneticValues(nestedValue, collected);
  });
};

const getPhoneticValues = (phonetics: unknown) => {
  const values: string[] = [];
  collectPhoneticValues(phonetics, values);
  return Array.from(new Set(values));
};

const getDefinitionPreview = (lookup: WordLookupReadResponseDTO) => {
  return extractDefinitionFromDefinitions(lookup.definitions) || 'No definition available right now.';
};

const getSenses = (lookup: WordLookupReadResponseDTO): DictionarySense[] => {
  const senses = extractDictionarySenses(lookup.definitions);

  if (senses.length > 0) {
    return senses;
  }

  const fallbackDefinition = extractDefinitionFromDefinitions(lookup.definitions);
  return fallbackDefinition ? [{ definition: fallbackDefinition, examples: [] }] : [];
};

function LookupDetailsDialog({
  lookup,
  onClose,
}: {
  lookup: WordLookupReadResponseDTO | null;
  onClose: () => void;
}) {
  const senses = lookup ? getSenses(lookup) : [];
  const partsOfSpeech = lookup ? extractPartsOfSpeechFromDefinitions(lookup.definitions) : [];
  const phonetics = lookup ? getPhoneticValues(lookup.phonetics) : [];

  if (!lookup) {
    return null;
  }

  return (
    <AppDialog
      isOpen={lookup != null}
      onClose={onClose}
      contentClassName="w-full max-w-2xl overflow-hidden rounded-t-[32px] border border-border bg-surface shadow-[0_26px_60px_rgba(15,23,42,0.22)] sm:rounded-[32px]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-text-subtle">
            Looked-up word
          </p>
          <AppDialogTitle className="mt-2 truncate text-3xl font-semibold tracking-normal text-text">
            {lookup.lemma}
          </AppDialogTitle>
        </div>
        <AppDialogClose asChild>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Close word details"
          >
            <X size={18} />
          </button>
        </AppDialogClose>
      </div>

      <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          {extractPhoneticText(lookup.phonetics) ? (
            <span className="rounded-full bg-surface-muted px-3 py-1 font-medium italic text-text">
              /{extractPhoneticText(lookup.phonetics)}/
            </span>
          ) : null}
          {partsOfSpeech.map((partOfSpeech) => (
            <span
              key={partOfSpeech}
              className="rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted"
            >
              {partOfSpeech}
            </span>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[20px] border border-border bg-surface-alt p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-subtle">Lookups</p>
            <p className="mt-2 text-lg font-semibold text-text">{lookup.lookupCount}</p>
          </div>
          <div className="rounded-[20px] border border-border bg-surface-alt p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-subtle">First</p>
            <p className="mt-2 text-sm font-semibold text-text">{formatShortDate(lookup.firstLookedUpAt)}</p>
          </div>
          <div className="rounded-[20px] border border-border bg-surface-alt p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-subtle">Last</p>
            <p className="mt-2 text-sm font-semibold text-text">{formatShortDateTime(lookup.lastLookedUpAt)}</p>
          </div>
        </div>

        <section className="mt-5 rounded-[24px] border border-border bg-surface-alt p-4 sm:p-5">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-text-subtle">Definitions</p>
          {senses.length > 0 ? (
            <div className="mt-4 space-y-4">
              {senses.map((sense, index) => (
                <div key={`${sense.definition}-${index}`} className="flex gap-3">
                  <span className="pt-0.5 text-sm font-semibold text-accent-strong">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm leading-relaxed text-text">{sense.definition}</p>
                    {sense.examples.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm italic text-text-muted">
                        {sense.examples.map((example) => (
                          <li key={example} className="break-words leading-relaxed">
                            {example}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-text-muted">No definitions available right now.</p>
          )}
        </section>

        <section className="mt-4 rounded-[24px] border border-border bg-surface-alt p-4 sm:p-5">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-text-subtle">Phonetics</p>
          {phonetics.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {phonetics.map((phonetic) => (
                <span key={phonetic} className="rounded-full bg-surface px-3 py-1 text-sm font-medium italic text-text">
                  /{phonetic}/
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-text-muted">No phonetics available.</p>
          )}
        </section>

        <div className="mt-5">
          <Button variant="outline" className="w-full rounded-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </AppDialog>
  );
}

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

      <LookupDetailsDialog lookup={selectedLookup} onClose={() => setSelectedLookup(null)} />
      <BottomNav />
    </div>
  );
}
