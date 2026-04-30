import { useCallback, useMemo, useState, type SetStateAction } from 'react';
import type {
  CrosswordCellDTO,
  CrosswordDirection,
  CrosswordEntryDTO,
  CrosswordPuzzleDTO,
} from '../../api/api';
import {
  buildCellIndex,
  buildEntryIndex,
  cellKey,
  formatAnswer,
  getCellOffsetInEntry,
  getEntryCells,
  getOtherEntryForCell,
  pickEntryForCell,
} from './grid';

type ArrowDirection = 'up' | 'down' | 'left' | 'right';

interface CursorState {
  activeEntryId: string | null;
  activeCell: { row: number; column: number } | null;
}

export interface CrosswordGameState extends CursorState {
  letters: Record<string, string>;
  locked: boolean;
}

export interface UseCrosswordGameResult extends CrosswordGameState {
  activeEntry: CrosswordEntryDTO | null;
  activeDirection: CrosswordDirection;
  selectCell: (row: number, column: number) => void;
  selectEntry: (entryId: string) => void;
  typeLetter: (ch: string) => void;
  backspace: () => void;
  arrow: (direction: ArrowDirection) => void;
  clearAll: () => void;
  lock: () => void;
  getLetter: (row: number, column: number) => string;
  getEntryAnswer: (entryId: string) => string;
  buildAnswersPayload: () => Record<string, string>;
  isCellInActiveEntry: (row: number, column: number) => boolean;
}

interface InternalGameState {
  puzzleKey: string;
  letters: Record<string, string>;
  cursor: CursorState;
  locked: boolean;
}

const findFirstPlayableCellForEntry = (entry: CrosswordEntryDTO) => ({
  row: entry.row,
  column: entry.column,
});

const applyStateAction = <T,>(action: SetStateAction<T>, current: T): T =>
  typeof action === 'function' ? (action as (previous: T) => T)(current) : action;

