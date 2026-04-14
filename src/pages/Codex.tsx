import { useDeferredValue, useEffect, useState } from 'react';
import { BookOpen, Search, Sparkles, Star, Volume2, X } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import {
  extractDefinitionFromDefinitions,
  extractPartsOfSpeechFromDefinitions,
  extractPhoneticText,
  extractSynonymsFromDefinitions,
  getCodexEntries,
  type CodexEntryReadResponseDTO,
  normalizeRarityTier,
  type RarityTier,
} from '../api/api';

type RarityFilter = 'ALL' | RarityTier;
type SortOption = 'NEWEST' | 'ALPHABETICAL' | 'HIGHEST_XP' | 'RAREST' | 'PART_OF_SPEECH';

const rarityOptions: { id: RarityFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'MYTHIC', label: 'Mythic' },
  { id: 'RARE', label: 'Rare' },
  { id: 'UNCOMMON', label: 'Uncommon' },
  { id: 'COMMON', label: 'Common' },
];

const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'NEWEST', label: 'Newest first' },
  { id: 'RAREST', label: 'Rarest first' },
  { id: 'HIGHEST_XP', label: 'Highest XP' },
  { id: 'ALPHABETICAL', label: 'A-Z' },
  { id: 'PART_OF_SPEECH', label: 'Part of speech' },
];

const getRarityTier = (word: CodexEntryReadResponseDTO): RarityTier => normalizeRarityTier(word.rarityTier);

const getRarityBadgeClassName = (rarity: RarityTier) => {
  if (rarity === 'MYTHIC') {
    return 'border border-transparent bg-[linear-gradient(135deg,#FF7A59_0%,#FFD866_22%,#6DE7C8_44%,#8BE8FF_64%,#B084F5_82%,#FF7A59_100%)] text-white shadow-[0_10px_24px_rgba(176,132,245,0.28)]';
  }

  if (rarity === 'RARE') {
    return 'bg-[#FFF2D6] text-[#A36F00] border border-[rgba(199,134,46,0.18)]';
  }

  if (rarity === 'UNCOMMON') {
    return 'bg-[#E8F1FF] text-[#356A9A] border border-[rgba(75,147,209,0.16)]';
  }

  return 'bg-[#F1F3F5] text-[#5C6770] border border-[rgba(92,103,112,0.14)]';
};

const getRarityCardAccentClassName = (rarity: RarityTier) => {
  if (rarity === 'MYTHIC') {
    return 'from-[#FFF6F3] via-[#FFF7D6] via-[35%] to-[#F4EEFF] border-[rgba(176,132,245,0.24)]';
  }

  if (rarity === 'RARE') {
    return 'from-[#FFF9EC] to-[#FFF2D6] border-[rgba(199,134,46,0.22)]';
  }

  if (rarity === 'UNCOMMON') {
    return 'from-[#F4F9FF] to-[#E8F1FF] border-[rgba(75,147,209,0.18)]';
  }

  return 'from-[#FFFFFF] to-[#F6F7F9] border-[rgba(0,0,0,0.06)]';
};

const getSpecificOrFallbackDefinition = (word: CodexEntryReadResponseDTO) => {
  return word.specificDefinition || extractDefinitionFromDefinitions(word.definitions) || 'No definition available yet.';
};

const getPartsOfSpeech = (word: CodexEntryReadResponseDTO) => {
  return extractPartsOfSpeechFromDefinitions(word.definitions);
};

