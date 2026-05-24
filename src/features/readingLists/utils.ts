import type { ReadingListStatus } from '../../api/api';
import { inputClassName } from '../../components/form/inputStyles';

export const readingListInputClassName = inputClassName;

export const MAX_READING_LIST_GENRES = 10;
export const MAX_READING_LIST_GENRE_LENGTH = 50;

export const normalizeTitleAuthorKey = (title: string, author: string) => {
  return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
};

export const normalizeGenre = (value: string) => {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

export const validateGenreList = (genres: string[]) => {
  if (genres.length > MAX_READING_LIST_GENRES) {
    return `Choose up to ${MAX_READING_LIST_GENRES} genres.`;
  }

  const seen = new Set<string>();

  for (const genre of genres) {
    const trimmed = genre.trim();

    if (!trimmed) {
      return 'Genre cannot be blank.';
    }

    if (trimmed.length > MAX_READING_LIST_GENRE_LENGTH) {
      return `Genres must be ${MAX_READING_LIST_GENRE_LENGTH} characters or fewer.`;
    }

    const normalized = normalizeGenre(trimmed);

    if (seen.has(normalized)) {
      return `Duplicate genre: ${normalized}`;
    }

    seen.add(normalized);
  }

  return null;
};

export const getReadingListStatusLabel = (status: ReadingListStatus) => {
  if (status === 'DRAFT') return 'Draft';
  if (status === 'ARCHIVED') return 'Archived';
  return 'Published';
};

export const getReadingListStatusTone = (status: ReadingListStatus): 'brand' | 'accent' | 'muted' => {
  if (status === 'DRAFT') return 'muted';
  if (status === 'ARCHIVED') return 'muted';
  return 'brand';
};

export const getOwnerDisplayName = (
  ownerNickname: string | null,
  _ownerUserId: number,
) => {
  const trimmed = ownerNickname?.trim();
  if (trimmed) return trimmed;
  return 'Unnamed reader';
};

export const truncateDescription = (value: string | null, limit = 160) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
};
