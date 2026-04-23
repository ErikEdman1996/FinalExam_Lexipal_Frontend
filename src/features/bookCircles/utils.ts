import type {
  BookCircleReadResponseDTO,
  BookCircleVisibility,
  ProfileReadResponseDTO,
} from '../../api/api';
import { inputClassName } from '../../components/form/inputStyles';
import { formatDateFromDate } from '../../utils/formatting';

const SERVER_LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/;

export const circleInputClassName = inputClassName;

const getPreferredLocales = () => {
  if (typeof navigator === 'undefined') {
    return ['en-US'];
  }

  if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
    return navigator.languages.map((locale) => String(locale));
  }

  if (navigator.language) {
    return [navigator.language];
  }

  return ['en-US'];
};

const parseServerLocalDateParts = (value: string) => {
  const match = SERVER_LOCAL_DATE_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const [
    ,
    year,
    month,
    day,
    hour = '00',
    minute = '00',
    second = '00',
    millisecond = '000',
  ] = match;

  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
    millisecond: Number(millisecond.slice(0, 3).padEnd(3, '0')),
  };
};

const toServerLocalDate = (value: string) => {
  const parts = parseServerLocalDateParts(value);

  if (!parts) {
    return null;
  }

  return new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  ));
};

const padDateSegment = (value: number) => {
  return String(value).padStart(2, '0');
};

export const parseCircleLocalDateTime = (value: string) => {
  const parts = parseServerLocalDateParts(value);

  if (!parts) {
    return null;
  }

  return new Date(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
    parts.millisecond,
  );
};

const formatServerLocal = (
  value: string,
  options: Intl.DateTimeFormatOptions,
  fallback: string,
) => {
  const parsed = toServerLocalDate(value);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return value || fallback;
  }

  return formatDateFromDate(parsed, {
    ...options,
    timeZone: 'UTC',
  });
};

export const formatCircleDate = (value: string) => {
  return formatServerLocal(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }, 'Unknown date');
};

export const formatCircleDateTime = (value: string) => {
  return formatServerLocal(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }, 'Unknown time');
};

export const formatCircleMeetingDateTime = (value: string) => {
  const parsed = parseCircleLocalDateTime(value);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return value || 'Unknown time';
  }

  return formatDateFromDate(parsed, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatCircleMeetingRelativeDate = (value: string, now: Date = new Date()) => {
  const parsed = parseCircleLocalDateTime(value);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return formatCircleDate(value);
  }

  const diffMilliseconds = parsed.getTime() - now.getTime();
  const absoluteDiff = Math.abs(diffMilliseconds);

  if (absoluteDiff < 60_000) {
    return 'soon';
  }

  const formatter = new Intl.RelativeTimeFormat(getPreferredLocales(), {
    numeric: 'auto',
  });

  const units: Array<{ unit: Intl.RelativeTimeFormatUnit; milliseconds: number }> = [
    { unit: 'year', milliseconds: 365 * 24 * 60 * 60 * 1000 },
    { unit: 'month', milliseconds: 30 * 24 * 60 * 60 * 1000 },
    { unit: 'week', milliseconds: 7 * 24 * 60 * 60 * 1000 },
    { unit: 'day', milliseconds: 24 * 60 * 60 * 1000 },
    { unit: 'hour', milliseconds: 60 * 60 * 1000 },
    { unit: 'minute', milliseconds: 60 * 1000 },
  ];

  const matchingUnit = units.find((candidate) => absoluteDiff >= candidate.milliseconds) ?? units.at(-1);

  if (!matchingUnit) {
    return 'soon';
  }

  return formatter.format(
    Math.round(diffMilliseconds / matchingUnit.milliseconds),
    matchingUnit.unit,
  );
};

