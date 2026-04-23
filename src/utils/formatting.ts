const DEFAULT_DATE_FALLBACK = 'Unknown date';
const DEFAULT_DATE_TIME_FALLBACK = 'Unknown time';

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

export const formatDateFromDate = (date: Date, options: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat(getPreferredLocales(), options).format(date);
};

export const formatDateValue = (
  value: string | number | Date | null | undefined,
  options: Intl.DateTimeFormatOptions,
  fallback: string = DEFAULT_DATE_FALLBACK,
) => {
  if (value == null || value === '') {
    return fallback;
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return typeof value === 'string' && value ? value : fallback;
  }

  return formatDateFromDate(parsed, options);
};

export const formatCalendarDateValue = (
  value: string | null | undefined,
  options: Intl.DateTimeFormatOptions,
  fallback: string = DEFAULT_DATE_FALLBACK,
) => {
  if (!value) {
    return fallback;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value || fallback;
  }

  return formatDateFromDate(parsed, options);
};

export const formatShortDate = (value: string | number | Date | null | undefined) => {
  return formatDateValue(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatLongDate = (value: string | number | Date | null | undefined) => {
  return formatDateValue(value, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatShortDateTime = (value: string | number | Date | null | undefined) => {
  return formatDateValue(value, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }, DEFAULT_DATE_TIME_FALLBACK);
};

export const formatMonthDay = (value: string | null | undefined) => {
  return formatCalendarDateValue(value, {
    month: 'short',
    day: 'numeric',
  });
};
