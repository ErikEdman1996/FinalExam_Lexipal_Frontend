import type {
  BookCircleReadResponseDTO,
  BookCircleVisibility,
  ProfileReadResponseDTO,
} from '../../api/api';
import { inputClassName } from '../../components/form/inputStyles';
import { formatDateFromDate } from '../../utils/formatting';

const SERVER_LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?)?$/;

export const circleInputClassName = inputClassName;

const toServerLocalDate = (value: string) => {
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

  return new Date(Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond.slice(0, 3).padEnd(3, '0')),
  ));
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
  if (profile?.id != null) {
    return profile.id;
  }

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