export function useCrosswordGame(puzzle: CrosswordPuzzleDTO | null): UseCrosswordGameResult {
  const puzzleKey = useMemo(
    () => puzzle?.entries.map((entry) => entry.id).join('|') ?? '',
    [puzzle],
  );
  const firstEntry = puzzle?.entries[0] ?? null;
  const firstEntryId = firstEntry?.id ?? null;
  const firstEntryRow = firstEntry?.row ?? null;
  const firstEntryColumn = firstEntry?.column ?? null;
  const initialGameState = useMemo<InternalGameState>(() => ({
    puzzleKey,
    letters: {},
    cursor: {
      activeEntryId: firstEntryId,
      activeCell:
        firstEntryId !== null && firstEntryRow !== null && firstEntryColumn !== null
          ? { row: firstEntryRow, column: firstEntryColumn }
          : null,
    },
    locked: false,
  }), [firstEntryColumn, firstEntryId, firstEntryRow, puzzleKey]);
  const [gameState, setGameState] = useState<InternalGameState>(initialGameState);
  const currentGameState = gameState.puzzleKey === puzzleKey ? gameState : initialGameState;
  const { letters, cursor, locked } = currentGameState;

  const setLetters = useCallback((action: SetStateAction<Record<string, string>>) => {
    setGameState((prev) => ({
      ...(prev.puzzleKey === puzzleKey ? prev : initialGameState),
      letters: applyStateAction(
        action,
        prev.puzzleKey === puzzleKey ? prev.letters : initialGameState.letters,
      ),
    }));
  }, [initialGameState, puzzleKey]);

  const setCursor = useCallback((action: SetStateAction<CursorState>) => {
    setGameState((prev) => ({
      ...(prev.puzzleKey === puzzleKey ? prev : initialGameState),
      cursor: applyStateAction(
        action,
        prev.puzzleKey === puzzleKey ? prev.cursor : initialGameState.cursor,
      ),
    }));
  }, [initialGameState, puzzleKey]);

  const setLocked = useCallback((action: SetStateAction<boolean>) => {
    setGameState((prev) => ({
      ...(prev.puzzleKey === puzzleKey ? prev : initialGameState),
      locked: applyStateAction(
        action,
        prev.puzzleKey === puzzleKey ? prev.locked : initialGameState.locked,
      ),
    }));
  }, [initialGameState, puzzleKey]);

  const cellIndex = useMemo(
    () => (puzzle ? buildCellIndex(puzzle.grid.cells) : new Map<string, CrosswordCellDTO>()),
    [puzzle],
  );
  const entryIndex = useMemo(
    () => (puzzle ? buildEntryIndex(puzzle.entries) : new Map<string, CrosswordEntryDTO>()),
    [puzzle],
  );

  const activeEntry = cursor.activeEntryId ? entryIndex.get(cursor.activeEntryId) ?? null : null;
  const activeDirection: CrosswordDirection = activeEntry?.direction ?? 'ACROSS';

  const getCell = useCallback(
    (row: number, column: number) => cellIndex.get(cellKey(row, column)) ?? null,
    [cellIndex],
  );

  const selectEntry = useCallback(
    (entryId: string) => {
      if (locked) return;
      const entry = entryIndex.get(entryId);
      if (!entry) return;
      setCursor({
        activeEntryId: entry.id,
        activeCell: findFirstPlayableCellForEntry(entry),
      });
    },
    [entryIndex, locked, setCursor],
  );

  const selectCell = useCallback(
    (row: number, column: number) => {
      if (locked) return;
      const cell = getCell(row, column);
      if (!cell || cell.entryIds.length === 0) return;

      setCursor((prev) => {
        const sameCell =
          prev.activeCell?.row === row && prev.activeCell?.column === column;

        if (sameCell && prev.activeEntryId) {
          const other = getOtherEntryForCell(cell, prev.activeEntryId, entryIndex);
          if (other) {
            return {
              activeEntryId: other.id,
              activeCell: { row, column },
            };
          }
        }

        const preferredDirection: CrosswordDirection =
          prev.activeEntryId && entryIndex.get(prev.activeEntryId)?.direction === 'DOWN'
            ? 'DOWN'
            : 'ACROSS';
        const entry = pickEntryForCell(
          cell,
          entryIndex,
          preferredDirection,
          prev.activeEntryId,
        );
        if (!entry) return prev;

        return {
          activeEntryId: entry.id,
          activeCell: { row, column },
        };
      });
    },
    [entryIndex, getCell, locked, setCursor],
  );

  const moveAlongEntry = useCallback(
    (delta: number) => {
      setCursor((prev) => {
        if (!prev.activeEntryId || !prev.activeCell) return prev;
        const entry = entryIndex.get(prev.activeEntryId);
        if (!entry) return prev;
        const offset = getCellOffsetInEntry(entry, prev.activeCell.row, prev.activeCell.column);
        const next = offset + delta;
        if (next < 0 || next >= entry.length) {
          return prev;
        }
        const cells = getEntryCells(entry);
        const target = cells[next];
        return {
          activeEntryId: entry.id,
          activeCell: { row: target.row, column: target.column },
        };
      });
    },
    [entryIndex, setCursor],
  );

  const typeLetter = useCallback(
    (ch: string) => {
      if (locked) return;
      if (ch.length !== 1 || !/[a-zA-Z]/.test(ch)) return;
      setLetters((prev) => {
        const cell = cursor.activeCell;
        if (!cell) return prev;
        return {
          ...prev,
          [cellKey(cell.row, cell.column)]: ch.toUpperCase(),
        };
      });
      moveAlongEntry(1);
    },
    [cursor.activeCell, locked, moveAlongEntry, setLetters],
  );

  const backspace = useCallback(() => {
    if (locked) return;
    setLetters((prev) => {
      const cell = cursor.activeCell;
      if (!cell) return prev;
      const key = cellKey(cell.row, cell.column);
      const existing = prev[key];
      if (existing) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return prev;
    });

    setCursor((prev) => {
      if (!prev.activeEntryId || !prev.activeCell) return prev;
      const entry = entryIndex.get(prev.activeEntryId);
      if (!entry) return prev;
      const offset = getCellOffsetInEntry(entry, prev.activeCell.row, prev.activeCell.column);
      const currentKey = cellKey(prev.activeCell.row, prev.activeCell.column);
      const hadLetter = Boolean(letters[currentKey]);
      if (hadLetter) {
        return prev;
      }
      const previousOffset = offset - 1;
      if (previousOffset < 0) return prev;
      const cells = getEntryCells(entry);
      const target = cells[previousOffset];
      return {
        activeEntryId: entry.id,
        activeCell: { row: target.row, column: target.column },
      };
    });
  }, [cursor.activeCell, entryIndex, letters, locked, setCursor, setLetters]);

  const arrow = useCallback(
    (direction: ArrowDirection) => {
      if (locked) return;
      if (!puzzle) return;
      setCursor((prev) => {
        if (!prev.activeCell) return prev;
        const isHorizontal = direction === 'left' || direction === 'right';
        const targetDirection: CrosswordDirection = isHorizontal ? 'ACROSS' : 'DOWN';

        const dr = direction === 'up' ? -1 : direction === 'down' ? 1 : 0;
        const dc = direction === 'left' ? -1 : direction === 'right' ? 1 : 0;

        let row = prev.activeCell.row;
        let column = prev.activeCell.column;
        for (let step = 0; step < Math.max(puzzle.grid.rows, puzzle.grid.columns); step += 1) {
          row += dr;
          column += dc;
          if (
            row < 0 ||
            column < 0 ||
            row >= puzzle.grid.rows ||
            column >= puzzle.grid.columns
          ) {
            return prev;
          }
          const cell = cellIndex.get(cellKey(row, column));
          if (!cell || cell.entryIds.length === 0) {
            continue;
          }

          const currentEntryDir = prev.activeEntryId
            ? entryIndex.get(prev.activeEntryId)?.direction ?? 'ACROSS'
            : 'ACROSS';
          const wantSwitch = currentEntryDir !== targetDirection;
          const preferredDirection = wantSwitch ? targetDirection : currentEntryDir;
          const entry = pickEntryForCell(
            cell,
            entryIndex,
            preferredDirection,
            wantSwitch ? null : prev.activeEntryId,
          );
          if (!entry) continue;

          return {
            activeEntryId: entry.id,
            activeCell: { row, column },
          };
        }
        return prev;
      });
    },
    [cellIndex, entryIndex, locked, puzzle, setCursor],
  );

  const clearAll = useCallback(() => {
    if (locked) return;
    setLetters({});
  }, [locked, setLetters]);

  const lock = useCallback(() => setLocked(true), [setLocked]);

  const getLetter = useCallback(
    (row: number, column: number) => letters[cellKey(row, column)] ?? '',
    [letters],
  );

  const getEntryAnswer = useCallback(
    (entryId: string): string => {
      const entry = entryIndex.get(entryId);
      if (!entry) return '';
      const cells = getEntryCells(entry);
      const slots = cells.map(({ row, column }) => letters[cellKey(row, column)]);
      return formatAnswer(slots, entry.length);
    },
    [entryIndex, letters],
  );

  const buildAnswersPayload = useCallback(() => {
    if (!puzzle) return {};
    const payload: Record<string, string> = {};
    for (const entry of puzzle.entries) {
      payload[entry.id] = getEntryAnswer(entry.id);
    }
    return payload;
  }, [getEntryAnswer, puzzle]);

  const isCellInActiveEntry = useCallback(
    (row: number, column: number) => {
      if (!activeEntry) return false;
      if (activeEntry.direction === 'ACROSS') {
        return (
          row === activeEntry.row &&
          column >= activeEntry.column &&
          column < activeEntry.column + activeEntry.length
        );
      }
      return (
        column === activeEntry.column &&
        row >= activeEntry.row &&
        row < activeEntry.row + activeEntry.length
      );
    },
    [activeEntry],
  );

  return {
    letters,
    activeEntryId: cursor.activeEntryId,
    activeCell: cursor.activeCell,
    activeEntry,
    activeDirection,
    locked,
    selectCell,
    selectEntry,
    typeLetter,
    backspace,
    arrow,
    clearAll,
    lock,
    getLetter,
    getEntryAnswer,
    buildAnswersPayload,
    isCellInActiveEntry,
  };
}
