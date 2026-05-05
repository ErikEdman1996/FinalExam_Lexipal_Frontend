import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from './Button';
import { AppDialog } from './dialog/AppDialog';
import { inputClassName } from './form/inputStyles';
import mothIcon from '../assets/moth_icon.svg';
import mothIconLight from '../assets/moth_icon_light.png';
import { useTheme } from '../features/theme/useTheme';
import {
  type CodexOverallProgressDTO,
  type CodexPageProgressDTO,
  createWordLookup,
  extractDictionarySenses,
  extractDefinitionFromDefinitions,
  extractPhoneticText,
  extractPartsOfSpeechFromDefinitions,
  extractSynonymsFromDefinitions,
  normalizeRarityTier,
  type DictionarySense,
  type XpUpdateResponseDTO,
  type RarityTier,
  type WordLookupReadResponseDTO,
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
  onLookupSaved?: (lookup: WordLookupReadResponseDTO) => void;
  sessionId?: number | null;
  bookId?: string | number | null;
}

type CapturePayload = Parameters<WordLookupModalProps['onCapture']>[0];
type MysteryRevealPhase = 'idle' | 'drawing' | 'flipping';

const MYSTERY_TRACE_PATH = 'M 14 18 L 86 18 L 24 82 L 86 82';
const MYSTERY_TRACE_GRADIENT_ID = 'word-lookup-mystery-trace-gradient';

interface LookupResult {
  lemma: string;
  definition: string;
  senses: DictionarySense[];
  synonyms: string[];
  partsOfSpeech: string[];
  phoneticText: string;
  isCollectible: boolean;
  isNewLookup: boolean;
  isNewCapture: boolean;
  alreadyCaptured: boolean;
  rarityTier: RarityTier;
  xpValue: number;
  lookupCount: number;
  pageNumber: number | null;
  slotNumber: number | null;
  pageProgress: CodexPageProgressDTO | null;
  overallProgress: CodexOverallProgressDTO | null;
}

const getRarityBorderClass = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'border-[#B084F5] shadow-[0_0_0_1px_rgba(176,132,245,0.55),0_0_24px_rgba(176,132,245,0.55),0_0_48px_rgba(139,232,255,0.35),0_0_72px_rgba(255,221,122,0.25)]';
  }

  if (tier === 'RARE') {
    return 'border-[#D6A332] shadow-[0_0_0_1px_rgba(214,163,50,0.55),0_0_22px_rgba(214,163,50,0.6),0_0_48px_rgba(214,163,50,0.35)]';
  }

  if (tier === 'UNCOMMON') {
    return 'border-[#7FB7FF] shadow-[0_0_0_1px_rgba(127,183,255,0.55),0_0_22px_rgba(127,183,255,0.6),0_0_48px_rgba(127,183,255,0.35)]';
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

const getMysteryTraceDurationMs = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 560;
  }

  if (tier === 'RARE') {
    return 420;
  }

  if (tier === 'UNCOMMON') {
    return 320;
  }

  return 260;
};

const getMysteryTraceStroke = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return `url(#${MYSTERY_TRACE_GRADIENT_ID})`;
  }

  if (tier === 'RARE') {
    return '#D6A332';
  }

  if (tier === 'UNCOMMON') {
    return '#7FB7FF';
  }

  return '#FFFFFF';
};

const getMysteryTraceFilter = (tier: LookupResult['rarityTier']) => {
  if (tier === 'MYTHIC') {
    return 'drop-shadow(0 0 8px rgba(255,216,102,0.4)) drop-shadow(0 0 18px rgba(176,132,245,0.45))';
  }

  if (tier === 'RARE') {
    return 'drop-shadow(0 0 6px rgba(214,163,50,0.55)) drop-shadow(0 0 14px rgba(214,163,50,0.28))';
  }

  if (tier === 'UNCOMMON') {
    return 'drop-shadow(0 0 6px rgba(127,183,255,0.55)) drop-shadow(0 0 14px rgba(127,183,255,0.28))';
  }

  return 'drop-shadow(0 0 4px rgba(255,255,255,0.32)) drop-shadow(0 0 10px rgba(255,255,255,0.16))';
};

const getRaritySurfaceClass = () => {
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
    return 'Looked-up word';
  }

  if (result.isNewCapture) {
    return 'New Codex capture';
  }

  if (result.alreadyCaptured) {
    return 'Already in Codex';
  }

  return 'Codex word';
};

