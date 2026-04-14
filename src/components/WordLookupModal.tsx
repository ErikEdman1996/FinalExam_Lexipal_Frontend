import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Sparkles, X } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Button } from './Button';
import {
  createCodexEntry,
  extractDefinitionFromDefinitions,
  extractPartsOfSpeechFromDefinitions,
  extractSynonymsFromDefinitions,
  getDictionaryWord,
} from '../api/api';

interface WordLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (word: { lemma: string; definition: string; synonyms: string[] }, newCapture: boolean) => void;
  codexEntryLemmas: string[];
  sessionId?: number | null;
}

interface LookupResult {
  lemma: string;
  definition: string;
  synonyms: string[];
  partsOfSpeech: string[];
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

const getRevealDelayMs = (tier: LookupResult['rarityTier'], isNewCapture: boolean, reducedMotion: boolean) => {
  if (!isNewCapture || reducedMotion) {
    return 0;
  }

  if (tier === 'MYTHIC') {
    return 950;
  }

  if (tier === 'RARE') {
    return 500;
  }

  return 0;
};

const getRaritySurfaceClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'bg-[radial-gradient(circle_at_top,#fef7ff_0%,#f7f1ff_34%,#eef6ff_68%,#fdfdfd_100%)]';
  }

  if (tier === 'RARE') {
    return 'bg-[radial-gradient(circle_at_top,#f8fbff_0%,#eef5ff_46%,#fcfdff_100%)]';
  }

  return 'bg-white';
};

const getRarityAuraClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'from-[#fff5bf]/70 via-[#d8c4ff]/65 to-[#88d8ff]/70';
  }

  if (tier === 'RARE') {
    return 'from-[#d8ebff]/70 via-[#b9d6ff]/55 to-[#e8f7ff]/65';
  }

  return 'from-transparent via-transparent to-transparent';
};

const getInnerPanelClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,255,0.93))]';
  }

  if (tier === 'RARE') {
    return 'bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,251,255,0.94))]';
  }

  return 'bg-white';
};

const getLookupCardHeight = (result: LookupResult | null) => {
  if (!result) {
    return 380;
  }

  const synonymText = result.synonyms.join(', ');
  const partOfSpeechText = result.partsOfSpeech.join(', ');
  const contentLength = result.definition.length + synonymText.length + partOfSpeechText.length;
  const estimatedTextLines = Math.ceil(contentLength / 46);
  const estimatedHeight = 320 + (estimatedTextLines * 18);

  return Math.min(620, Math.max(380, estimatedHeight));
};

