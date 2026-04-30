import type { CSSProperties } from 'react';

export type CrosswordCellVariant =
  | 'blocked'
  | 'idle'
  | 'active-word'
  | 'focused'
  | 'correct'
  | 'incorrect';

interface CrosswordCellProps {
  row: number;
  column: number;
  number: number | null;
  letter: string;
  variant: CrosswordCellVariant;
  onSelect: (row: number, column: number) => void;
  size: number;
}

const VARIANT_CLASSES: Record<CrosswordCellVariant, string> = {
  blocked: 'bg-transparent',
  idle: 'bg-[#D9C3C0] text-[#2F3240] hover:bg-[#E4CFCC]',
  'active-word': 'bg-[#E8D1CD] text-[#2F3240] hover:bg-[#F0DAD5]',
  focused: 'bg-[#FAF4F2] text-[#2F3240] ring-2 ring-[#E7A49C]',
  correct: 'bg-[#E3EAD8] text-[#2F3240]',
  incorrect: 'bg-[#F0C8C1] text-[#7A302B]',
};

export function CrosswordCell({
  row,
  column,
  number,
  letter,
  variant,
  onSelect,
  size,
}: CrosswordCellProps) {
  const style: CSSProperties = {
    width: size,
    height: size,
    gridColumnStart: column + 1,
    gridRowStart: row + 1,
  };

  if (variant === 'blocked') {
    return (
      <div
        aria-hidden="true"
        className={`rounded-[6px] ${VARIANT_CLASSES.blocked}`}
        style={style}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Row ${row + 1}, column ${column + 1}`}
      onClick={() => onSelect(row, column)}
      className={`relative rounded-[6px] border border-[#F5E5E1]/60 font-semibold uppercase shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] transition-colors duration-150 focus:outline-none ${VARIANT_CLASSES[variant]}`}
      style={style}
    >
      {number !== null ? (
        <span className="pointer-events-none absolute left-[3px] top-[1px] text-[9px] font-medium leading-none text-[#6C739C]">
          {number}
        </span>
      ) : null}
      <span className="text-[clamp(0.95rem,2vw,1.15rem)] leading-none">{letter}</span>
    </button>
  );
}