const formatCreatedDate = (createdAt: string) => {
  const parsed = new Date(createdAt);

  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getSortWeight = (rarity: RarityTier) => {
  if (rarity === 'MYTHIC') {
    return 4;
  }

  if (rarity === 'RARE') {
    return 3;
  }

  if (rarity === 'UNCOMMON') {
    return 2;
  }

  return 1;
};

interface CodexWordDetailsProps {
  word: CodexEntryReadResponseDTO | null;
  onClose: () => void;
}

function CodexWordDetails({ word, onClose }: CodexWordDetailsProps) {
  if (!word) {
    return null;
  }

  const rarity = getRarityTier(word);
  const phoneticText = extractPhoneticText(word.phonetics);
  const synonyms = extractSynonymsFromDefinitions(word.definitions);
  const definition = getSpecificOrFallbackDefinition(word);
  const partsOfSpeech = getPartsOfSpeech(word);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div
        className="bg-white rounded-t-[32px] sm:rounded-[32px] w-full max-w-md shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="codex-word-title"
      >
        <div className="sticky top-0 bg-white border-b border-[rgba(0,0,0,0.05)] px-6 py-4 rounded-t-[32px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#7B8794]">Codex Entry</p>
              <h2 id="codex-word-title" className="text-2xl font-semibold text-[#2C3E50] mt-1">
                {word.lemma}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-[#F0F2F5] flex items-center justify-center transition-colors"
              aria-label="Close codex entry details"
            >
              <X size={20} className="text-[#6C757D]" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 max-h-[78vh] overflow-y-auto space-y-5">
          <div
            className={`rounded-[24px] border bg-gradient-to-br p-5 ${getRarityCardAccentClassName(rarity)}`}
            style={
              rarity === 'MYTHIC'
                ? {
                    backgroundImage:
                      'linear-gradient(135deg, rgba(255,122,89,0.18) 0%, rgba(255,216,102,0.16) 22%, rgba(109,231,200,0.15) 44%, rgba(139,232,255,0.16) 64%, rgba(176,132,245,0.18) 82%, rgba(255,122,89,0.16) 100%)',
                  }
                : undefined
            }
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-[#6C757D]">
                  {word.sourceSessionId != null ? `Saved from session #${word.sourceSessionId}` : 'Saved to your codex'}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getRarityBadgeClassName(rarity)}`}>
                    {rarity}
                  </span>
                  <span className="text-sm text-[#52606D]">{formatCreatedDate(word.createdAt)}</span>
                </div>
              </div>
              <div className="rounded-[18px] bg-white/70 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.18em] text-[#7B8794]">XP</p>
                <p className="text-xl font-semibold text-[#2C3E50]">{word.xpValue ?? 0}</p>
              </div>
            </div>

            {phoneticText ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-sm text-[#52606D]">
                <Volume2 size={14} />
                <span>{phoneticText}</span>
              </div>
            ) : null}
          </div>

          <section>
            <p className="text-xs uppercase tracking-[0.22em] text-[#7B8794]">Definition</p>
            <p className="text-sm text-[#2C3E50] mt-2 leading-relaxed">{definition}</p>
          </section>

          {partsOfSpeech.length > 0 ? (
            <section>
              <div className="flex flex-wrap gap-2">
                {partsOfSpeech.map((partOfSpeech) => (
                  <span
                    key={partOfSpeech}
                    className="px-3 py-1.5 rounded-full bg-[#EEF3F8] text-sm text-[#52606D] border border-[rgba(0,0,0,0.06)]"
                  >
                    {partOfSpeech}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {synonyms.length > 0 ? (
            <section>
              <p className="text-xs uppercase tracking-[0.22em] text-[#7B8794]">Synonyms</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {synonyms.slice(0, 10).map((synonym) => (
                  <span
                    key={synonym}
                    className="px-3 py-1.5 rounded-full bg-[#F4F6F8] text-sm text-[#52606D] border border-[rgba(0,0,0,0.06)]"
                  >
                    {synonym}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] bg-[#F8F9FA] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7B8794]">Source</p>
              <p className="text-sm text-[#2C3E50] mt-2">{word.source || 'Unknown source'}</p>
            </div>
            <div className="rounded-[20px] bg-[#F8F9FA] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#7B8794]">Rarity Score</p>
              <p className="text-sm text-[#2C3E50] mt-2">
                {word.rarityScore != null ? word.rarityScore.toFixed(2) : 'N/A'}
              </p>
            </div>
          </section>

          <Button className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Codex() {
  const [codexEntries, setCodexEntries] = useState<CodexEntryReadResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [selectedWord, setSelectedWord] = useState<CodexEntryReadResponseDTO | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    let isMounted = true;

    const loadCodexEntries = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const entries = await getCodexEntries();

        if (isMounted) {
          setCodexEntries(entries);
        }
      } catch (error) {
        console.error('Error loading codex entries:', error);

        if (isMounted) {
          setErrorMessage('Could not load your codex right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCodexEntries();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
  const totalXp = codexEntries.reduce((sum, word) => sum + Math.max(0, word.xpValue ?? 0), 0);
  const mythicCount = codexEntries.filter((word) => getRarityTier(word) === 'MYTHIC').length;
  const rareCount = codexEntries.filter((word) => getRarityTier(word) === 'RARE').length;
  const uncommonCount = codexEntries.filter((word) => getRarityTier(word) === 'UNCOMMON').length;
  const commonCount = codexEntries.filter((word) => getRarityTier(word) === 'COMMON').length;

  const filteredWords = codexEntries
    .filter((word) => {
      const rarity = getRarityTier(word);
      const definition = getSpecificOrFallbackDefinition(word).toLowerCase();
      const source = (word.source ?? '').toLowerCase();
      const partsOfSpeech = getPartsOfSpeech(word).join(' ').toLowerCase();
      const matchesFilter = rarityFilter === 'ALL' || rarity === rarityFilter;
      const matchesSearch = !normalizedQuery
        || word.lemma.toLowerCase().includes(normalizedQuery)
        || definition.includes(normalizedQuery)
        || source.includes(normalizedQuery)
        || partsOfSpeech.includes(normalizedQuery);

      return matchesFilter && matchesSearch;
    })
    .sort((left, right) => {
      if (sortBy === 'ALPHABETICAL') {
        return left.lemma.localeCompare(right.lemma);
      }

      if (sortBy === 'HIGHEST_XP') {
        return (right.xpValue ?? 0) - (left.xpValue ?? 0);
      }

      if (sortBy === 'RAREST') {
        const rarityDifference = getSortWeight(getRarityTier(right)) - getSortWeight(getRarityTier(left));

        if (rarityDifference !== 0) {
          return rarityDifference;
        }

        return (right.rarityScore ?? 0) - (left.rarityScore ?? 0);
      }

      if (sortBy === 'PART_OF_SPEECH') {
        const leftPartOfSpeech = getPartsOfSpeech(left)[0] ?? 'zzzz';
        const rightPartOfSpeech = getPartsOfSpeech(right)[0] ?? 'zzzz';
        const comparison = leftPartOfSpeech.localeCompare(rightPartOfSpeech);

        if (comparison !== 0) {
          return comparison;
        }

        return left.lemma.localeCompare(right.lemma);
      }

      const leftTime = new Date(left.createdAt).getTime();
      const rightTime = new Date(right.createdAt).getTime();
      return rightTime - leftTime;
    });

  return (
    <div className="min-h-screen bg-[#F6F8F7] pb-20">
      <div className="bg-white/88 border-b border-[rgba(0,0,0,0.08)] backdrop-blur-sm">
        <div className="max-w-[480px] mx-auto px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#2C3E50]">Codex</h1>
              <p className="text-sm text-[#6C757D] mt-1">Every word you have saved, organized and searchable.</p>
            </div>
            <div className="w-12 h-12 rounded-[18px] bg-[#FFF0E1] flex items-center justify-center shadow-[0_6px_18px_rgba(255,208,163,0.28)]">
              <BookOpen size={22} className="text-[#B35C1E]" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-b border-[rgba(0,0,0,0.06)] bg-[#F6F8F7]/92 backdrop-blur-md">
        <div className="max-w-[480px] mx-auto px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[22px] bg-gradient-to-br from-[#FFF5EB] to-[#FFE6CF] p-4 border border-[rgba(255,186,122,0.26)]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#9A6A43]">Saved</p>
              <p className="text-2xl font-semibold text-[#2C3E50] mt-2">{codexEntries.length}</p>
            </div>
            <div className="rounded-[22px] bg-gradient-to-br from-[#EDF9F3] to-[#DDF4EC] p-4 border border-[rgba(61,163,122,0.22)]">
              <p className="text-xs uppercase tracking-[0.18em] text-[#477A65]">Total XP</p>
              <p className="text-2xl font-semibold text-[#2C3E50] mt-2">{totalXp}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 sm:grid-cols-4">
            <div className="rounded-[18px] bg-white p-3 border border-[rgba(0,0,0,0.05)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7B8794]">Mythic</p>
              <p className="text-lg font-semibold text-[#2C3E50] mt-1">{mythicCount}</p>
            </div>
            <div className="rounded-[18px] bg-white p-3 border border-[rgba(0,0,0,0.05)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7B8794]">Rare</p>
              <p className="text-lg font-semibold text-[#2C3E50] mt-1">{rareCount}</p>
            </div>
            <div className="rounded-[18px] bg-white p-3 border border-[rgba(0,0,0,0.05)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7B8794]">Uncommon</p>
              <p className="text-lg font-semibold text-[#2C3E50] mt-1">{uncommonCount}</p>
            </div>
            <div className="rounded-[18px] bg-white p-3 border border-[rgba(0,0,0,0.05)]">
              <p className="text-xs uppercase tracking-[0.16em] text-[#7B8794]">Common</p>
              <p className="text-lg font-semibold text-[#2C3E50] mt-1">{commonCount}</p>
            </div>
          </div>

          <div className="relative mt-5">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7B8794]" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search words, definitions, or source"
              className="w-full pl-11 pr-4 py-3 rounded-[18px] bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] focus:outline-none focus:ring-2 focus:ring-[#FFD6B1] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
            {rarityOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setRarityFilter(option.id)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all duration-200 ${
                  rarityFilter === option.id
                    ? 'bg-[#2C3E50] text-white shadow-[0_6px_16px_rgba(44,62,80,0.18)]'
                    : 'bg-white text-[#52606D] border border-[rgba(0,0,0,0.08)]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <label htmlFor="codex-sort" className="block text-xs uppercase tracking-[0.16em] text-[#7B8794] mb-2">
              Sort By
            </label>
            <select
              id="codex-sort"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortOption)}
              className="w-full px-4 py-3 rounded-[18px] bg-white border border-[rgba(0,0,0,0.08)] text-[#2C3E50] focus:outline-none focus:ring-2 focus:ring-[#FFD6B1] focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-[480px] mx-auto px-6 py-6">
        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-[#6C757D] text-lg">Loading your codex...</p>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-16">
            <p className="text-[#FF6B6B] text-lg">{errorMessage}</p>
            <p className="text-sm text-[#6C757D] mt-2">Check backend connection and try again.</p>
          </div>
        ) : codexEntries.length === 0 ? (
          <div className="rounded-[28px] bg-white border border-[rgba(0,0,0,0.05)] p-8 text-center shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="w-16 h-16 mx-auto rounded-[22px] bg-[#FFF0E1] flex items-center justify-center">
              <Sparkles size={28} className="text-[#B35C1E]" />
            </div>
            <p className="text-[#2C3E50] text-lg font-medium mt-5">No codex entries yet</p>
            <p className="text-sm text-[#6C757D] mt-2 leading-relaxed">
              Start a reading session and use word lookup to begin building your Codex.
            </p>
          </div>
        ) : filteredWords.length === 0 ? (
          <div className="rounded-[28px] bg-white border border-[rgba(0,0,0,0.05)] p-8 text-center shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
            <div className="w-16 h-16 mx-auto rounded-[22px] bg-[#EEF5F2] flex items-center justify-center">
              <Search size={26} className="text-[#326B59]" />
            </div>
            <p className="text-[#2C3E50] text-lg font-medium mt-5">No matches found</p>
            <p className="text-sm text-[#6C757D] mt-2 leading-relaxed">
              Try another search term or clear your rarity filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWords.map((word) => {
              const rarity = getRarityTier(word);
              const definition = getSpecificOrFallbackDefinition(word);
              const partsOfSpeech = getPartsOfSpeech(word);

              return (
                <button
                  key={word.id}
                  type="button"
                  onClick={() => setSelectedWord(word)}
                  className={`w-full text-left rounded-[26px] border bg-gradient-to-br p-5 shadow-[0_8px_22px_rgba(15,23,42,0.05)] transition-all duration-200 hover:-translate-y-0.5 ${getRarityCardAccentClassName(rarity)}`}
                  style={
                    rarity === 'MYTHIC'
                      ? {
                          backgroundImage:
                            'linear-gradient(135deg, rgba(255,122,89,0.18) 0%, rgba(255,216,102,0.17) 22%, rgba(109,231,200,0.15) 44%, rgba(139,232,255,0.17) 64%, rgba(176,132,245,0.18) 82%, rgba(255,122,89,0.16) 100%)',
                        }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg font-semibold text-[#2C3E50] break-words">{word.lemma}</h2>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${getRarityBadgeClassName(rarity)}`}>
                          {rarity}
                        </span>
                        {partsOfSpeech.map((partOfSpeech) => (
                          <span
                            key={partOfSpeech}
                            className="text-xs px-3 py-1 rounded-full font-medium bg-[#EEF3F8] text-[#52606D] border border-[rgba(0,0,0,0.06)]"
                          >
                            {partOfSpeech}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-[#52606D] mt-1">{formatCreatedDate(word.createdAt)}</p>
                    </div>
                    <div className="rounded-[18px] bg-white/80 px-3 py-2 flex items-center gap-2 shrink-0">
                      <Star size={14} className="text-[#D9923B]" />
                      <span className="text-sm font-medium text-[#2C3E50]">{word.xpValue ?? 0} XP</span>
                    </div>
                  </div>

                  <p className="text-sm text-[#2C3E50] mt-4 leading-relaxed line-clamp-3">
                    {definition}
                  </p>

                  <div className="flex items-center justify-between gap-3 mt-4 text-sm text-[#52606D]">
                    <span className="truncate">Source: {word.source || 'Unknown source'}</span>
                    <span className="shrink-0">
                      {word.sourceSessionId != null ? `Session #${word.sourceSessionId}` : 'No session source'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
      <CodexWordDetails word={selectedWord} onClose={() => setSelectedWord(null)} />
    </div>
  );
}