const searchInputClassName = `${inputClassName} placeholder:text-text-subtle focus:border-transparent`;

export function WordLookupModal({
  isOpen,
  onClose,
  onCapture,
  onLookupSaved,
  sessionId,
  bookId,
}: WordLookupModalProps) {
  if (!isOpen) return null;

  return (
    <WordLookupModalContent
      onClose={onClose}
      onCapture={onCapture}
      onLookupSaved={onLookupSaved}
      sessionId={sessionId}
      bookId={bookId}
    />
  );
}

function WordLookupModalContent({
  onClose,
  onCapture,
  onLookupSaved,
  sessionId,
  bookId,
}: Omit<WordLookupModalProps, 'isOpen'>) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion() === true;
  const [word, setWord] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [showParticles, setShowParticles] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [mysteryRevealPhase, setMysteryRevealPhase] = useState<MysteryRevealPhase>('idle');
  const searchInFlightRef = useRef(false);
  const revealTimeoutRef = useRef<number | null>(null);
  const pendingCapturePayloadRef = useRef<CapturePayload | null>(null);
  const captureCommittedRef = useRef(false);
  const themedMothIcon = theme === 'light' ? mothIconLight : mothIcon;
  const shouldShowCaptureParticles = !!result?.isNewCapture && !!result?.isCollectible && result.rarityTier !== 'COMMON';

  useEffect(() => {
    return () => {
      if (revealTimeoutRef.current != null) {
        window.clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }

      pendingCapturePayloadRef.current = null;
      captureCommittedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isFlipped || !shouldShowCaptureParticles || prefersReducedMotion) {
      return;
    }

    setShowParticles(true);
    const timeoutId = window.setTimeout(() => {
      setShowParticles(false);
    }, 850);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isFlipped, prefersReducedMotion, shouldShowCaptureParticles]);

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

      if (!sessionId) {
        setLookupError('Start this reading session before looking up a word.');
        return;
      }

      const lookupResponse = await createWordLookup(sessionId, {
        lemma: trimmedWord,
      });
      const { wordLookup } = lookupResponse;
      onLookupSaved?.(wordLookup);
      const mappedDefinition = extractDefinitionFromDefinitions(wordLookup.definitions);
      const mappedSenses = extractDictionarySenses(wordLookup.definitions);
      const mappedSynonyms = extractSynonymsFromDefinitions(wordLookup.definitions);
      const mappedPartsOfSpeech = extractPartsOfSpeechFromDefinitions(wordLookup.definitions);
      const mappedPhoneticText = extractPhoneticText(wordLookup.phonetics);
      const captureXp = lookupResponse.isNewCapture
        ? lookupResponse.xpUpdate?.xpAwarded ?? lookupResponse.codexEntry?.xpValue ?? 0
        : 0;

      const nextResult: LookupResult = {
        lemma: wordLookup.lemma || trimmedWord,
        definition: mappedDefinition || 'No definition available right now.',
        senses: mappedSenses,
        synonyms: mappedSynonyms,
        partsOfSpeech: mappedPartsOfSpeech,
        phoneticText: mappedPhoneticText,
        isCollectible: lookupResponse.isCollectible,
        isNewLookup: lookupResponse.isNewLookup,
        isNewCapture: lookupResponse.isNewCapture,
        alreadyCaptured: lookupResponse.alreadyCaptured,
        rarityTier: normalizeRarityTier(lookupResponse.rarityTier ?? lookupResponse.codexEntry?.rarityTier),
        xpValue: captureXp,
        lookupCount: wordLookup.lookupCount,
        pageNumber: lookupResponse.pageNumber,
        slotNumber: lookupResponse.slotNumber,
        pageProgress: lookupResponse.pageProgress,
        overallProgress: lookupResponse.overallProgress,
      };
      const nextXpUpdate = lookupResponse.xpUpdate;

      setWord(nextResult.lemma);
      setResult(nextResult);
      setIsFlipped(false);

      if (revealTimeoutRef.current != null) {
        window.clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }

      pendingCapturePayloadRef.current = null;
      captureCommittedRef.current = false;
      setMysteryRevealPhase('idle');

      const capturePayload: CapturePayload = {
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
      };

      if (nextResult.isCollectible && nextResult.isNewCapture) {
        pendingCapturePayloadRef.current = capturePayload;
        setIsRevealing(false);
        return;
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

      onCapture(capturePayload);
    } catch (error) {
      console.error('Error looking up word:', error);
      setLookupError('Could not look up this word right now. Please try again.');
    } finally {
      searchInFlightRef.current = false;
      setIsSearching(false);
    }
  };

  const finalizeMysteryReveal = (payload: CapturePayload) => {
    if (captureCommittedRef.current) {
      return;
    }

    captureCommittedRef.current = true;
    pendingCapturePayloadRef.current = null;
    setIsRevealing(false);
    setMysteryRevealPhase('flipping');
    onCapture(payload);
    setIsFlipped(true);
  };

  const handleMysteryReveal = () => {
    const payload = pendingCapturePayloadRef.current;
    if (!payload || mysteryRevealPhase !== 'idle') {
      return;
    }

    if (revealTimeoutRef.current != null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    if (prefersReducedMotion) {
      finalizeMysteryReveal(payload);
      return;
    }

    setMysteryRevealPhase('drawing');
    revealTimeoutRef.current = window.setTimeout(() => {
      revealTimeoutRef.current = null;
      finalizeMysteryReveal(payload);
    }, getMysteryTraceDurationMs(payload.rarityTier));
  };

  const handleSearchAnother = () => {
    if (revealTimeoutRef.current != null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }

    pendingCapturePayloadRef.current = null;
    captureCommittedRef.current = false;
    setMysteryRevealPhase('idle');
    setWord('');
    setLookupError(null);
    setIsFlipped(false);
    setResult(null);
    setShowParticles(false);
    setIsRevealing(false);
  };

  const canSearch = !!word.trim() && !isSearching;
  const rarityBorderClass = getRarityBorderClass(result?.rarityTier ?? 'COMMON');
  const rarityPillClass = getRarityPillClass(result?.rarityTier ?? 'COMMON');
  const raritySurfaceClass = getRaritySurfaceClass();
  const rarityAuraClass = getRarityAuraClass(result?.rarityTier ?? 'COMMON');
  const hasMythicReveal = !!result?.isCollectible && !!result?.isNewCapture && result.rarityTier === 'MYTHIC';
  const lookupCardHeight = getLookupCardHeight(result);
  const shouldRenderMysteryCard =
    !!result?.isCollectible &&
    !!result?.isNewCapture &&
    (pendingCapturePayloadRef.current !== null || mysteryRevealPhase !== 'idle');
  const mysteryTraceDurationSeconds = getMysteryTraceDurationMs(result?.rarityTier ?? 'COMMON') / 1000;
  const mysteryTraceStroke = getMysteryTraceStroke(result?.rarityTier ?? 'COMMON');
  const mysteryTraceFilter = getMysteryTraceFilter(result?.rarityTier ?? 'COMMON');
  
  return (
    <AppDialog
      isOpen
      onClose={onClose}
      contentClassName="w-[calc(100vw-2rem)] max-w-lg bg-transparent p-0 shadow-none outline-none animate-in slide-in-from-bottom duration-300 sm:slide-in-from-bottom-0"
    >
      <div
        className="relative transition-[height] duration-300"
        style={{
          height: `min(${lookupCardHeight}px, calc(94vh - 2rem))`,
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
            className="absolute inset-0 rounded-[24px] border border-border bg-surface p-5 overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
                {shouldRenderMysteryCard ? (
                  <motion.button
                    type="button"
                    onClick={handleMysteryReveal}
                    aria-label="Reveal captured word"
                    disabled={mysteryRevealPhase !== 'idle'}
                    className="group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-[20px] border border-border bg-gradient-to-br from-slate-900 via-slate-950 to-black"
                    animate={
                      mysteryRevealPhase === 'idle' && !prefersReducedMotion
                        ? { rotate: [0, -1.6, 1.6, -1, 1, 0] }
                        : { rotate: 0 }
                    }
                    transition={
                      mysteryRevealPhase === 'idle' && !prefersReducedMotion
                        ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.18, ease: 'easeOut' }
                    }
                  >
                    <motion.img
                      src={themedMothIcon}
                      alt=""
                      className="h-20 w-20 opacity-80"
                      animate={
                        mysteryRevealPhase === 'idle' && !prefersReducedMotion
                          ? { scale: [1, 1.06, 1], opacity: [0.75, 1, 0.75] }
                          : { scale: 1, opacity: 0.8 }
                      }
                      transition={
                        mysteryRevealPhase === 'idle' && !prefersReducedMotion
                          ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
                          : { duration: 0.18, ease: 'easeOut' }
                      }
                    />
                    <p className="mt-6 text-xs uppercase tracking-[0.32em] text-white/70">Tap to reveal</p>
                    {mysteryRevealPhase === 'drawing' ? (
                      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                        <svg viewBox="0 0 100 100" className="h-full w-full">
                          <defs>
                            <linearGradient id={MYSTERY_TRACE_GRADIENT_ID} x1="12%" y1="18%" x2="88%" y2="82%">
                              <stop offset="0%" stopColor="#FF7A59" />
                              <stop offset="28%" stopColor="#FFD866" />
                              <stop offset="58%" stopColor="#8BE8FF" />
                              <stop offset="100%" stopColor="#B084F5" />
                            </linearGradient>
                          </defs>
                          <motion.path
                            d={MYSTERY_TRACE_PATH}
                            fill="none"
                            stroke={mysteryTraceStroke}
                            strokeWidth="4.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            style={{ filter: mysteryTraceFilter }}
                            initial={{ pathLength: 0, opacity: 0.28 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: mysteryTraceDurationSeconds, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </svg>
                      </div>
                    ) : null}
                  </motion.button>
                ) : (
                  <>
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
                      className={searchInputClassName}
                      placeholder="Enter word"
                      autoComplete="off"
                      spellCheck={false}
                    />

                    {lookupError ? (
                      <p className="mt-2 text-sm text-danger">{lookupError}</p>
                    ) : null}

                    <div className="mt-6 flex gap-3">
                      <Button variant="outline" onClick={onClose} className="flex-1">
                        Exit
                      </Button>
                      <Button onClick={() => void handleSearch()} className="flex-1" disabled={!canSearch}>
                        {isSearching ? 'Searching...' : 'Search'}
                      </Button>
                    </div>
                  </>
                )}

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
                className={`absolute inset-0 rounded-[24px] border overflow-hidden ${rarityBorderClass} ${raritySurfaceClass}`}
                style={{
                  backfaceVisibility: 'hidden',
                  transformStyle: 'preserve-3d',
                  rotateY: 180,
                }}
                initial={result && !prefersReducedMotion ? { opacity: 0, scale: 0.94, y: 16 } : false}
                animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: hasMythicReveal ? 0.65 : 0.4, ease: 'easeOut' }}
              >
                {result ? (
                  <>
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
                            <span className="rounded-full bg-surface-alt px-2.5 py-1 text-xs font-medium text-text-muted">
                              {result.isNewLookup ? 'Saved to history' : `${result.lookupCount} lookups`}
                            </span>
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

                      {result.alreadyCaptured ? (
                        <div className="mt-4 rounded-[18px] border border-border bg-surface-alt p-3 text-sm leading-relaxed text-text-muted">
                          This word was already in your Codex. No new capture XP was awarded.
                        </div>
                      ) : null}

                      <div className="mt-5">
                        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Definitions</p>
                        <div className="mt-3 space-y-4">
                          {(result.senses.length > 0 ? result.senses : [{ definition: result.definition, examples: [] }]).slice(0, 3).map((sense, index) => (
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

                      <div className="mt-auto flex flex-col gap-3 pt-6">
                        {result.isNewCapture && result.isCollectible && result.pageNumber != null && result.slotNumber != null ? (
                          <Button
                            className="w-full"
                            onClick={() => {
                              const targetPage = result.pageNumber;
                              const targetSlot = result.slotNumber;
                              const targetLemma = result.lemma;
                              const targetRarity = result.rarityTier;
                              onClose();
                              void navigate(`/codex/page/${targetPage}`, {
                                state: {
                                  revealSlot: {
                                    pageNumber: targetPage,
                                    slotNumber: targetSlot,
                                    lemma: targetLemma,
                                    rarityTier: targetRarity,
                                  },
                                  returnToSession: bookId != null ? { bookId } : null,
                                },
                              });
                            }}
                          >
                            Go to Codex
                          </Button>
                        ) : null}
                        <div className="flex gap-3">
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
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-text-muted">
                    No result available.
                  </div>
                )}

                {showParticles && shouldShowCaptureParticles ? (
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
    </AppDialog>
  );
}
