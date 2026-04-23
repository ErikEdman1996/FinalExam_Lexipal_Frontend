import type { ReadingListStatus } from '../../api/api';
import { inputClassName } from '../../components/form/inputStyles';

export const readingListInputClassName = inputClassName;

export const normalizeTitleAuthorKey = (title: string, author: string) => {
  return `${title.trim().toLowerCase()}|${author.trim().toLowerCase()}`;
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
  ownerUserId: number,
) => {
  const trimmed = ownerNickname?.trim();
  if (trimmed) return trimmed;
  return `User #${ownerUserId}`;
};

export const truncateDescription = (value: string | null, limit = 160) => {
  if (!value) return '';
  const trimmed = value.trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit - 1).trimEnd()}…`;
};
