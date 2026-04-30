import { CheckCircle2, XCircle } from 'lucide-react';
import type { CrosswordEntryDTO, CrosswordPuzzleDTO } from '../../api/api';
import { groupEntriesByDirection } from '../../features/crossword/grid';

interface ClueListProps {
  puzzle: CrosswordPuzzleDTO;
  activeEntryId: string | null;
  resultsByEntryId?: Record<string, boolean>;
  onSelectEntry: (entryId: string) => void;
}

interface ClueRowProps {
  entry: CrosswordEntryDTO;
  active: boolean;
  result?: boolean;
  onSelect: (entryId: string) => void;
}

function ClueRow({ entry, active, result, onSelect }: ClueRowProps) {
  const baseClasses =
    'flex w-full items-start gap-3 rounded-[14px] px-3 py-2 text-left text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand';
  const activeClasses = active
    ? 'bg-brand-soft text-brand-strong'
    : 'text-text hover:bg-surface-alt';

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.id)}
      className={`${baseClasses} ${activeClasses}`}
    >
      <span className="mt-[1px] inline-flex w-6 shrink-0 justify-end font-semibold tabular-nums text-text-subtle">
        {entry.number}.
      </span>
      <span className="flex-1 leading-relaxed">{entry.clue}</span>
      <span className="mt-[1px] inline-flex shrink-0 items-center gap-2 text-xs font-medium text-text-subtle">
        <span className="rounded-full bg-surface-muted px-2 py-0.5 tabular-nums">
          {entry.length}
        </span>
        {result === true ? <CheckCircle2 size={16} className="text-brand-strong" /> : null}
        {result === false ? <XCircle size={16} className="text-danger" /> : null}
      </span>
    </button>
  );
}

export function ClueList({
  puzzle,
  activeEntryId,
  resultsByEntryId,
  onSelectEntry,
}: ClueListProps) {
  const { across, down } = groupEntriesByDirection(puzzle);

  const renderColumn = (title: string, entries: CrosswordEntryDTO[]) => (
    <div className="flex-1">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-subtle">
        {title}
      </h3>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <ClueRow
              entry={entry}
              active={entry.id === activeEntryId}
              result={resultsByEntryId?.[entry.id]}
              onSelect={onSelectEntry}
            />
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="rounded-[26px] border border-border bg-surface p-5 shadow-[0_14px_28px_rgba(31,41,55,0.06)]">
      <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
        {renderColumn('Across', across)}
        {renderColumn('Down', down)}
      </div>
    </div>
  );
}
