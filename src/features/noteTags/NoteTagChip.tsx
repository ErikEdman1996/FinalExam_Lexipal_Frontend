import { X } from 'lucide-react';
import type { ApiNoteTag } from '../../api/api';
import { getReadableTagTextColor } from './noteTagColors';

interface NoteTagChipProps {
  tag: ApiNoteTag;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  disabled?: boolean;
}

export function NoteTagChip({
  tag,
  size = 'sm',
  onRemove,
  disabled = false,
}: NoteTagChipProps) {
  const sizeClassName = size === 'md'
    ? 'gap-2 px-3 py-1.5 text-sm'
    : 'gap-1.5 px-2.5 py-1 text-xs';
  const tagStyle = {
    backgroundColor: tag.colorHex,
    borderColor: tag.colorHex,
    color: getReadableTagTextColor(tag.colorHex),
  };

  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border shadow-[0_8px_16px_rgba(0,0,0,0.10)] ${sizeClassName}`}
      style={tagStyle}
      title={tag.name}
    >
      <span className="truncate font-medium">{tag.name}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-current opacity-80 transition-colors hover:bg-black/10 hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Remove ${tag.name}`}
        >
          <X size={12} />
        </button>
      ) : null}
    </span>
  );
}
