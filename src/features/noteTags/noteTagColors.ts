export interface NoteTagColorOption {
  label: string;
  hex: string;
}

export const NOTE_TAG_COLOR_OPTIONS: NoteTagColorOption[] = [
  { label: 'Clay', hex: '#B85A3E' },
  { label: 'Gold', hex: '#A88433' },
  { label: 'Taupe', hex: '#6B6259' },
  { label: 'Coral', hex: '#FF7A59' },
  { label: 'Sun', hex: '#FFD866' },
  { label: 'Mint', hex: '#A8E6CF' },
  { label: 'Sky', hex: '#8BE8FF' },
  { label: 'Blue', hex: '#7FB7FF' },
  { label: 'Violet', hex: '#B084F5' },
];

export const DEFAULT_NOTE_TAG_COLOR_HEX = NOTE_TAG_COLOR_OPTIONS[0].hex;

const allowedColorSet = new Set(NOTE_TAG_COLOR_OPTIONS.map((option) => option.hex.toLowerCase()));

export const isAllowedNoteTagColor = (colorHex: string) => {
  return allowedColorSet.has(colorHex.trim().toLowerCase());
};

export const normalizeTagName = (value: string) => {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
};

export const getReadableTagTextColor = (colorHex: string) => {
  const normalizedHex = colorHex.trim().replace('#', '');

  if (!/^[0-9a-fA-F]{6}$/.test(normalizedHex)) {
    return '#FFFFFF';
  }

  const red = Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = Number.parseInt(normalizedHex.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 150 ? '#1D1714' : '#FFFFFF';
};
