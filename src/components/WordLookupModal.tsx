import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Button } from './Button';
import { AppDialog } from './dialog/AppDialog';
import { inputClassName } from './form/inputStyles';
import {
  createWordLookup,
  extractDictionarySenses,
  extractDefinitionFromDefinitions,
  extractPhoneticText,
  extractPartsOfSpeechFromDefinitions,
  extractSynonymsFromDefinitions,
  type DictionarySense,
  type WordLookupReadResponseDTO,
} from '../api/api';

interface WordLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLookupSaved?: (lookup: WordLookupReadResponseDTO) => void;
  sessionId?: number | null;
}

interface LookupResult {
  lemma: string;
  definition: string;
  senses: DictionarySense[];
  synonyms: string[];
  partsOfSpeech: string[];
  phoneticText: string;
  isNewLookup: boolean;
  lookupCount: number;
}

const searchInputClassName = `${inputClassName} placeholder:text-text-subtle`;
const RESET_FLIP_DELAY_MS = 220;

const getLookupResult = (
  lookup: WordLookupReadResponseDTO,
  fallbackLemma: string,
  isNewLookup: boolean,
): LookupResult => {
  const definition = extractDefinitionFromDefinitions(lookup.definitions);

  return {
    lemma: lookup.lemma || fallbackLemma,
    definition: definition || 'No definition available right now.',
    senses: extractDictionarySenses(lookup.definitions),
    synonyms: extractSynonymsFromDefinitions(lookup.definitions),
    partsOfSpeech: extractPartsOfSpeechFromDefinitions(lookup.definitions),
    phoneticText: extractPhoneticText(lookup.phonetics),
    isNewLookup,
    lookupCount: lookup.lookupCount,
  };
};

const getLookupCardHeight = (result: LookupResult | null) => {
  if (!result) {
    return 250;
  }

  const synonymText = result.synonyms.join(', ');
  const partOfSpeechText = result.partsOfSpeech.join(', ');
  const senseText = result.senses.map((sense) => `${sense.definition} ${sense.examples.join(' ')}`).join(' ');
  const contentLength = senseText.length + synonymText.length + partOfSpeechText.length + result.phoneticText.length;
  const estimatedTextLines = Math.ceil(contentLength / 46);
  const estimatedHeight = 360 + (estimatedTextLines * 18);

  return Math.min(720, Math.max(500, estimatedHeight));
};

export function WordLookupModal({
  isOpen,
  onClose,
  onLookupSaved,
  sessionId,
}: WordLookupModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <WordLookupModalContent
      onClose={onClose}
      onLookupSaved={onLookupSaved}
      sessionId={sessionId}
    />
  );
}

