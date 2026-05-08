import { useMemo, useState, type KeyboardEvent } from 'react';
import { Check, Plus, Tag } from 'lucide-react';
import { ApiValidationError, type ApiNoteTag, type ApiNoteTagSummary, type NoteTagFieldErrors } from '../../api/api';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
  inputClassName,
} from '../../components/form/inputStyles';
import { NoteTagChip } from './NoteTagChip';
import { TagColorSwatches } from './TagColorSwatches';
import {
  DEFAULT_NOTE_TAG_COLOR_HEX,
  getReadableTagTextColor,
  isAllowedNoteTagColor,
  normalizeTagName,
} from './noteTagColors';

interface NoteTagMultiSelectProps {
  id: string;
  tags: ApiNoteTagSummary[];
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
  onCreateTag: (payload: { name: string; colorHex: string }) => Promise<ApiNoteTag>;
  maxSelectedTags?: number;
  disabled?: boolean;
  isLoading?: boolean;
  loadError?: string | null;
  error?: string;
}

export function NoteTagMultiSelect({
  id,
  tags,
  selectedTagIds,
  onChange,
  onCreateTag,
  maxSelectedTags,
  disabled = false,
  isLoading = false,
  loadError = null,
  error,
}: NoteTagMultiSelectProps) {
  const [draft, setDraft] = useState('');
  const [colorHex, setColorHex] = useState(DEFAULT_NOTE_TAG_COLOR_HEX);
  const [fieldErrors, setFieldErrors] = useState<NoteTagFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const normalizedDraft = normalizeTagName(draft);
  const selectedIdSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);
  const hasSelectionLimit = maxSelectedTags != null;
  const hasReachedSelectionLimit = hasSelectionLimit && selectedTagIds.length >= maxSelectedTags;
  const selectionLimitMessage = hasSelectionLimit
    ? `You can add up to ${maxSelectedTags} tags per note.`
    : null;
  const selectedTags = tags.filter((tag) => selectedIdSet.has(tag.id));
  const matchingTags = normalizedDraft
    ? tags.filter((tag) => normalizeTagName(tag.name).includes(normalizedDraft))
    : tags;
  const exactMatch = normalizedDraft
    ? tags.find((tag) => normalizeTagName(tag.name) === normalizedDraft)
    : null;
  const canCreateTag = Boolean(normalizedDraft) && !exactMatch && !hasReachedSelectionLimit;

  const clearErrors = () => {
    setFieldErrors({});
    setSubmitError(null);
  };

  const toggleTag = (tagId: number) => {
    clearErrors();

    if (selectedIdSet.has(tagId)) {
      onChange(selectedTagIds.filter((selectedId) => selectedId !== tagId));
      return;
    }

    if (hasReachedSelectionLimit) {
      setSubmitError(selectionLimitMessage);
      return;
    }

    onChange([...selectedTagIds, tagId]);
  };

  const removeTag = (tagId: number) => {
    clearErrors();
    onChange(selectedTagIds.filter((selectedId) => selectedId !== tagId));
  };

  const handleCreateTag = async () => {
    if (isCreating) {
      return;
    }

    if (hasReachedSelectionLimit) {
      setSubmitError(selectionLimitMessage);
      return;
    }

    const trimmedName = draft.trim();
    const nextErrors: NoteTagFieldErrors = {};

    if (!trimmedName) {
      nextErrors.name = 'Enter a tag name.';
    } else if (tags.some((tag) => normalizeTagName(tag.name) === normalizeTagName(trimmedName))) {
      nextErrors.name = 'A tag with that name already exists.';
    }

    if (!isAllowedNoteTagColor(colorHex)) {
      nextErrors.colorHex = 'Choose one of the available tag colors.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setSubmitError(null);
      return;
    }

    try {
      setIsCreating(true);
      clearErrors();
      const createdTag = await onCreateTag({ name: trimmedName, colorHex });
      onChange([...selectedTagIds, createdTag.id]);
      setDraft('');
      setColorHex(DEFAULT_NOTE_TAG_COLOR_HEX);
    } catch (error) {
      if (error instanceof ApiValidationError) {
        setFieldErrors(error.fieldErrors as NoteTagFieldErrors);
        setSubmitError(error.message);
      } else if (error instanceof Error && error.message.trim()) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Could not create tag right now.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDraftKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (canCreateTag) {
      void handleCreateTag();
      return;
    }

    if (exactMatch) {
      toggleTag(exactMatch.id);
    }
  };

  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        Tags
      </label>

      {selectedTags.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <NoteTagChip
              key={tag.id}
              tag={tag}
              size="md"
              disabled={disabled || isCreating}
              onRemove={() => removeTag(tag.id)}
            />
          ))}
        </div>
      ) : null}

      <div className="relative">
        <Tag size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-text-subtle" />
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            clearErrors();
          }}
          onKeyDown={handleDraftKeyDown}
          placeholder="Search or create tags"
          className={`${inputClassName} pl-10`}
          autoComplete="off"
          disabled={disabled || isCreating}
        />
      </div>
      <p className={fieldHintClassName}>
        Optional. Select existing tags or create a new colored tag.
        {selectionLimitMessage ? ` ${selectionLimitMessage}` : ''}
      </p>
      {loadError ? <p className={fieldErrorClassName}>{loadError}</p> : null}
      {error ? <p className={fieldErrorClassName}>{error}</p> : null}
      {fieldErrors.name ? <p className={fieldErrorClassName}>{fieldErrors.name}</p> : null}
      {hasReachedSelectionLimit && submitError === selectionLimitMessage ? (
        <p className={fieldErrorClassName}>{selectionLimitMessage}</p>
      ) : null}

      <div className="mt-3 max-h-44 overflow-y-auto rounded-[18px] border border-border bg-surface-alt p-2">
        {isLoading ? (
          <p className="px-3 py-3 text-sm text-text-muted">Loading tags...</p>
        ) : matchingTags.length === 0 ? (
          <p className="px-3 py-3 text-sm text-text-muted">
            {normalizedDraft ? 'No matching tags.' : 'No tags yet.'}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {matchingTags.map((tag) => {
              const isSelected = selectedIdSet.has(tag.id);
              const tagTextColor = getReadableTagTextColor(tag.colorHex);
              const isOptionDisabled = disabled || isCreating || (!isSelected && hasReachedSelectionLimit);

              return (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  disabled={isOptionDisabled}
                  className={`flex items-center justify-between gap-3 rounded-[14px] px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSelected ? 'bg-brand-soft text-text' : 'hover:bg-surface'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className="max-w-full truncate rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: tag.colorHex,
                        color: tagTextColor,
                      }}
                    >
                      {tag.name}
                    </span>
                    <span className="text-xs text-text-subtle">{tag.usageCount}</span>
                  </span>
                  {isSelected ? <Check size={15} className="shrink-0 text-brand-strong" /> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {canCreateTag ? (
        <div className="mt-4 rounded-[18px] border border-border bg-surface-alt p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-text">Create "{draft.trim()}"</p>
              <p className="mt-1 text-xs text-text-muted">Choose a color before saving the new tag.</p>
            </div>
            <button
              type="button"
              onClick={() => void handleCreateTag()}
              disabled={disabled || isCreating}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand px-4 text-sm font-medium text-text-on-brand transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={14} />
              {isCreating ? 'Creating...' : 'Create'}
            </button>
          </div>
          <div className="mt-3">
            <TagColorSwatches
              value={colorHex}
              onChange={(nextColor) => {
                setColorHex(nextColor);
                clearErrors();
              }}
              disabled={disabled || isCreating}
            />
          </div>
          {fieldErrors.colorHex ? <p className={fieldErrorClassName}>{fieldErrors.colorHex}</p> : null}
          {submitError ? <p className={fieldErrorClassName}>{submitError}</p> : null}
        </div>
      ) : submitError ? (
        <p className={fieldErrorClassName}>{submitError}</p>
      ) : null}
    </div>
  );
}
