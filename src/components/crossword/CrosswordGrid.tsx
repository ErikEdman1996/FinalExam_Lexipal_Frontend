import { useEffect, useRef } from 'react';
import type {
  CrosswordCellDTO,
  CrosswordPuzzleDTO,
} from '../../api/api';
import { cellKey } from '../../features/crossword/grid';
import { CrosswordCell, type CrosswordCellVariant } from './CrosswordCell';

interface CrosswordGridProps {
  puzzle: CrosswordPuzzleDTO;
  getLetter: (row: number, column: number) => string;
  isCellInActiveEntry: (row: number, column: number) => boolean;
  activeCell: { row: number; column: number } | null;
  cellResultByEntryId?: Record<string, boolean>;
  activeEntryId: string | null;
  locked: boolean;
  onSelectCell: (row: number, column: number) => void;
  onTypeLetter: (ch: string) => void;
  onBackspace: () => void;
  onArrow: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

const CELL_SIZE = 44;
const CELL_GAP = 4;

export function CrosswordGrid({
  puzzle,
  getLetter,
  isCellInActiveEntry,
  activeCell,
  cellResultByEntryId,
  activeEntryId,
  locked,
  onSelectCell,
  onTypeLetter,
  onBackspace,
  onArrow,
}: CrosswordGridProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playableCells = puzzle.grid.cells.filter((cell) => cell.entryIds.length > 0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    if (activeCell) {
      node.focus();
    }
  }, [activeCell]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (locked) return;
    const { key } = event;

    if (key === 'Backspace') {
      event.preventDefault();
      onBackspace();
      return;
    }

    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault();
      const map = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      } as const;
      onArrow(map[key]);
      return;
    }

    if (/^[a-zA-Z]$/.test(key)) {
      event.preventDefault();
      onTypeLetter(key);
    }
  };

  const variantFor = (cell: CrosswordCellDTO | undefined, row: number, column: number): CrosswordCellVariant => {
    if (!cell) return 'blocked';
    if (cell.entryIds.length === 0) return 'blocked';

    const isFocused = activeCell?.row === row && activeCell?.column === column;
    const isInActiveEntry = isCellInActiveEntry(row, column);

    if (cellResultByEntryId && activeEntryId && isInActiveEntry) {
      const correct = cellResultByEntryId[activeEntryId];
      if (typeof correct === 'boolean') {
        return correct ? 'correct' : 'incorrect';
      }
    }

    if (cellResultByEntryId) {
      const cellResults = cell.entryIds
        .map((id) => cellResultByEntryId[id])
        .filter((value): value is boolean => typeof value === 'boolean');
      if (cellResults.length > 0) {
        const allCorrect = cellResults.every((value) => value === true);
        return allCorrect ? 'correct' : 'incorrect';
      }
    }

    if (isFocused) return 'focused';
    if (isInActiveEntry) return 'active-word';
    return 'idle';
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="grid"
      aria-label="Crossword grid"
      onKeyDown={handleKeyDown}
      className="inline-block rounded-[18px] bg-surface-muted p-3 shadow-[0_10px_24px_rgba(31,41,55,0.08)] focus:outline-none focus:ring-2 focus:ring-brand"
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${puzzle.grid.columns}, ${CELL_SIZE}px)`,
          gridAutoRows: `${CELL_SIZE}px`,
          gap: CELL_GAP,
        }}
      >
        {playableCells.map((cell) => {
          const variant = variantFor(cell, cell.row, cell.column);
          return (
            <CrosswordCell
              key={cellKey(cell.row, cell.column)}
              row={cell.row}
              column={cell.column}
              number={cell.number}
              letter={getLetter(cell.row, cell.column)}
              variant={variant}
              size={CELL_SIZE}
              onSelect={onSelectCell}
            />
          );
        })}
      </div>
    </div>
  );
}