export const formatCircleDateTimeLocalInputValue = (
  value: string | Date | null | undefined,
) => {
  if (value == null || value === '') {
    return '';
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return '';
    }

    return [
      `${value.getFullYear()}-${padDateSegment(value.getMonth() + 1)}-${padDateSegment(value.getDate())}`,
      `${padDateSegment(value.getHours())}:${padDateSegment(value.getMinutes())}`,
    ].join('T');
  }

  const parts = parseServerLocalDateParts(value);

  if (!parts) {
    return '';
  }

  return [
    `${parts.year}-${padDateSegment(parts.month)}-${padDateSegment(parts.day)}`,
    `${padDateSegment(parts.hour)}:${padDateSegment(parts.minute)}`,
  ].join('T');
};

export const formatCircleMeetingDateForApi = (value: string) => {
  const parsed = parseCircleLocalDateTime(value);

  if (!parsed || Number.isNaN(parsed.getTime())) {
    return null;
  }

  return [
    `${parsed.getFullYear()}-${padDateSegment(parsed.getMonth() + 1)}-${padDateSegment(parsed.getDate())}`,
    `${padDateSegment(parsed.getHours())}:${padDateSegment(parsed.getMinutes())}:${padDateSegment(parsed.getSeconds())}`,
  ].join(' ');
};

export const getCircleMeetingTargetLabel = ({
  meetingChapterLabel,
  meetingPageEnd,
  meetingPageStart,
}: Pick<
  BookCircleReadResponseDTO,
  'meetingChapterLabel' | 'meetingPageStart' | 'meetingPageEnd'
>) => {
  const chapterLabel = meetingChapterLabel?.trim() ?? '';

  if (chapterLabel) {
    return chapterLabel;
  }

  if (meetingPageStart != null && meetingPageEnd != null) {
    return `Pages ${meetingPageStart}-${meetingPageEnd}`;
  }

  return 'No reading target set';
};

export const formatDurationLabel = (totalSeconds: number) => {
  const safeSeconds = Math.max(0, totalSeconds);
  const totalMinutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

export const formatProgressLabel = (value: number | null | undefined) => {
  if (value == null || Number.isNaN(value)) {
    return 'Hidden';
  }

  const rounded = value >= 10 ? Math.round(value) : Number(value.toFixed(1));
  return `${rounded}%`;
};

export const getVisibilityLabel = (visibility: BookCircleVisibility) => {
  return visibility === 'OWNER_ONLY' ? 'Owner only' : 'All members';
};

export const getVisibilityDescription = (visibility: BookCircleVisibility) => {
  return visibility === 'OWNER_ONLY'
    ? 'Only the circle owner can see other members\' progress.'
    : 'Everyone in the circle can see each member\'s progress.';
};

export const normalizeInviteCodeInput = (value: string) => {
  return value.replace(/[^a-z]/gi, '').toUpperCase().slice(0, 6);
};

export const nicknamesMatch = (left: string | null | undefined, right: string | null | undefined) => {
  if (!left || !right) {
    return false;
  }

  return left.trim().toLowerCase() === right.trim().toLowerCase();
};

export const getCurrentCircleUserId = (
  circle: BookCircleReadResponseDTO,
  profile: ProfileReadResponseDTO | null,
) => {
  const ownMember = circle.members.find((member) => nicknamesMatch(member.userNickname, profile?.nickname));
  return ownMember?.userId ?? null;
};

export const canDrillIntoMember = ({
  callerIsOwner,
  currentUserId,
  targetUserId,
  visibility,
}: {
  callerIsOwner: boolean;
  currentUserId: number | null;
  targetUserId: number;
  visibility: BookCircleVisibility;
}) => {
  return callerIsOwner || currentUserId === targetUserId || visibility === 'ALL_MEMBERS';
};

export const getMemberDisplayName = ({
  currentUserId,
  fallbackNickname,
  targetUserId,
}: {
  currentUserId: number | null;
  fallbackNickname: string | null;
  targetUserId: number;
}) => {
  if (currentUserId != null && currentUserId === targetUserId) {
    return 'You';
  }

  return fallbackNickname?.trim() || 'Anonymous';
};

export const copyTextToClipboard = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return true;
  }

  const textArea = document.createElement('textarea');
  textArea.value = value;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'absolute';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.select();

  try {
    document.execCommand('copy');
    return true;
  } finally {
    document.body.removeChild(textArea);
  }
};
