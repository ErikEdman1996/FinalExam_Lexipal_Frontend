import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Sparkles, X } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Button } from './Button';
import {
  type CodexOverallProgressDTO,
  type CodexPageProgressDTO,
  createCodexEntry,
  extractDictionarySenses,
  extractDefinitionFromDefinitions,
  extractPhoneticText,
  extractPartsOfSpeechFromDefinitions,
  extractSynonymsFromDefinitions,
  getDictionaryWord,
  normalizeRarityTier,
  type DictionarySense,
  type XpUpdateResponseDTO,
  type RarityTier,
} from '../api/api';

interface WordLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (result: {
    lemma: string;
    definition: string;
    synonyms: string[];
    isCollectible: boolean;
    isNewCapture: boolean;
    alreadyCaptured: boolean;
    xpValue: number;
    xpUpdate: XpUpdateResponseDTO | null;
    rarityTier: RarityTier;
    pageNumber: number | null;
    slotNumber: number | null;
    pageProgress: CodexPageProgressDTO | null;
    overallProgress: CodexOverallProgressDTO | null;
  }) => void;
  codexEntryLemmas: string[];
  sessionId?: number | null;
}

interface LookupResult {
  lemma: string;
  definition: string;
  senses: DictionarySense[];
  synonyms: string[];
  partsOfSpeech: string[];
  phoneticText: string;
  isCollectible: boolean;
  isNewCapture: boolean;
  alreadyCaptured: boolean;
  rarityTier: RarityTier;
  xpValue: number;
  pageNumber: number | null;
  slotNumber: number | null;
  pageProgress: CodexPageProgressDTO | null;
  overallProgress: CodexOverallProgressDTO | null;
}

const getRarityTierFromScore = (score: number | null | undefined): RarityTier => {
  if ((score ?? 0) >= 0.9) {
    return 'MYTHIC';
  }

  if ((score ?? 0) >= 0.7) {
    return 'RARE';
  }

  if ((score ?? 0) >= 0.5) {
    return 'UNCOMMON';
  }

  return 'COMMON';
};

const getRarityBorderClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'border-[#B084F5] shadow-[0_0_0_1px_rgba(176,132,245,0.35),0_8px_24px_rgba(176,132,245,0.2)]';
  }

  if (tier === 'RARE') {
    return 'border-[#D6A332] shadow-[0_0_0_1px_rgba(214,163,50,0.35),0_8px_24px_rgba(214,163,50,0.18)]';
  }

  if (tier === 'UNCOMMON') {
    return 'border-[#7FB7FF] shadow-[0_0_0_1px_rgba(127,183,255,0.35),0_8px_24px_rgba(127,183,255,0.18)]';
  }

  return 'border-border';
};

const getRarityPillClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'border border-transparent bg-[linear-gradient(135deg,#FF7A59_0%,#FFD866_24%,#8BE8FF_52%,#B084F5_76%,#FF7A59_100%)] text-white shadow-[0_10px_24px_rgba(176,132,245,0.25)]';
  }

  if (tier === 'RARE') {
    return 'bg-[#FFF2D6] text-[#A36F00]';
  }

  if (tier === 'UNCOMMON') {
    return 'bg-[#E8F3FF] text-[#2B6CB0]';
  }

  return 'bg-surface-muted text-text-muted';
};

const getRevealDelayMs = (tier: LookupResult['rarityTier'], isNewCapture: boolean, isCollectible: boolean, reducedMotion: boolean) => {
  if (!isCollectible || !isNewCapture || reducedMotion) {
    return 0;
  }

  if (tier === 'MYTHIC') {
    return 950;
  }

  if (tier === 'RARE') {
    return 500;
  }

  if (tier === 'UNCOMMON') {
    return 250;
  }

  return 0;
};

const getRaritySurfaceClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'bg-[radial-gradient(circle_at_top,#fef7ff_0%,#f7f1ff_34%,#eef6ff_68%,#fdfdfd_100%)]';
  }

  if (tier === 'RARE') {
    return 'bg-[radial-gradient(circle_at_top,#fffaf0_0%,#fff2d6_44%,#fffdf8_100%)]';
  }

  if (tier === 'UNCOMMON') {
    return 'bg-[radial-gradient(circle_at_top,#f8fbff_0%,#eef5ff_46%,#fcfdff_100%)]';
  }

  return 'bg-surface';
};

const getRarityAuraClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'from-[#fff5bf]/70 via-[#d8c4ff]/65 to-[#88d8ff]/70';
  }

  if (tier === 'RARE') {
    return 'from-[#FFF2C4]/70 via-[#FFE29A]/55 to-[#FFF9E6]/65';
  }

  if (tier === 'UNCOMMON') {
    return 'from-[#d8ebff]/70 via-[#b9d6ff]/55 to-[#e8f7ff]/65';
  }

  return 'from-transparent via-transparent to-transparent';
};

const getInnerPanelClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(248,250,255,0.93))]';
  }

  if (tier === 'RARE') {
    return 'bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,249,240,0.94))]';
  }

  if (tier === 'UNCOMMON') {
    return 'bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,251,255,0.94))]';
  }

  return 'bg-surface';
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
  const estimatedHeight = 380 + (estimatedTextLines * 18);

  return Math.min(760, Math.max(500, estimatedHeight));
};

const getResultEyebrow = (result: LookupResult) => {
  if (!result.isCollectible) {
    return 'Dictionary entry';
  }

  if (result.isNewCapture) {
    return 'New collectible';
  }

  if (result.alreadyCaptured) {
    return 'Already collected';
  }

  return 'Collectible entry';
};

const searchInputClassName = 'w-full rounded-[16px] border border-border bg-surface-muted px-4 py-3 text-text placeholder:text-text-subtle transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand';
const resultInfoCardClassName = 'rounded-[18px] border border-border bg-surface-alt p-3 dark:bg-surface-muted';

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
    if (!isFlipped || !result?.isNewCapture || !result.isCollectible || prefersReducedMotion) {
      return;
    }

    setShowParticles(true);
    const timeoutId = window.setTimeout(() => {
      setShowParticles(false);
    }, 850);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFlipped, prefersReducedMotion, result?.isCollectible, result?.isNewCapture]);

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
      let nextXpUpdate: XpUpdateResponseDTO | null = null;

      if (sessionId) {
        const codexEntryResponse = await createCodexEntry(sessionId, {
          lemma: trimmedWord,
        });

        const codexEntry = codexEntryResponse.codexEntry;
        const mappedDefinition = extractDefinitionFromDefinitions(codexEntry.definitions);
        const mappedSenses = extractDictionarySenses(codexEntry.definitions);
        const mappedSynonyms = extractSynonymsFromDefinitions(codexEntry.definitions);
        const mappedPartsOfSpeech = extractPartsOfSpeechFromDefinitions(codexEntry.definitions);
        const mappedPhoneticText = extractPhoneticText(codexEntry.phonetics);

        nextResult = {
          lemma: codexEntry.lemma ?? trimmedWord,
          definition: mappedDefinition || 'No definition available right now.',
          senses: mappedSenses,
          synonyms: mappedSynonyms,
          partsOfSpeech: mappedPartsOfSpeech,
          phoneticText: mappedPhoneticText,
          isCollectible: codexEntryResponse.isCollectible,
          isNewCapture: codexEntryResponse.isNewCapture,
          alreadyCaptured: codexEntryResponse.alreadyCaptured,
          rarityTier: normalizeRarityTier(codexEntryResponse.rarityTier),
          xpValue: codexEntry.xpValue ?? 0,
          pageNumber: codexEntryResponse.pageNumber,
          slotNumber: codexEntryResponse.slotNumber,
          pageProgress: codexEntryResponse.pageProgress,
          overallProgress: codexEntryResponse.overallProgress,
        };
        nextXpUpdate = codexEntryResponse.xpUpdate;
      } else {
        const fetchedWord = await getDictionaryWord(trimmedWord);
        const normalizedLemma = (fetchedWord.lemma ?? trimmedWord).toLowerCase();
        const fallbackNewCapture = !codexEntryLemmaSet.has(normalizedLemma);

        nextResult = {
          lemma: fetchedWord.lemma ?? trimmedWord,
          definition: extractDefinitionFromDefinitions(fetchedWord.definitions) || 'No definition available right now.',
          senses: extractDictionarySenses(fetchedWord.definitions),
          synonyms: extractSynonymsFromDefinitions(fetchedWord.definitions),
          partsOfSpeech: extractPartsOfSpeechFromDefinitions(fetchedWord.definitions),
          phoneticText: extractPhoneticText(fetchedWord.phonetics),
          isCollectible: fallbackNewCapture,
          isNewCapture: fallbackNewCapture,
          alreadyCaptured: !fallbackNewCapture,
          rarityTier: getRarityTierFromScore(fetchedWord.rarityScore),
          xpValue: fallbackNewCapture ? 10 : 0,
          pageNumber: null,
          slotNumber: null,
          pageProgress: null,
          overallProgress: null,
        };
      }

      setWord(nextResult.lemma);
      setResult(nextResult);
      setIsFlipped(false);

      if (revealTimeoutRef.current != null) {
        window.clearTimeout(revealTimeoutRef.current);
      }

      const revealDelayMs = getRevealDelayMs(nextResult.rarityTier, nextResult.isNewCapture, nextResult.isCollectible, prefersReducedMotion);

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

      onCapture({
        lemma: nextResult.lemma,
        definition: nextResult.definition,
        synonyms: nextResult.synonyms,
        isCollectible: nextResult.isCollectible,
        isNewCapture: nextResult.isNewCapture,
        alreadyCaptured: nextResult.alreadyCaptured,
        xpValue: nextResult.xpValue,
        xpUpdate: nextXpUpdate,
        rarityTier: nextResult.rarityTier,
        pageNumber: nextResult.pageNumber,
        slotNumber: nextResult.slotNumber,
        pageProgress: nextResult.pageProgress,
        overallProgress: nextResult.overallProgress,
      });
    } catch (error) {
      console.error('Error creating codex entry:', error);
      setLookupError('Could not look up this word right now. Please try again.');
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
  const hasHighRarityReveal = !!result?.isCollectible && !!result?.isNewCapture && (result.rarityTier === 'UNCOMMON' || result.rarityTier === 'RARE' || result.rarityTier === 'MYTHIC');
  const hasMythicReveal = !!result?.isCollectible && !!result?.isNewCapture && result.rarityTier === 'MYTHIC';
  const canTiltCard = !prefersReducedMotion && !!result?.isCollectible && !!result?.isNewCapture && (result?.rarityTier === 'UNCOMMON' || result?.rarityTier === 'RARE' || result?.rarityTier === 'MYTHIC');
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="w-full max-w-lg max-h-[94vh] overflow-y-auto rounded-t-[32px] border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
        role="dialog"
        aria-modal="true"
        aria-label="Word lookup"
      >
        <div className="p-6 pt-6">
          <div className="mb-4 flex justify-end">
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-muted"
              aria-label="Close word lookup modal"
            >
              <X size={20} className="text-text-muted" />
            </button>
          </div>
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
                className="absolute inset-0 rounded-[24px] border border-border bg-surface p-5"
                style={{ backfaceVisibility: 'hidden' }}
              >
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
                  className={searchInputClassName}
                  placeholder="Enter word"
                  autoFocus
                  aria-label="Enter word"
                />

                {lookupError ? (
                  <p className="mt-2 text-sm text-danger">{lookupError}</p>
                ) : null}

                {!sessionId ? (
                  <p className="mt-3 text-xs leading-relaxed text-text-muted">
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
                      transition={{ duration: result.rarityTier === 'MYTHIC' ? 1.2 : result.rarityTier === 'RARE' ? 0.95 : 0.8, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.9),transparent)]"
                      animate={prefersReducedMotion ? { opacity: 0.75 } : { x: ['-10%', '230%'], opacity: [0, 0.95, 0] }}
                      transition={{ duration: result.rarityTier === 'MYTHIC' ? 1.35 : result.rarityTier === 'RARE' ? 1.05 : 0.95, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    <div className="absolute inset-x-0 bottom-7 text-center">
                      <p className="text-xs uppercase tracking-[0.32em] text-text/70">
                        {result.rarityTier === 'MYTHIC' ? 'Mythic resonance' : result.rarityTier === 'RARE' ? 'Rare signal' : 'Uncommon signal'}
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
                              result.rarityTier === 'RARE'
                                ? '0 0 0 1px rgba(214,163,50,0.30), 0 14px 28px rgba(214,163,50,0.18)'
                                : '0 0 0 1px rgba(127,183,255,0.30), 0 14px 28px rgba(80,125,216,0.18)',
                              result.rarityTier === 'RARE'
                                ? '0 0 0 1px rgba(214,163,50,0.45), 0 18px 36px rgba(214,163,50,0.24)'
                                : '0 0 0 1px rgba(127,183,255,0.45), 0 18px 36px rgba(80,125,216,0.24)',
                              result.rarityTier === 'RARE'
                                ? '0 0 0 1px rgba(214,163,50,0.30), 0 14px 28px rgba(214,163,50,0.18)'
                                : '0 0 0 1px rgba(127,183,255,0.30), 0 14px 28px rgba(80,125,216,0.18)',
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
                              : result.rarityTier === 'RARE'
                                ? 'linear-gradient(115deg, rgba(255,221,120,0.06), rgba(255,236,186,0.14), rgba(255,221,120,0.06))'
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
                      <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                        <div>
                          <p className="text-[0.72rem] uppercase tracking-[0.22em] text-text-subtle">{getResultEyebrow(result)}</p>
                          <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-text">{result.lemma}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-muted">
                            {result.phoneticText ? (
                              <span className="font-medium italic text-text">/{result.phoneticText}/</span>
                            ) : null}
                            {result.partsOfSpeech.length > 0 ? (
                              <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text">
                                {result.partsOfSpeech[0]}
                              </span>
                            ) : null}
                          </div>
                        </div>
                        {result.isCollectible ? (
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${rarityPillClass}`}>
                            {result.rarityTier}
                          </span>
                        ) : null}
                      </div>

                      {result.isNewCapture && result.isCollectible && result.xpValue > 0 ? (
                        <div className="mt-3 inline-flex self-start items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-strong">
                          <Sparkles size={14} />
                          +{result.xpValue} XP
                        </div>
                      ) : null}

                      {result.isCollectible && result.pageNumber != null && result.slotNumber != null ? (
                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className={resultInfoCardClassName}>
                            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-subtle">Board slot</p>
                            <p className="mt-2 text-sm font-semibold text-text">
                              Page {result.pageNumber}, Slot {result.slotNumber}
                            </p>
                          </div>
                          <div className={resultInfoCardClassName}>
                            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-subtle">Collection</p>
                            <p className="mt-2 text-sm font-semibold text-text">
                              {result.isNewCapture ? 'Added to Volume 1' : 'Already in Volume 1'}
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {result.isCollectible && (result.pageProgress || result.overallProgress) ? (
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {result.pageProgress ? (
                            <div className={resultInfoCardClassName}>
                              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-subtle">Page progress</p>
                              <p className="mt-2 text-sm font-semibold text-text">
                                {result.pageProgress.capturedCount} / {result.pageProgress.totalCount}
                              </p>
                            </div>
                          ) : null}
                          {result.overallProgress ? (
                            <div className={resultInfoCardClassName}>
                              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-text-subtle">Overall progress</p>
                              <p className="mt-2 text-sm font-semibold text-text">
                                {result.overallProgress.capturedWords} / {result.overallProgress.totalWords}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : null}

                      <div className="mt-5">
                        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Definitions</p>
                        <div className="mt-3 space-y-4">
                          {(result.senses.length > 0 ? result.senses : [{ definition: result.definition, examples: [] }]).map((sense, index) => (
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
                          {result.synonyms.length > 0 ? result.synonyms.join(', ') : 'No synonyms available.'}
                        </p>
                      </div>

                      <div className="mt-auto flex gap-3 pt-6">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={handleSearchAnother}
                        >
                          Search another
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={onClose}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute inset-[10px] z-0 rounded-[18px] border border-white/55 dark:border-border" />
                  </motion.div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-text-muted">
                    No result available.
                  </div>
                )}

                {showParticles ? (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[24px]" aria-hidden="true">
                    {[8, 18, 30, 42, 56, 68, 80, 92].map((topOffset, index) => (
                      <motion.span
                        key={`particle-left-${topOffset}`}
                        className={`absolute -left-1 h-2 w-2 rounded-full ${
                          hasMythicReveal ? 'bg-[#FFE27A]' : result?.rarityTier === 'RARE' ? 'bg-[#FFD866]' : 'bg-[#8EC5FF]'
                        }`}
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
                        className={`absolute -right-1 h-2 w-2 rounded-full ${
                          hasMythicReveal ? 'bg-[#8BE8FF]' : result?.rarityTier === 'RARE' ? 'bg-[#FFF0AE]' : 'bg-[#A8D8FF]'
                        }`}
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
