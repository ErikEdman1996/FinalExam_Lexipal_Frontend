import type {
  CrosswordCellDTO,
  CrosswordDirection,
  CrosswordEntryDTO,
  CrosswordPuzzleDTO,
} from '../../api/api';

export interface CellCoord {
  row: number;
  column: number;
}

export const cellKey = (row: number, column: number) => `${row},${column}`;

export const buildCellIndex = (
  cells: CrosswordCellDTO[],
): Map<string, CrosswordCellDTO> => {
  const index = new Map<string, CrosswordCellDTO>();
  for (const cell of cells) {
    index.set(cellKey(cell.row, cell.column), cell);
  }
  return index;
};

export const buildEntryIndex = (
  entries: CrosswordEntryDTO[],
): Map<string, CrosswordEntryDTO> => {
  const index = new Map<string, CrosswordEntryDTO>();
  for (const entry of entries) {
    index.set(entry.id, entry);
  }
  return index;
};

export const getEntryCells = (entry: CrosswordEntryDTO): CellCoord[] => {
  const cells: CellCoord[] = [];
  for (let i = 0; i < entry.length; i += 1) {
    if (entry.direction === 'ACROSS') {
      cells.push({ row: entry.row, column: entry.column + i });
    } else {
      cells.push({ row: entry.row + i, column: entry.column });
    }
  }
  return cells;
};

export const getCellOffsetInEntry = (
  entry: CrosswordEntryDTO,
  row: number,
  column: number,
): number => {
  if (entry.direction === 'ACROSS') {
    return column - entry.column;
  }
  return row - entry.row;
};

export const cellHasEntry = (
  cell: CrosswordCellDTO,
  entryId: string,
): boolean => cell.entryIds.includes(entryId);

export const pickEntryForCell = (
  cell: CrosswordCellDTO,
  entryIndex: Map<string, CrosswordEntryDTO>,
  preferredDirection: CrosswordDirection,
  fallbackEntryId: string | null,
): CrosswordEntryDTO | null => {
  const entries = cell.entryIds
    .map((id) => entryIndex.get(id))
    .filter((e): e is CrosswordEntryDTO => Boolean(e));

  if (entries.length === 0) {
    return null;
  }

  if (fallbackEntryId) {
    const stay = entries.find((entry) => entry.id === fallbackEntryId);
    if (stay) {
      return stay;
    }
  }

  const preferred = entries.find((entry) => entry.direction === preferredDirection);
  if (preferred) {
    return preferred;
  }

  return entries[0];
};

export const getOtherEntryForCell = (
  cell: CrosswordCellDTO,
  currentEntryId: string,
  entryIndex: Map<string, CrosswordEntryDTO>,
): CrosswordEntryDTO | null => {
  const otherId = cell.entryIds.find((id) => id !== currentEntryId);
  if (!otherId) {
    return null;
  }
  return entryIndex.get(otherId) ?? null;
};

export const formatAnswer = (letters: (string | undefined)[], length: number): string => {
  const result: string[] = [];
  for (let i = 0; i < length; i += 1) {
    const ch = letters[i];
    if (typeof ch === 'string' && ch.length === 1 && /[a-zA-Z]/.test(ch)) {
      result.push(ch.toLowerCase());
    } else {
      result.push(' ');
    }
  }
  return result.join('');
};

export const groupEntriesByDirection = (puzzle: CrosswordPuzzleDTO) => {
  const sorter = (a: CrosswordEntryDTO, b: CrosswordEntryDTO) => a.number - b.number;
  return {
    across: puzzle.entries.filter((e) => e.direction === 'ACROSS').sort(sorter),
    down: puzzle.entries.filter((e) => e.direction === 'DOWN').sort(sorter),
  };
};
