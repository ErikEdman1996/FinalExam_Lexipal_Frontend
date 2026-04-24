import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, LockKeyhole, Star, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useNavigate, useParams } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../components/dialog/AppDialog';
import { formatShortDate } from '../utils/formatting';
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
  COMMON: 'border border-border bg-surface-muted text-text-muted',
  UNCOMMON: 'border border-brand/20 bg-brand-soft text-brand-strong',
  RARE: 'border border-accent/25 bg-accent-soft text-accent-strong',
  MYTHIC:
    'border border-transparent bg-[linear-gradient(135deg,var(--color-brand)_0%,var(--color-accent)_100%)] text-text-on-brand shadow-[0_10px_22px_rgba(154,74,66,0.18)]',
};

const rarityTileClassNames: Record<RarityTier, string> = {
  COMMON: 'border-border bg-[linear-gradient(180deg,var(--color-surface)_0%,var(--color-surface-alt)_100%)]',
  UNCOMMON: 'border-brand/25 bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-brand-soft)_100%)]',
  RARE: 'border-accent/30 bg-[linear-gradient(135deg,var(--color-surface)_0%,var(--color-accent-soft)_100%)]',
  MYTHIC:
    'border-brand/35 bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-surface)_46%,var(--color-accent-soft)_100%)]',
};

const rarityMarkerClassNames: Record<RarityTier, string> = {
  COMMON: 'bg-text-subtle',
  UNCOMMON: 'bg-brand',
  RARE: 'bg-accent',
  MYTHIC: 'bg-[linear-gradient(180deg,var(--color-brand)_0%,var(--color-accent)_100%)]',
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

  return formatShortDate(value);
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
    <section className="rounded-[32px] border border-border bg-surface p-4 shadow-[0_18px_42px_rgba(31,41,55,0.07)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="h-3 w-28 rounded-full bg-surface-muted" />
          <div className="mt-3 h-7 w-40 rounded-full bg-surface-alt" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-full bg-surface-alt" />
          <div className="h-10 w-10 rounded-full bg-surface-alt" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-6 gap-2 sm:grid-cols-12">
        {Array.from({ length: PAGE_COUNT }, (_, index) => (
          <div key={index} className="h-2.5 rounded-full bg-surface-muted" />
        ))}
      </div>

      <div className="mx-auto mt-7 max-w-[43rem] rounded-[26px] border border-border bg-surface-alt p-3 sm:p-5">
        <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
          {Array.from({ length: SLOTS_PER_PAGE }, (_, index) => (
            <div key={index} className="aspect-square rounded-[18px] bg-surface-muted" />
          ))}
        </div>
      </div>
    </section>
  );
}

