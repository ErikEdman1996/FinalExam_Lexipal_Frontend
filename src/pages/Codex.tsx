import { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, LockKeyhole, Star, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import {
  extractDefinitionFromDefinitions,
  extractDictionarySenses,
  extractPartsOfSpeechFromDefinitions,
  extractPhoneticText,
  extractSynonymsFromDefinitions,
  getCodexBoard,
  getDictionaryWord,
  normalizeRarityTier,
  type CodexBoardPageDTO,
  type CodexBoardResponseDTO,
  type CodexBoardSlotDTO,
  type DictionarySense,
  type RarityTier,
} from '../api/api';

const PAGE_COUNT = 12;
const SLOTS_PER_PAGE = 25;

const rarityBadgeClassNames: Record<RarityTier, string> = {
  COMMON: 'border border-[rgba(99,115,129,0.12)] bg-white/88 text-[#5F6C79]',
  UNCOMMON: 'border border-[rgba(75,147,209,0.16)] bg-[#EAF3FF] text-[#356A9A]',
  RARE: 'border border-[rgba(199,134,46,0.18)] bg-[#FFF4DC] text-[#9F6B00]',
  MYTHIC:
    'border border-transparent bg-[linear-gradient(135deg,#FF7A59_0%,#FFD866_22%,#8BE8FF_62%,#B084F5_100%)] text-white shadow-[0_10px_22px_rgba(176,132,245,0.26)]',
};

const rarityGlowClassNames: Record<RarityTier, string> = {
  COMMON: 'from-white via-[#F9FAFB] to-[#F2F5F8]',
  UNCOMMON: 'from-[#F8FBFF] via-[#EFF5FF] to-[#E5F1FF]',
  RARE: 'from-[#FFFDF6] via-[#FFF6E2] to-[#FFF0D2]',
  MYTHIC: 'from-[#FFF9F0] via-[#F9F3FF] to-[#EEF8FF]',
};

interface CapturedSlotDetails {
  pageNumber: number;
  slot: CodexBoardSlotDTO;
}

interface CodexDictionaryEntry {
  lemma: string;
  phoneticText: string;
  partsOfSpeech: string[];
  senses: DictionarySense[];
  synonyms: string[];
}

const formatPercent = (value: number) => `${Math.round(value)}%`;

const formatCapturedDate = (value?: string) => {
  if (!value) {
    return 'Recently captured';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Recently captured';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const buildBoardPages = (board: CodexBoardResponseDTO | null) => {
  const pageMap = new Map<number, CodexBoardPageDTO>();

  board?.pages.forEach((page) => {
    pageMap.set(page.pageNumber, page);
  });

  return Array.from({ length: PAGE_COUNT }, (_, index) => {
    const pageNumber = index + 1;
    const existingPage = pageMap.get(pageNumber);

    if (!existingPage) {
      return {
        pageNumber,
        capturedCount: 0,
        totalCount: SLOTS_PER_PAGE,
        completionPercentage: 0,
        slots: Array.from({ length: SLOTS_PER_PAGE }, (_, slotIndex) => ({
          slotNumber: slotIndex + 1,
          isCaptured: false,
        })),
      } satisfies CodexBoardPageDTO;
    }

    const slotMap = new Map(existingPage.slots.map((slot) => [slot.slotNumber, slot]));
    const totalCount = existingPage.totalCount > 0 ? existingPage.totalCount : SLOTS_PER_PAGE;
    const slots = Array.from({ length: totalCount }, (_, slotIndex) => {
      return slotMap.get(slotIndex + 1) ?? {
        slotNumber: slotIndex + 1,
        isCaptured: false,
      };
    });

    return {
      ...existingPage,
      totalCount,
      slots,
      capturedCount: existingPage.capturedCount ?? slots.filter((slot) => slot.isCaptured).length,
    };
  });
};

function BoardSkeleton() {
  return (
    <section className="rounded-[36px] border border-border bg-surface p-5 shadow-[0_24px_54px_rgba(15,23,42,0.08)] sm:p-7">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-4 w-24 rounded-full bg-surface-muted" />
          <div className="mt-3 h-8 w-44 rounded-full bg-surface-alt" />
        </div>
        <div className="h-11 w-28 rounded-full bg-surface-alt" />
      </div>

      <div className="mt-6 h-3 rounded-full bg-surface-alt" />

      <div className="mt-8 flex items-center justify-center gap-3 sm:gap-5">
        <div className="h-12 w-12 rounded-full bg-surface-alt sm:h-14 sm:w-14" />
        <div className="grid flex-1 max-w-[32rem] grid-cols-5 gap-2.5 sm:gap-3">
          {Array.from({ length: SLOTS_PER_PAGE }, (_, index) => (
            <div key={index} className="aspect-square rounded-[18px] bg-surface-muted" />
          ))}
        </div>
        <div className="h-12 w-12 rounded-full bg-surface-alt sm:h-14 sm:w-14" />
      </div>
    </section>
  );
}

function CapturedSlotModal({ details, onClose }: { details: CapturedSlotDetails | null; onClose: () => void }) {
  const [entry, setEntry] = useState<CodexDictionaryEntry | null>(null);
  const [isLoadingEntry, setIsLoadingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadEntry = async () => {
      if (!details) {
        setEntry(null);
        setEntryError(null);
        setIsLoadingEntry(false);
        return;
      }

      if (!details.slot.lemma) {
        setEntry(null);
        setEntryError('No dictionary details are available for this word yet.');
        return;
      }

      try {
        setIsLoadingEntry(true);
        setEntryError(null);
        const word = await getDictionaryWord(details.slot.lemma);

        if (!isMounted) {
          return;
        }

        const senses = extractDictionarySenses(word.definitions);
        const fallbackDefinition = extractDefinitionFromDefinitions(word.definitions);

        setEntry({
          lemma: word.lemma ?? details.slot.lemma,
          phoneticText: extractPhoneticText(word.phonetics),
          partsOfSpeech: extractPartsOfSpeechFromDefinitions(word.definitions),
          senses: senses.length > 0
            ? senses
            : fallbackDefinition
              ? [{ definition: fallbackDefinition, examples: [] }]
              : [],
          synonyms: extractSynonymsFromDefinitions(word.definitions),
        });
      } catch {
        if (isMounted) {
          setEntry(null);
          setEntryError('Could not load dictionary details for this word right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingEntry(false);
        }
      }
    };

    void loadEntry();

    return () => {
      isMounted = false;
    };
  }, [details]);

  if (!details) {
    return null;
  }

  const rarity = normalizeRarityTier(details.slot.rarityTier);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="w-full max-w-xl rounded-t-[32px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,255,0.96))] shadow-[0_26px_60px_rgba(15,23,42,0.22)] sm:max-w-2xl sm:rounded-[32px]">
        <div className="flex items-center justify-end px-5 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#7B8794] transition-colors hover:bg-[rgba(36,52,71,0.06)]"
            aria-label="Close dictionary details"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-5 pb-5 sm:px-6 sm:pb-6">
          <div className={`rounded-[24px] border p-5 ${rarity === 'MYTHIC'
            ? 'border-[#B084F5] bg-[radial-gradient(circle_at_top,#fef7ff_0%,#f7f1ff_34%,#eef6ff_68%,#fdfdfd_100%)] shadow-[0_0_0_1px_rgba(176,132,245,0.18),0_10px_26px_rgba(176,132,245,0.12)]'
            : rarity === 'RARE'
              ? 'border-[#D6A332] bg-[radial-gradient(circle_at_top,#fffaf0_0%,#fff2d6_44%,#fffdf8_100%)] shadow-[0_0_0_1px_rgba(214,163,50,0.16),0_10px_24px_rgba(214,163,50,0.10)]'
              : rarity === 'UNCOMMON'
                ? 'border-[#7FB7FF] bg-[radial-gradient(circle_at_top,#f8fbff_0%,#eef5ff_46%,#fcfdff_100%)] shadow-[0_0_0_1px_rgba(127,183,255,0.16),0_10px_24px_rgba(127,183,255,0.10)]'
                : 'border-[rgba(36,52,71,0.10)] bg-white'} overflow-hidden`}
          >
            <div className="h-full overflow-hidden rounded-[20px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(248,250,255,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <div className="max-h-[68vh] overflow-y-auto px-5 py-4">
                <div className="flex items-start justify-between gap-4 border-b border-[rgba(36,52,71,0.08)] pb-4">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[#6C757D]">Dictionary entry</p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#23324A]">
                      {entry?.lemma ?? details.slot.lemma ?? 'Captured word'}
                    </h2>
                    {isLoadingEntry ? (
                      <div className="mt-3 h-5 w-32 rounded-full bg-[#EEF3F7]" />
                    ) : (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-[#5A6678]">
                        {entry?.phoneticText ? (
                          <span className="font-medium italic text-[#4B5E77]">/{entry.phoneticText}/</span>
                        ) : null}
                        {entry?.partsOfSpeech?.[0] ? (
                          <span className="rounded-full bg-white/70 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#516275]">
                            {entry.partsOfSpeech[0]}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${rarityBadgeClassNames[rarity]}`}>
                      {rarity}
                    </span>
                    <span className="rounded-full border border-[rgba(36,52,71,0.08)] bg-white/80 px-3 py-1 text-xs font-medium text-[#5F6C79]">
                      {formatCapturedDate(details.slot.capturedAt)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-[rgba(36,52,71,0.08)] bg-white/72 p-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[#7B8794]">Board slot</p>
                  <p className="mt-2 text-sm font-semibold text-[#23324A]">
                    Page {details.pageNumber}, Slot {details.slot.slotNumber}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#6C757D]">Definitions</p>
                  {isLoadingEntry ? (
                    <div className="mt-3 space-y-3">
                      {Array.from({ length: 3 }, (_, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="mt-1 h-4 w-4 rounded-full bg-[#EEF3F7]" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 rounded-full bg-[#EEF3F7]" />
                            <div className="h-3 w-5/6 rounded-full bg-[#F4F7FA]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : entryError ? (
                    <p className="mt-3 text-sm leading-relaxed text-[#5B687A]">{entryError}</p>
                  ) : entry && entry.senses.length > 0 ? (
                    <div className="mt-3 space-y-4">
                      {entry.senses.map((sense, index) => (
                        <div key={`${sense.definition}-${index}`} className="flex gap-3">
                          <span className="pt-0.5 text-sm font-semibold text-[#7A5E2A]">{index + 1}.</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-relaxed text-[#23324A]">{sense.definition}</p>
                            {sense.examples.length > 0 ? (
                              <ul className="mt-2 space-y-1 text-sm italic text-[#5B687A]">
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
                  ) : (
                    <p className="mt-3 text-sm leading-relaxed text-[#5B687A]">No definitions available right now.</p>
                  )}
                </div>

                <div className="mt-5 border-t border-[rgba(36,52,71,0.08)] pt-4">
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[#6C757D]">Synonyms</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#2C3E50]">
                    {isLoadingEntry ? 'Loading synonyms...' : entry && entry.synonyms.length > 0 ? entry.synonyms.join(', ') : 'No synonyms available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1 rounded-full" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CodexSlotCard({
  pageNumber,
  slot,
  onSelect,
}: {
  pageNumber: number;
  slot: CodexBoardSlotDTO;
  onSelect: (details: CapturedSlotDetails) => void;
}) {
  if (!slot.isCaptured) {
    return (
      <div className="group relative aspect-[0.88] overflow-hidden rounded-[22px] border border-[rgba(36,52,71,0.09)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(244,248,252,0.96))] p-2.5 shadow-[0_12px_28px_rgba(15,23,42,0.04),inset_0_1px_0_rgba(255,255,255,0.82)] sm:p-3">
        <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-dashed border-[rgba(36,52,71,0.14)] bg-[linear-gradient(180deg,rgba(251,252,255,0.98),rgba(242,246,250,0.94))]">
          <div className="flex flex-1 items-center justify-center px-3 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(36,52,71,0.08)] bg-white/90 shadow-[0_8px_18px_rgba(15,23,42,0.05)] sm:h-12 sm:w-12">
              <LockKeyhole size={16} className="text-[#7B8794]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const rarity = normalizeRarityTier(slot.rarityTier);

  return (
    <button
      type="button"
      onClick={() => onSelect({ pageNumber, slot })}
      className={`group relative aspect-[0.88] overflow-hidden rounded-[22px] border bg-gradient-to-br p-2.5 text-left shadow-[0_12px_24px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_30px_rgba(15,23,42,0.12)] sm:p-3 ${rarityGlowClassNames[rarity]} ${
        rarity === 'MYTHIC'
          ? 'border-[rgba(176,132,245,0.24)]'
          : rarity === 'RARE'
            ? 'border-[rgba(199,134,46,0.20)]'
            : rarity === 'UNCOMMON'
              ? 'border-[rgba(75,147,209,0.18)]'
              : 'border-[rgba(36,52,71,0.08)]'
      }`}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[18px] border border-white/70 bg-white/86 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
        <div className="flex h-full items-center px-3 py-3 sm:px-4">
          <p className="line-clamp-3 text-[0.98rem] font-semibold tracking-[-0.04em] text-[#22324A] sm:text-[1.06rem]">
            {slot.lemma}
          </p>
        </div>
      </div>
    </button>
  );
}

function BoardNavigationButton({
  direction,
  disabled,
  onClick,
}: {
  direction: 'previous' | 'next';
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight;
  const label = direction === 'previous' ? 'Previous page' : 'Next page';

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text shadow-[0_14px_28px_rgba(15,23,42,0.08)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:h-14 sm:w-14"
    >
      <Icon size={22} />
    </button>
  );
}

export default function Codex() {
  const navigate = useNavigate();
  const { pageNumber: pageNumberParam } = useParams();
  const [board, setBoard] = useState<CodexBoardResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<CapturedSlotDetails | null>(null);
  const [navigationDirection, setNavigationDirection] = useState<1 | -1>(1);
  const previousPageNumberRef = useRef<number>(1);

  useEffect(() => {
    let isMounted = true;

    const loadBoard = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const nextBoard = await getCodexBoard();

        if (isMounted) {
          setBoard(nextBoard);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Could not load your Codex board right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBoard();

    return () => {
      isMounted = false;
    };
  }, []);

  const pages = useMemo(() => buildBoardPages(board), [board]);
  const parsedPageNumber = pageNumberParam ? Number(pageNumberParam) : 1;
  const isValidRoutePage = Number.isInteger(parsedPageNumber) && parsedPageNumber >= 1 && parsedPageNumber <= PAGE_COUNT;
  const currentPageNumber = isValidRoutePage ? parsedPageNumber : 1;
  const selectedPage = pages.find((page) => page.pageNumber === currentPageNumber) ?? pages[0];
  const totalWords = board?.totalWords ?? PAGE_COUNT * SLOTS_PER_PAGE;
  const capturedWords = board?.capturedWords ?? pages.reduce((sum, page) => sum + page.capturedCount, 0);
  const completionPercentage = board?.completionPercentage ?? (totalWords > 0 ? (capturedWords / totalWords) * 100 : 0);

  useEffect(() => {
    if (pageNumberParam && !isValidRoutePage) {
      navigate('/codex/page/1', { replace: true });
    }
  }, [isValidRoutePage, navigate, pageNumberParam]);

  useEffect(() => {
    const previousPageNumber = previousPageNumberRef.current;

    if (currentPageNumber !== previousPageNumber) {
      setNavigationDirection(currentPageNumber > previousPageNumber ? 1 : -1);
      previousPageNumberRef.current = currentPageNumber;
    }
  }, [currentPageNumber]);

  useEffect(() => {
    setSelectedSlot(null);
  }, [currentPageNumber]);

  const handlePageChange = (pageNumber: number) => {
    setNavigationDirection(pageNumber > currentPageNumber ? 1 : -1);
    navigate(`/codex/page/${pageNumber}`);
  };

  const pageEnterState = {
    opacity: 0,
    x: navigationDirection > 0 ? 96 : -96,
    scale: 0.96,
    rotateY: navigationDirection > 0 ? -8 : 8,
  };

  const pageExitState = {
    opacity: 0,
    x: navigationDirection > 0 ? -96 : 96,
    scale: 0.97,
    rotateY: navigationDirection > 0 ? 8 : -8,
  };

  return (
    <div className="page-bg-radial min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-[92rem] px-6 py-4 sm:px-8 sm:py-6">
        <header className="rounded-[30px] border border-border bg-surface p-4 shadow-[0_20px_48px_rgba(15,23,42,0.07)] sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-text-subtle">{board?.volume ?? 'Volume 1'}</p>
              <h1 className="mt-2 text-[1.8rem] font-semibold tracking-[-0.07em] text-text sm:text-[2.2rem]">Codex</h1>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-text-muted">
                Try to find all the hidden words and fill the board one page at a time.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-soft shadow-[0_10px_24px_rgba(76,167,132,0.12)]">
              <BookOpen size={24} className="text-brand-strong" />
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-border bg-[linear-gradient(135deg,var(--color-surface-alt)_0%,var(--color-brand-soft)_54%,var(--color-accent-soft)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-text-subtle">Overall progression</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-text">
                  {capturedWords} / {totalWords}
                </p>
              </div>
              <div className="rounded-full border border-border bg-surface/88 px-4 py-2 text-sm font-semibold text-brand-strong shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                {formatPercent(completionPercentage)} complete
              </div>
            </div>

            <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface/75">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </header>

        <main className="mt-6">
          {isLoading ? (
            <BoardSkeleton />
          ) : errorMessage ? (
            <div className="rounded-[32px] border border-border bg-surface p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft">
                <Star size={24} className="text-danger" />
              </div>
              <p className="mt-5 text-lg font-medium text-text">{errorMessage}</p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                The board should still feel stable, so this state keeps the Codex framing instead of dropping you into a blank screen.
              </p>
              <Button className="mt-5 rounded-full px-6" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          ) : selectedPage ? (
            <section className="rounded-[36px] border border-border bg-surface p-5 shadow-[0_24px_54px_rgba(15,23,42,0.08)] sm:p-7">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.26em] text-text-subtle">
                  Page {selectedPage.pageNumber} of {PAGE_COUNT}
                </p>
              </div>

              <div className="mt-8 flex items-center justify-center gap-3 lg:grid lg:grid-cols-[4.5rem_minmax(48rem,64rem)_4.5rem] lg:gap-5">
                <BoardNavigationButton
                  direction="previous"
                  disabled={selectedPage.pageNumber === 1}
                  onClick={() => handlePageChange(selectedPage.pageNumber - 1)}
                />

                <div className="relative w-full max-w-[42rem] overflow-hidden rounded-[30px] sm:max-w-[46rem] lg:max-w-none">
                  <AnimatePresence custom={navigationDirection} initial={false} mode="wait">
                    <motion.div
                      key={selectedPage.pageNumber}
                      custom={navigationDirection}
                      initial={pageEnterState}
                      animate={{
                        opacity: 1,
                        x: 0,
                        scale: 1,
                        rotateY: 0,
                      }}
                      exit={pageExitState}
                      transition={{
                        duration: 0.34,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="w-full rounded-[30px] border border-border bg-[linear-gradient(180deg,var(--color-surface-alt)_0%,var(--color-surface)_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_18px_36px_rgba(15,23,42,0.06)] sm:p-6"
                      style={{ transformPerspective: 1400 }}
                    >
                      <div className="grid grid-cols-5 gap-4 sm:gap-5">
                        {selectedPage.slots.slice(0, SLOTS_PER_PAGE).map((slot) => (
                          <CodexSlotCard
                            key={slot.slotNumber}
                            pageNumber={selectedPage.pageNumber}
                            slot={slot}
                            onSelect={setSelectedSlot}
                          />
                        ))}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                <BoardNavigationButton
                  direction="next"
                  disabled={selectedPage.pageNumber === PAGE_COUNT}
                  onClick={() => handlePageChange(selectedPage.pageNumber + 1)}
                />
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <CapturedSlotModal details={selectedSlot} onClose={() => setSelectedSlot(null)} />
      <BottomNav />
    </div>
  );
}
