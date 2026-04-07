import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { Button } from './Button';
import {
  extractDefinitionFromDefinitions,
  extractSynonymsFromDefinitions,
  getDictionaryWord,
  searchAndCaptureWord,
} from '../api/api';

interface WordLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (word: { lemma: string; definition: string; synonyms: string[] }, newCapture: boolean) => void;
  capturedLemmas: string[];
  sessionId?: number | null;
}

interface LookupResult {
  lemma: string;
  definition: string;
  synonyms: string[];
  newCapture: boolean;
  rarityTier: 'COMMON' | 'RARE' | 'MYTHIC';
  xpValue: number;
}

const getRarityTierFromScore = (score: number | null | undefined): 'COMMON' | 'RARE' | 'MYTHIC' => {
  if ((score ?? 0) >= 0.9) {
    return 'MYTHIC';
  }

  if ((score ?? 0) >= 0.7) {
    return 'RARE';
  }

  return 'COMMON';
};

const getRarityBorderClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'border-[#B084F5] shadow-[0_0_0_1px_rgba(176,132,245,0.35),0_8px_24px_rgba(176,132,245,0.2)]';
  }

  if (tier === 'RARE') {
    return 'border-[#7FB7FF] shadow-[0_0_0_1px_rgba(127,183,255,0.35),0_8px_24px_rgba(127,183,255,0.18)]';
  }

  return 'border-[rgba(0,0,0,0.12)]';
};

const getRarityPillClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'bg-[#F1E9FF] text-[#6E3CC8]';
  }

  if (tier === 'RARE') {
    return 'bg-[#E8F3FF] text-[#2B6CB0]';
  }

  return 'bg-[#F0F2F5] text-[#4A5568]';
};