function CodexStatTile({
  label,
  value,
  detail,
  tone = 'muted',
}: {
  label: string;
  value: ReactNode;
  detail: string;
  tone?: 'brand' | 'accent' | 'muted';
}) {
  const toneClassName = tone === 'brand'
    ? 'bg-brand-soft text-brand-strong'
    : tone === 'accent'
      ? 'bg-accent-soft text-accent-strong'
      : 'bg-surface-muted text-text-muted';

  return (
    <div className="rounded-[24px] border border-border bg-surface p-4 shadow-[0_12px_26px_rgba(31,41,55,0.05)]">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.22em] text-text-subtle">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-text">{value}</p>
      <span className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClassName}`}>
        {detail}
      </span>
    </div>
  );
}

function PageStrip({
  pages,
  currentPageNumber,
  onPageChange,
}: {
  pages: CodexBoardPageDTO[];
  currentPageNumber: number;
  onPageChange: (pageNumber: number) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-2 sm:grid-cols-12" aria-label="Codex pages">
      {pages.map((page) => {
        const isActive = page.pageNumber === currentPageNumber;
        const hasCaptures = page.capturedCount > 0;

        return (
          <button
            key={page.pageNumber}
            type="button"
            aria-label={`Go to Codex page ${page.pageNumber}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onPageChange(page.pageNumber)}
            className={`h-3 rounded-full transition-[background-color,transform,box-shadow] duration-200 hover:scale-y-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              isActive
                ? 'bg-brand shadow-[0_8px_18px_rgba(154,74,66,0.24)]'
                : hasCaptures
                  ? 'bg-accent-soft hover:bg-accent'
                  : 'bg-surface-muted hover:bg-border-strong'
            }`}
          />
        );
      })}
    </div>
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
    <AppDialog
      isOpen={details != null}
      onClose={onClose}
      contentClassName="w-full max-w-xl overflow-hidden rounded-t-[32px] border border-border bg-surface shadow-[0_26px_60px_rgba(15,23,42,0.22)] sm:max-w-2xl sm:rounded-[32px]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
        <div className="min-w-0">
          <p className="text-[0.68rem] font-medium uppercase tracking-[0.24em] text-text-subtle">
            Dictionary entry
          </p>
          <AppDialogTitle className="mt-2 truncate text-3xl font-semibold tracking-[-0.04em] text-text">
            {entry?.lemma ?? details.slot.lemma ?? 'Captured word'}
          </AppDialogTitle>
        </div>
        <AppDialogClose asChild>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Close dictionary details"
          >
            <X size={18} />
          </button>
        </AppDialogClose>
      </div>

      <div className="max-h-[78vh] overflow-y-auto px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${rarityBadgeClassNames[rarity]}`}>
            {rarity}
          </span>
          <span className="rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-text-muted">
            {formatCapturedDate(details.slot.capturedAt)}
          </span>
          <span className="rounded-full border border-border bg-surface-alt px-3 py-1 text-xs font-medium text-text-muted">
            Page {details.pageNumber}, Slot {details.slot.slotNumber}
          </span>
        </div>

        {isLoadingEntry ? (
          <div className="mt-4 space-y-3">
            <div className="h-4 w-32 rounded-full bg-surface-muted" />
            <div className="h-4 w-24 rounded-full bg-surface-muted" />
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-muted">
            {entry?.phoneticText ? (
              <span className="font-medium italic text-text">/{entry.phoneticText}/</span>
            ) : null}
            {entry?.partsOfSpeech?.[0] ? (
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-text-muted">
                {entry.partsOfSpeech[0]}
              </span>
            ) : null}
          </div>
        )}

        <div className="mt-6 rounded-[24px] border border-border bg-surface-alt p-4 sm:p-5">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-text-subtle">Definitions</p>
          {isLoadingEntry ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex gap-3">
                  <div className="mt-1 h-4 w-4 rounded-full bg-surface-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 rounded-full bg-surface-muted" />
                    <div className="h-3 w-5/6 rounded-full bg-surface-muted" />
                  </div>
                </div>
              ))}
            </div>
          ) : entryError ? (
            <p className="mt-3 text-sm leading-relaxed text-text-muted">{entryError}</p>
          ) : entry && entry.senses.length > 0 ? (
            <div className="mt-4 space-y-4">
              {entry.senses.map((sense, index) => (
                <div key={`${sense.definition}-${index}`} className="flex gap-3">
                  <span className="pt-0.5 text-sm font-semibold text-accent-strong">{index + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm leading-relaxed text-text">{sense.definition}</p>
                    {sense.examples.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-sm italic text-text-muted">
                        {sense.examples.slice(0, 3).map((example) => (
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
        </div>

        <div className="mt-4 rounded-[24px] border border-border bg-surface-alt p-4 sm:p-5">
          <p className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-text-subtle">Synonyms</p>
          <p className="mt-3 break-words text-sm leading-relaxed text-text-muted">
            {isLoadingEntry
              ? 'Loading synonyms...'
              : entry && entry.synonyms.length > 0
                ? entry.synonyms.join(', ')
                : 'No synonyms available.'}
          </p>
        </div>

        <div className="mt-5">
          <Button variant="outline" className="w-full rounded-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </AppDialog>
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
      <div className="relative aspect-square overflow-hidden rounded-[16px] border border-dashed border-border bg-surface-muted p-1.5 sm:rounded-[22px] sm:p-2.5">
        <div className="flex h-full items-center justify-center rounded-[13px] bg-surface/45 sm:rounded-[18px]">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface/80 text-text-subtle shadow-[0_8px_18px_rgba(31,41,55,0.04)] sm:h-10 sm:w-10">
            <LockKeyhole size={15} aria-hidden="true" />
          </div>
          <div className="absolute bottom-2 left-2 right-2 hidden h-1 rounded-full bg-surface sm:block">
            <div className="h-full w-1/4 rounded-full bg-surface-muted" />
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
      className={`group relative aspect-square overflow-hidden rounded-[16px] border p-1.5 text-left shadow-[0_12px_24px_rgba(31,41,55,0.06)] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_30px_rgba(31,41,55,0.10)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface sm:rounded-[22px] sm:p-2.5 ${rarityTileClassNames[rarity]}`}
    >
      <span className={`absolute left-2 top-2 h-2 w-2 rounded-full sm:left-3 sm:top-3 ${rarityMarkerClassNames[rarity]}`} />
      <span className="flex h-full flex-col justify-between rounded-[13px] border border-border bg-surface/86 px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] sm:rounded-[18px] sm:px-3.5 sm:py-4">
        <span className="min-w-0 pt-2 sm:pt-3">
          <span className="line-clamp-3 break-words text-[0.72rem] font-semibold leading-tight tracking-[-0.02em] text-text sm:text-[1rem]">
            {slot.lemma}
          </span>
        </span>
        <span className="hidden text-[0.62rem] font-medium uppercase tracking-[0.16em] text-text-subtle sm:block">
          Slot {slot.slotNumber}
        </span>
      </span>
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
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text shadow-[0_10px_22px_rgba(31,41,55,0.06)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-surface-alt hover:shadow-[0_14px_26px_rgba(31,41,55,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 sm:h-12 sm:w-12"
    >
      <Icon size={21} aria-hidden="true" />
    </button>
  );
}

function BoardAlbum({
  selectedPage,
  navigationDirection,
  shouldReduceMotion,
  onPageChange,
  onSelectSlot,
}: {
  selectedPage: CodexBoardPageDTO;
  navigationDirection: 1 | -1;
  shouldReduceMotion: boolean;
  onPageChange: (pageNumber: number) => void;
  onSelectSlot: (details: CapturedSlotDetails) => void;
}) {
  const pageEnterState = shouldReduceMotion
    ? { opacity: 0 }
    : {
      opacity: 0,
      x: navigationDirection > 0 ? 56 : -56,
      scale: 0.98,
    };

  const pageExitState = shouldReduceMotion
    ? { opacity: 0 }
    : {
      opacity: 0,
      x: navigationDirection > 0 ? -56 : 56,
      scale: 0.98,
    };

  return (
    <div className="mx-auto mt-6 w-full max-w-[46rem] overflow-hidden rounded-[28px] border border-border bg-[linear-gradient(180deg,var(--color-surface-alt)_0%,var(--color-surface)_100%)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] sm:p-5">
      <AnimatePresence custom={navigationDirection} initial={false} mode="wait">
        <motion.div
          key={selectedPage.pageNumber}
          custom={navigationDirection}
          initial={pageEnterState}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={pageExitState}
          transition={shouldReduceMotion ? { duration: 0.01 } : { duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="grid grid-cols-5 gap-2.5 sm:gap-4">
            {selectedPage.slots.slice(0, SLOTS_PER_PAGE).map((slot) => (
              <CodexSlotCard
                key={slot.slotNumber}
                pageNumber={selectedPage.pageNumber}
                slot={slot}
                onSelect={onSelectSlot}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-center gap-3 sm:hidden">
        <BoardNavigationButton
          direction="previous"
          disabled={selectedPage.pageNumber === 1}
          onClick={() => onPageChange(selectedPage.pageNumber - 1)}
        />
        <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-text-muted">
          Page {selectedPage.pageNumber}
        </span>
        <BoardNavigationButton
          direction="next"
          disabled={selectedPage.pageNumber === PAGE_COUNT}
          onClick={() => onPageChange(selectedPage.pageNumber + 1)}
        />
      </div>
    </div>
  );
}

export default function Codex() {
  const navigate = useNavigate();
  const { pageNumber: pageNumberParam } = useParams();
  const prefersReducedMotion = useReducedMotion();
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
  const currentPageTotal = selectedPage?.totalCount ?? SLOTS_PER_PAGE;
  const currentPageCaptured = selectedPage?.capturedCount ?? 0;
  const currentPagePercentage = selectedPage?.completionPercentage
    ?? (currentPageTotal > 0 ? (currentPageCaptured / currentPageTotal) * 100 : 0);
  const shouldReduceMotion = prefersReducedMotion === true;

  useEffect(() => {
    if (pageNumberParam && !isValidRoutePage) {
      void navigate('/codex/page/1', { replace: true });
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
    if (pageNumber < 1 || pageNumber > PAGE_COUNT) {
      return;
    }

    setNavigationDirection(pageNumber > currentPageNumber ? 1 : -1);
    void navigate(`/codex/page/${pageNumber}`);
  };

  return (
    <div className="page-bg-radial min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto max-w-[86rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">
              {board?.volume ?? 'Volume 1'}
            </p>
            <h1 className="mt-2 text-[2.3rem] font-semibold leading-tight tracking-[-0.05em] text-text sm:text-[3rem]">
              Codex
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted sm:text-base">
              Find hidden words and fill the album one page at a time.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-brand-soft shadow-[0_10px_24px_rgba(154,74,66,0.14)]">
            <BookOpen size={25} className="text-brand-strong" aria-hidden="true" />
          </div>
        </header>

        <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CodexStatTile
            label="Captured"
            value={`${capturedWords} / ${totalWords}`}
            detail="Total words"
            tone="brand"
          />
          <CodexStatTile
            label="Current Page"
            value={`${currentPageCaptured} / ${currentPageTotal}`}
            detail={`Page ${currentPageNumber}`}
            tone="accent"
          />
          <CodexStatTile
            label="Completion"
            value={formatPercent(completionPercentage)}
            detail={`${formatPercent(currentPagePercentage)} on this page`}
          />
        </section>

        <div className="mt-4 rounded-full border border-border bg-surface p-2 shadow-[0_10px_22px_rgba(31,41,55,0.05)]">
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

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
            <section className="rounded-[32px] border border-border bg-surface p-4 shadow-[0_18px_42px_rgba(31,41,55,0.07)] sm:p-6 lg:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[0.72rem] font-medium uppercase tracking-[0.26em] text-text-subtle">
                    Page {selectedPage.pageNumber} of {PAGE_COUNT}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-text">
                    {currentPageCaptured} / {currentPageTotal} found
                  </h2>
                </div>

                <div className="hidden items-center gap-2 sm:flex">
                  <BoardNavigationButton
                    direction="previous"
                    disabled={selectedPage.pageNumber === 1}
                    onClick={() => handlePageChange(selectedPage.pageNumber - 1)}
                  />
                  <BoardNavigationButton
                    direction="next"
                    disabled={selectedPage.pageNumber === PAGE_COUNT}
                    onClick={() => handlePageChange(selectedPage.pageNumber + 1)}
                  />
                </div>
              </div>

              <div className="mt-5">
                <PageStrip
                  pages={pages}
                  currentPageNumber={selectedPage.pageNumber}
                  onPageChange={handlePageChange}
                />
              </div>

              <BoardAlbum
                selectedPage={selectedPage}
                navigationDirection={navigationDirection}
                shouldReduceMotion={shouldReduceMotion}
                onPageChange={handlePageChange}
                onSelectSlot={setSelectedSlot}
              />
            </section>
          ) : null}
        </main>
      </div>

      <CapturedSlotModal details={selectedSlot} onClose={() => setSelectedSlot(null)} />
      <BottomNav />
    </div>
  );
}