export function WordLookupModal({
  isOpen,
  onClose,
  onCapture,
  codexEntryLemmas,
  sessionId,
}: WordLookupModalProps) {
  const [word, setWord] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const searchInFlightRef = useRef(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 180, damping: 18, mass: 0.8 });
  const springRotateY = useSpring(rotateY, { stiffness: 180, damping: 18, mass: 0.8 });
  const flareX = useTransform(springRotateY, [-10, 10], ['35%', '65%']);
  const flareY = useTransform(springRotateX, [-10, 10], ['45%', '58%']);

  const codexEntryLemmaSet = useMemo(() => new Set(codexEntryLemmas.map((lemma) => lemma.toLowerCase())), [codexEntryLemmas]);

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
      if (revealTimeoutRef.current != null) {
        window.clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }

      setWord('');
      setLookupError(null);
      setIsSearching(false);
      setIsFlipped(false);
      setResult(null);
      setShowParticles(false);
      setIsRevealing(false);
      rotateX.set(0);
      rotateY.set(0);
    }
  }, [isOpen, rotateX, rotateY]);
  
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
        const codexEntryResponse = await createCodexEntry(sessionId, {
          lemma: trimmedWord,
        });

        const codexEntry = codexEntryResponse.codexEntry;
        const mappedDefinition = extractDefinitionFromDefinitions(codexEntry.definitions);
        const mappedSynonyms = extractSynonymsFromDefinitions(codexEntry.definitions);
        const mappedPartsOfSpeech = extractPartsOfSpeechFromDefinitions(codexEntry.definitions);

        nextResult = {
          lemma: codexEntry.lemma ?? trimmedWord,
          definition: mappedDefinition || 'No definition available right now.',
          synonyms: mappedSynonyms,
          partsOfSpeech: mappedPartsOfSpeech,
          newCapture: codexEntryResponse.newCapture,
          rarityTier: (codexEntryResponse.rarityTier as LookupResult['rarityTier']) ?? 'COMMON',
          xpValue: codexEntry.xpValue ?? 0,
        };
      } else {
        const fetchedWord = await getDictionaryWord(trimmedWord);
        const normalizedLemma = (fetchedWord.lemma ?? trimmedWord).toLowerCase();
        const fallbackNewCapture = !codexEntryLemmaSet.has(normalizedLemma);

        nextResult = {
          lemma: fetchedWord.lemma ?? trimmedWord,
          definition: extractDefinitionFromDefinitions(fetchedWord.definitions) || 'No definition available right now.',
          synonyms: extractSynonymsFromDefinitions(fetchedWord.definitions),
          partsOfSpeech: extractPartsOfSpeechFromDefinitions(fetchedWord.definitions),
          newCapture: fallbackNewCapture,
          rarityTier: getRarityTierFromScore(fetchedWord.rarityScore),
          xpValue: fallbackNewCapture ? 10 : 0,
        };
      }

      setWord(nextResult.lemma);
      setResult(nextResult);
      setIsFlipped(false);

      if (revealTimeoutRef.current != null) {
        window.clearTimeout(revealTimeoutRef.current);
      }

      const revealDelayMs = getRevealDelayMs(nextResult.rarityTier, nextResult.newCapture, prefersReducedMotion);

      if (revealDelayMs > 0) {
        setIsRevealing(true);
        revealTimeoutRef.current = window.setTimeout(() => {
          setIsRevealing(false);
          setIsFlipped(true);
          revealTimeoutRef.current = null;
        }, revealDelayMs);
      } else {
        setIsRevealing(false);
        setIsFlipped(true);
      }

      onCapture(
        {
          lemma: nextResult.lemma,
          definition: nextResult.definition,
          synonyms: nextResult.synonyms,
        },
        nextResult.newCapture,
      );
    } catch (error) {
      console.error('Error creating codex entry:', error);
      setLookupError('Could not capture this word right now. Please try again.');
    } finally {
      searchInFlightRef.current = false;
      setIsSearching(false);
    }
  };

  const handleSearchAnother = () => {
    if (revealTimeoutRef.current != null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    setWord('');
    setLookupError(null);
    setIsFlipped(false);
    setResult(null);
    setShowParticles(false);
    setIsRevealing(false);
    rotateX.set(0);
    rotateY.set(0);
  };

  const canSearch = !!word.trim() && !isSearching;
  const rarityBorderClass = getRarityBorderClass(result?.rarityTier ?? 'COMMON');
  const rarityPillClass = getRarityPillClass(result?.rarityTier ?? 'COMMON');
  const raritySurfaceClass = getRaritySurfaceClass(result?.rarityTier ?? 'COMMON');
  const rarityAuraClass = getRarityAuraClass(result?.rarityTier ?? 'COMMON');
  const innerPanelClass = getInnerPanelClass(result?.rarityTier ?? 'COMMON');
  const hasHighRarityReveal = !!result?.newCapture && (result.rarityTier === 'RARE' || result.rarityTier === 'MYTHIC');
  const hasMythicReveal = !!result?.newCapture && result.rarityTier === 'MYTHIC';
  const canTiltCard = !prefersReducedMotion && !!result?.newCapture && (result?.rarityTier === 'RARE' || result?.rarityTier === 'MYTHIC');
  const lookupCardHeight = getLookupCardHeight(result);

  const handleCardPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canTiltCard) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const offsetX = (event.clientX - bounds.left) / bounds.width;
    const offsetY = (event.clientY - bounds.top) / bounds.height;

    rotateY.set((offsetX - 0.5) * 12);
    rotateX.set((0.5 - offsetY) * 10);
  };

  const resetCardTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md max-h-[92vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300"
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
          <div
            className="relative transition-[height] duration-300"
            style={{ height: `${lookupCardHeight}px`, perspective: prefersReducedMotion ? 'none' : '1200px' }}
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

                {isRevealing && result ? (
                  <motion.div
                    className="pointer-events-none absolute inset-0 rounded-[24px] overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-br ${rarityAuraClass}`}
                      animate={
                        prefersReducedMotion
                          ? { opacity: 0.7 }
                          : { opacity: [0.45, 0.85, 0.55], scale: [1, 1.05, 1.02] }
                      }
                      transition={{ duration: result.rarityTier === 'MYTHIC' ? 1.2 : 0.8, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)]"
                      animate={prefersReducedMotion ? { opacity: 0.75 } : { x: ['-10%', '230%'], opacity: [0, 0.95, 0] }}
                      transition={{ duration: result.rarityTier === 'MYTHIC' ? 1.35 : 0.95, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="absolute inset-x-0 bottom-7 text-center">
                      <p className="text-xs uppercase tracking-[0.32em] text-[#2C3E50]/70">
                        {result.rarityTier === 'MYTHIC' ? 'Mythic resonance' : 'Rare signal'}
                      </p>
                    </div>
                  </motion.div>
                ) : null}
              </div>

              <motion.div
                className={`absolute inset-0 rounded-[24px] border p-5 overflow-hidden ${rarityBorderClass} ${raritySurfaceClass}`}
                style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                onPointerMove={handleCardPointerMove}
                onPointerLeave={resetCardTilt}
                animate={
                  canTiltCard
                    ? {
                        boxShadow: hasMythicReveal
                          ? [
                              '0 0 0 1px rgba(176,132,245,0.30), 0 16px 32px rgba(122,89,214,0.24)',
                              '0 0 0 1px rgba(255,219,122,0.48), 0 22px 48px rgba(122,89,214,0.30)',
                              '0 0 0 1px rgba(176,132,245,0.30), 0 16px 32px rgba(122,89,214,0.24)',
                            ]
                          : [
                              '0 0 0 1px rgba(127,183,255,0.30), 0 14px 28px rgba(80,125,216,0.18)',
                              '0 0 0 1px rgba(127,183,255,0.45), 0 18px 36px rgba(80,125,216,0.24)',
                              '0 0 0 1px rgba(127,183,255,0.30), 0 14px 28px rgba(80,125,216,0.18)',
                            ],
                      }
                    : undefined
                }
                transition={canTiltCard ? { duration: hasMythicReveal ? 2.2 : 1.8, repeat: Infinity, ease: 'easeInOut' } : undefined}
              >
                {result ? (
                  <motion.div
                    className={`relative z-10 h-full overflow-hidden rounded-[20px] border border-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] ${innerPanelClass}`}
                    style={
                      canTiltCard
                        ? {
                            rotateX: springRotateX,
                            rotateY: springRotateY,
                            transformStyle: 'preserve-3d',
                          }
                        : undefined
                    }
                    initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, y: 16 }}
                    animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: hasMythicReveal ? 0.65 : 0.4, ease: 'easeOut' }}
                  >
                    {hasHighRarityReveal ? (
                      <>
                        <motion.div
                          className={`pointer-events-none absolute inset-[-12%] z-0 rounded-[30px] bg-gradient-to-br ${rarityAuraClass} blur-2xl`}
                          animate={
                            prefersReducedMotion
                              ? { opacity: 0.5 }
                              : { opacity: [0.32, 0.72, 0.4], scale: [0.96, 1.06, 1] }
                          }
                          transition={{ duration: hasMythicReveal ? 2.8 : 2, repeat: Infinity, ease: 'easeInOut' }}
                        />
                        <motion.div
                          className="pointer-events-none absolute inset-0 z-0 rounded-[22px] opacity-80"
                          style={{
                            background: hasMythicReveal
                              ? 'linear-gradient(115deg, rgba(255,0,128,0.07), rgba(255,208,0,0.1), rgba(0,214,255,0.08), rgba(160,100,255,0.08))'
                              : 'linear-gradient(115deg, rgba(124,177,255,0.05), rgba(210,235,255,0.12), rgba(124,177,255,0.05))',
                            backgroundSize: '220% 220%',
                          }}
                          animate={prefersReducedMotion ? { opacity: 0.65 } : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                          transition={{ duration: hasMythicReveal ? 5 : 3.6, repeat: Infinity, ease: 'linear' }}
                        />
                      </>
                    ) : null}

                    {hasMythicReveal ? (
                      <motion.div
                        className="pointer-events-none absolute inset-[-1px] z-0 rounded-[24px] p-[1.5px]"
                        style={{
                          background: 'linear-gradient(120deg, rgba(255,95,109,0.9), rgba(255,221,89,0.9), rgba(77,208,225,0.9), rgba(176,132,245,0.95), rgba(255,95,109,0.9))',
                          backgroundSize: '300% 300%',
                        }}
                        animate={prefersReducedMotion ? { opacity: 0.9 } : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                        transition={{ duration: 4.2, repeat: Infinity, ease: 'linear' }}
                      >
                        <div className="h-full w-full rounded-[22px] bg-transparent" />
                      </motion.div>
                    ) : null}

                    {hasHighRarityReveal ? (
                      <motion.div
                        className="pointer-events-none absolute inset-0 z-0 rounded-[24px]"
                        style={{
                          background: 'radial-gradient(circle at var(--flare-x, 50%) var(--flare-y, 50%), rgba(255,255,255,0.22), rgba(255,255,255,0.08) 16%, transparent 32%)',
                          ['--flare-x' as string]: flareX,
                          ['--flare-y' as string]: flareY,
                        }}
                        animate={prefersReducedMotion ? { opacity: 0.35 } : { opacity: [0.12, 0.3, 0.18] }}
                        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    ) : null}

                    <div className="relative z-10 flex h-full flex-col overflow-y-auto px-5 py-4">
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

                      {result.partsOfSpeech.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {result.partsOfSpeech.map((partOfSpeech) => (
                            <span
                              key={partOfSpeech}
                              className="rounded-full bg-[#EEF3F8] px-3 py-1 text-xs font-medium text-[#4D6175]"
                            >
                              {partOfSpeech}
                            </span>
                          ))}
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
                        <Button
                          variant="outline"
                          className="flex-1 border-white/85 bg-white/92 shadow-[0_10px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm hover:bg-white"
                          onClick={handleSearchAnother}
                        >
                          Search another
                        </Button>
                        <Button
                          className="flex-1 border border-white/30 bg-[linear-gradient(135deg,#d9f7ea,#a8e6cf)] shadow-[0_10px_24px_rgba(76,167,132,0.22)] hover:bg-[linear-gradient(135deg,#cff4e4,#9fe0c8)]"
                          onClick={onClose}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-[10px] z-0 rounded-[18px] border border-white/55" />
                  </motion.div>
                ) : (
                  <div className="h-full flex items-center justify-center text-[#6C757D] text-sm">
                    No result available.
                  </div>
                )}

                {showParticles ? (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]" aria-hidden="true">
                    {[8, 18, 30, 42, 56, 68, 80, 92].map((topOffset, index) => (
                      <motion.span
                        key={`particle-left-${topOffset}`}
                        className={`absolute -left-1 h-2 w-2 rounded-full ${hasMythicReveal ? 'bg-[#FFE27A]' : 'bg-[#D4C5F9]'}`}
                        initial={{ opacity: 0, x: 0, scale: 0.6 }}
                        animate={
                          prefersReducedMotion
                            ? { opacity: 0.8 }
                            : { opacity: [0, 1, 0], x: [0, 24, 42], y: [0, -6, -10], scale: [0.6, 1.2, 0.8] }
                        }
                        transition={{ duration: 0.9, delay: index * 0.05, ease: 'easeOut' }}
                        style={{ top: `${topOffset}%`, animationDelay: `${index * 90}ms` }}
                      />
                    ))}
                    {[12, 22, 34, 46, 60, 72, 84, 96].map((topOffset, index) => (
                      <motion.span
                        key={`particle-right-${topOffset}`}
                        className={`absolute -right-1 h-2 w-2 rounded-full ${hasMythicReveal ? 'bg-[#8BE8FF]' : 'bg-[#A8E6CF]'}`}
                        initial={{ opacity: 0, x: 0, scale: 0.6 }}
                        animate={
                          prefersReducedMotion
                            ? { opacity: 0.8 }
                            : { opacity: [0, 1, 0], x: [0, -24, -42], y: [0, -8, -12], scale: [0.6, 1.2, 0.8] }
                        }
                        transition={{ duration: 0.9, delay: index * 0.05, ease: 'easeOut' }}
                        style={{ top: `${topOffset}%`, animationDelay: `${index * 90}ms` }}
                      />
                    ))}
                  </div>
                ) : null}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