export function WordLookupModal({
  isOpen,
  onClose,
  onCapture,
  capturedLemmas,
  sessionId,
}: WordLookupModalProps) {
  const [word, setWord] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const searchInFlightRef = useRef(false);

  const capturedLemmaSet = useMemo(() => new Set(capturedLemmas.map((lemma) => lemma.toLowerCase())), [capturedLemmas]);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isFlipped || !result?.newCapture || prefersReducedMotion) {
      return;
    }

    setShowParticles(true);
    const timeoutId = window.setTimeout(() => {
      setShowParticles(false);
    }, 850);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFlipped, prefersReducedMotion, result?.newCapture]);

  useEffect(() => {
    if (!isOpen) {
      setWord('');
      setLookupError(null);
      setIsSearching(false);
      setIsFlipped(false);
      setResult(null);
      setShowParticles(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;

  const handleSearch = async () => {
    if (searchInFlightRef.current) {
      return;
    }

    const trimmedWord = word.trim();

    if (!trimmedWord) {
      return;
    }

    try {
      searchInFlightRef.current = true;
      setIsSearching(true);
      setLookupError(null);

      let nextResult: LookupResult;

      if (sessionId) {
        const capturedResponse = await searchAndCaptureWord(sessionId, {
          lemma: trimmedWord,
        });

        const capturedWord = capturedResponse.capturedWord.word;
        const mappedDefinition = extractDefinitionFromDefinitions(capturedWord.definitions);
        const mappedSynonyms = extractSynonymsFromDefinitions(capturedWord.definitions);

        nextResult = {
          lemma: capturedWord.lemma ?? trimmedWord,
          definition: mappedDefinition || 'No definition available right now.',
          synonyms: mappedSynonyms,
          newCapture: capturedResponse.newCapture,
          rarityTier: (capturedResponse.rarityTier as LookupResult['rarityTier']) ?? 'COMMON',
          xpValue: capturedResponse.capturedWord.xpValue ?? 0,
        };
      } else {
        const fetchedWord = await getDictionaryWord(trimmedWord);
        const normalizedLemma = (fetchedWord.lemma ?? trimmedWord).toLowerCase();
        const fallbackNewCapture = !capturedLemmaSet.has(normalizedLemma);

        nextResult = {
          lemma: fetchedWord.lemma ?? trimmedWord,
          definition: extractDefinitionFromDefinitions(fetchedWord.definitions) || 'No definition available right now.',
          synonyms: extractSynonymsFromDefinitions(fetchedWord.definitions),
          newCapture: fallbackNewCapture,
          rarityTier: getRarityTierFromScore(fetchedWord.rarityScore),
          xpValue: fallbackNewCapture ? 10 : 0,
        };
      }

      setWord(nextResult.lemma);
      setResult(nextResult);
      setIsFlipped(true);

      onCapture(
        {
          lemma: nextResult.lemma,
          definition: nextResult.definition,
          synonyms: nextResult.synonyms,
        },
        nextResult.newCapture,
      );
    } catch (error) {
      console.error('Error searching and capturing word:', error);
      setLookupError('Could not capture this word right now. Please try again.');
    } finally {
      searchInFlightRef.current = false;
      setIsSearching(false);
    }
  };

  const handleSearchAnother = () => {
    setWord('');
    setLookupError(null);
    setIsFlipped(false);
    setResult(null);
    setShowParticles(false);
  };

  const canSearch = !!word.trim() && !isSearching;
  const rarityBorderClass = getRarityBorderClass(result?.rarityTier ?? 'COMMON');
  const rarityPillClass = getRarityPillClass(result?.rarityTier ?? 'COMMON');
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="word-lookup-title"
      >
        <div className="sticky top-0 bg-white border-b border-[rgba(0,0,0,0.05)] px-6 py-4 rounded-t-[32px]">
          <div className="flex justify-between items-center">
            <h2 id="word-lookup-title" className="text-xl font-semibold text-[#2C3E50]">Look Up Word</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
              aria-label="Close word lookup modal"
            >
              <X size={20} className="text-[#6C757D]" />
            </button>
          </div>
        </div>

        <div className="p-6 pt-5">
          <div className="relative h-[380px]" style={{ perspective: prefersReducedMotion ? 'none' : '1200px' }}>
            <div
              className="relative h-full w-full transition-transform duration-700"
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                transitionDuration: prefersReducedMotion ? '120ms' : '700ms',
              }}
            >
              <div
                className="absolute inset-0 rounded-[24px] border border-[rgba(0,0,0,0.08)] bg-white p-5"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <label htmlFor="lookup-word" className="block text-sm text-[#2C3E50] mb-2">
                  Word
                </label>
                <input
                  id="lookup-word"
                  type="text"
                  value={word}
                  onChange={(event) => setWord(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && canSearch) {
                      event.preventDefault();
                      void handleSearch();
                    }
                  }}
                  className="w-full px-4 py-3 rounded-[16px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#D4C5F9] focus:border-transparent transition-all"
                  placeholder="Enter word to capture"
                  autoFocus
                />

                {lookupError ? (
                  <p className="text-sm text-[#FF6B6B] mt-2">{lookupError}</p>
                ) : null}

                {!sessionId ? (
                  <p className="text-xs text-[#6C757D] mt-3">
                    Running in fallback mode: this capture is tracked in-session only until session context is available.
                  </p>
                ) : null}

                <div className="mt-6 flex gap-3">
                  <Button variant="outline" onClick={onClose} className="flex-1">
                    Exit
                  </Button>
                  <Button onClick={() => void handleSearch()} className="flex-1" disabled={!canSearch}>
                    {isSearching ? 'Searching...' : 'Search'}
                  </Button>
                </div>
              </div>

              <div
                className={`absolute inset-0 rounded-[24px] border bg-white p-5 ${rarityBorderClass}`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              >
                {result ? (
                  <div className="h-full flex flex-col">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {result.newCapture ? (
                          <p className="text-sm text-[#6C757D]">You have captured</p>
                        ) : (
                          <p className="text-sm text-[#6C757D]">Already in your codex</p>
                        )}
                        <h3 className="text-2xl font-semibold text-[#2C3E50] uppercase tracking-wide mt-1">{result.lemma}</h3>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${rarityPillClass}`}>
                        {result.rarityTier}
                      </span>
                    </div>

                    {result.newCapture && result.xpValue > 0 ? (
                      <div className="mt-3 inline-flex self-start items-center gap-2 rounded-full bg-[#EAFBF3] text-[#2C7A5C] px-3 py-1 text-sm font-medium">
                        <Sparkles size={14} />
                        +{result.xpValue} XP
                      </div>
                    ) : null}

                    <div className="mt-5">
                      <p className="text-xs uppercase tracking-wide text-[#6C757D]">Definition</p>
                      <p className="text-sm text-[#2C3E50] mt-1 leading-relaxed">{result.definition}</p>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs uppercase tracking-wide text-[#6C757D]">Synonyms</p>
                      <p className="text-sm text-[#2C3E50] mt-1 leading-relaxed">
                        {result.synonyms.length > 0 ? result.synonyms.join(', ') : 'No synonyms available.'}
                      </p>
                    </div>

                    <div className="mt-auto pt-6 flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={handleSearchAnother}>
                        Search another
                      </Button>
                      <Button className="flex-1" onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#6C757D] text-sm">
                    No result available.
                  </div>
                )}

                {showParticles ? (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]" aria-hidden="true">
                    {[8, 18, 30, 42, 56, 68, 80, 92].map((topOffset, index) => (
                      <span
                        key={`particle-left-${topOffset}`}
                        className="absolute -left-1 w-2 h-2 rounded-full bg-[#D4C5F9] animate-ping"
                        style={{ top: `${topOffset}%`, animationDelay: `${index * 90}ms` }}
                      />
                    ))}
                    {[12, 22, 34, 46, 60, 72, 84, 96].map((topOffset, index) => (
                      <span
                        key={`particle-right-${topOffset}`}
                        className="absolute -right-1 w-2 h-2 rounded-full bg-[#A8E6CF] animate-ping"
                        style={{ top: `${topOffset}%`, animationDelay: `${index * 90}ms` }}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