function WordLookupModalContent({
  onClose,
  onLookupSaved,
  sessionId,
}: Omit<WordLookupModalProps, 'isOpen'>) {
  const [word, setWord] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const searchInFlightRef = useRef(false);
  const resetTimeoutRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion() === true;

  useEffect(() => {
    return () => {
      if (resetTimeoutRef.current != null) {
        window.clearTimeout(resetTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = async () => {
    if (searchInFlightRef.current) {
      return;
    }

    const trimmedWord = word.trim();

    if (!trimmedWord) {
      return;
    }

    if (!sessionId) {
      setLookupError('Start this reading session before looking up a word.');
      return;
    }

    try {
      searchInFlightRef.current = true;
      setIsSearching(true);
      setLookupError(null);

      if (resetTimeoutRef.current != null) {
        window.clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }

      const lookupResponse = await createWordLookup(sessionId, {
        lemma: trimmedWord,
      });
      const { wordLookup } = lookupResponse;

      onLookupSaved?.(wordLookup);
      setResult(getLookupResult(wordLookup, trimmedWord, lookupResponse.isNewLookup));
      setWord(wordLookup.lemma || trimmedWord);
      setIsFlipped(true);
    } catch (error) {
      console.error('Error looking up word:', error);
      setLookupError('Could not look up this word right now. Please try again.');
    } finally {
      searchInFlightRef.current = false;
      setIsSearching(false);
    }
  };

  const handleSearchAnother = () => {
    setIsFlipped(false);
    setWord('');
    setLookupError(null);

    if (resetTimeoutRef.current != null) {
      window.clearTimeout(resetTimeoutRef.current);
    }

    resetTimeoutRef.current = window.setTimeout(() => {
      setResult(null);
      resetTimeoutRef.current = null;
    }, prefersReducedMotion ? 0 : RESET_FLIP_DELAY_MS);
  };

  const canSearch = !!word.trim() && !isSearching;
  const senses = result?.senses.length
    ? result.senses
    : result
      ? [{ definition: result.definition, examples: [] }]
      : [];

  return (
    <AppDialog
      isOpen
      onClose={onClose}
      contentClassName="mt-4 w-[calc(100vw-2rem)] max-w-lg self-start bg-transparent p-0 shadow-none outline-none animate-in slide-in-from-top duration-300 sm:mt-0 sm:self-auto sm:slide-in-from-bottom-0"
    >
      <div
        className="relative transition-[height] duration-300"
        style={{
          height: `min(${getLookupCardHeight(result)}px, calc(94vh - 2rem))`,
          perspective: prefersReducedMotion ? 'none' : '1200px',
        }}
      >
        <div
          className="relative h-full w-full transition-transform duration-700"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transitionDuration: prefersReducedMotion ? '120ms' : '700ms',
          }}
        >
          <div
            className="absolute inset-0 overflow-hidden rounded-[28px] border border-border bg-surface p-5 shadow-[0_26px_60px_rgba(15,23,42,0.22)]"
            style={{ backfaceVisibility: 'hidden' }}
            aria-hidden={isFlipped}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft text-brand-strong">
                <Search size={19} aria-hidden="true" />
              </span>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-text-subtle">Word lookup</p>
                <h2 className="mt-1 text-2xl font-semibold text-text">Look up a word</h2>
              </div>
            </div>

            <label htmlFor="lookup-word" className="sr-only">
              Enter a word to look up
            </label>
            <input
              id="lookup-word"
              name="word"
              type="text"
              value={word}
              onChange={(event) => setWord(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && canSearch) {
                  event.preventDefault();
                  void handleSearch();
                }
              }}
              className={`${searchInputClassName} mt-5`}
              placeholder="Enter word"
              autoComplete="off"
              spellCheck={false}
              disabled={isFlipped}
            />

            {lookupError ? (
              <p className="mt-2 text-sm text-danger">{lookupError}</p>
            ) : null}

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1" disabled={isFlipped}>
                Exit
              </Button>
              <Button onClick={() => void handleSearch()} className="flex-1" disabled={!canSearch || isFlipped}>
                {isSearching ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          <div
            className="absolute inset-0 overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_26px_60px_rgba(15,23,42,0.22)]"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            aria-hidden={!isFlipped}
          >
            {result ? (
              <div className="flex h-full flex-col overflow-y-auto p-5">
                <div className="border-b border-border pb-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-text-subtle">
                    {result.isNewLookup ? 'Saved to history' : `${result.lookupCount} lookups`}
                  </p>
                  <h3 className="mt-2 text-3xl font-semibold tracking-normal text-text">{result.lemma}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-muted">
                    {result.phoneticText ? (
                      <span className="font-medium italic text-text">/{result.phoneticText}/</span>
                    ) : null}
                    {result.partsOfSpeech[0] ? (
                      <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text">
                        {result.partsOfSpeech[0]}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Definitions</p>
                  <div className="mt-3 space-y-4">
                    {senses.slice(0, 3).map((sense, index) => (
                      <div key={`${sense.definition}-${index}`} className="flex gap-3">
                        <span className="pt-0.5 text-sm font-semibold text-accent-strong">{index + 1}.</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm leading-relaxed text-text">{sense.definition}</p>
                          {sense.examples.length > 0 ? (
                            <ul className="mt-2 space-y-1 text-sm italic text-text-muted">
                              {sense.examples.slice(0, 3).map((example) => (
                                <li key={example} className="leading-relaxed">
                                  {example}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Synonyms</p>
                  <p className="mt-2 text-sm leading-relaxed text-text">
                    {result.synonyms.length > 0 ? result.synonyms.slice(0, 6).join(', ') : 'No synonyms available.'}
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={handleSearchAnother} disabled={!isFlipped}>
                    Search another
                  </Button>
                  <Button className="flex-1" onClick={onClose} disabled={!isFlipped}>
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-5 text-sm text-text-muted">
                No result available.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppDialog>
  );
}
