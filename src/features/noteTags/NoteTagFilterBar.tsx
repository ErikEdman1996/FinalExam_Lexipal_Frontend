import { X } from 'lucide-react';
import type { ApiNoteTagSummary, NoteTagMatch } from '../../api/api';
import { getReadableTagTextColor } from './noteTagColors';

interface NoteTagFilterBarProps {
  tags: ApiNoteTagSummary[];
  activeTagIds: number[];
  tagMatch: NoteTagMatch;
  isUpdating?: boolean;
  isLoadingTags?: boolean;
  onToggleTag: (tagId: number) => void;
  onTagMatchChange: (tagMatch: NoteTagMatch) => void;
  onClear: () => void;
}

export function NoteTagFilterBar({
  tags,
  activeTagIds,
  tagMatch,
  isUpdating = false,
  isLoadingTags = false,
  onToggleTag,
  onTagMatchChange,
  onClear,
}: NoteTagFilterBarProps) {
  const activeIdSet = new Set(activeTagIds);

  return (
    <div className="mt-5 rounded-[22px] border border-border bg-surface-alt p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-text">Filter by tag</p>
          {isUpdating ? <p className="mt-1 text-xs text-text-muted">Updating notes...</p> : null}
        </div>
        {activeTagIds.length > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface-muted hover:text-text"
          >
            <X size={14} />
            Clear
          </button>
        ) : null}
      </div>

      {isLoadingTags ? (
        <p className="mt-3 text-sm text-text-muted">Loading tags...</p>
      ) : tags.length === 0 ? (
        <p className="mt-3 text-sm text-text-muted">No tags yet.</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const isActive = activeIdSet.has(tag.id);
            const tagTextColor = getReadableTagTextColor(tag.colorHex);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 ${
                  isActive
                    ? 'shadow-[0_8px_18px_rgba(0,0,0,0.18)]'
                    : 'opacity-[0.82] shadow-[0_6px_14px_rgba(0,0,0,0.10)] hover:opacity-100'
                }`}
                style={{
                  backgroundColor: tag.colorHex,
                  borderColor: isActive ? tagTextColor : tag.colorHex,
                  color: tagTextColor,
                }}
                aria-pressed={isActive}
              >
                <span className="truncate">{tag.name}</span>
                <span className="opacity-75">
                  {tag.usageCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {activeTagIds.length > 1 ? (
        <div className="mt-4 flex w-full gap-1 rounded-full border border-border bg-surface-muted p-1 sm:w-fit">
          {(['ANY', 'ALL'] as const).map((option) => {
            const isActive = tagMatch === option;

            return (
              <button
                key={option}
                type="button"
                onClick={() => onTagMatchChange(option)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.24)]'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
