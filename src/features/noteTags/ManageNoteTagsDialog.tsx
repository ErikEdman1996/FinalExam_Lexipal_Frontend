import { useState } from 'react';
import { Pencil, Save, Tag, Trash2, X } from 'lucide-react';
import {
  ApiValidationError,
  type ApiNoteTagSummary,
  type NoteTagFieldErrors,
} from '../../api/api';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/ConfirmModal';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  fieldErrorClassName,
  fieldLabelClassName,
  inputClassName,
} from '../../components/form/inputStyles';
import { NoteTagChip } from './NoteTagChip';
import { TagColorSwatches } from './TagColorSwatches';
import { isAllowedNoteTagColor, normalizeTagName } from './noteTagColors';

interface ManageNoteTagsDialogProps {
  isOpen: boolean;
  tags: ApiNoteTagSummary[];
  isLoading?: boolean;
  loadError?: string | null;
  onClose: () => void;
  onUpdateTag: (tagId: number, payload: { name?: string; colorHex?: string }) => Promise<unknown>;
  onDeleteTag: (tagId: number) => Promise<void>;
  onTagsChanged: (reason: 'update' | 'delete') => Promise<void>;
}

export function ManageNoteTagsDialog({
  isOpen,
  tags,
  isLoading = false,
  loadError = null,
  onClose,
  onUpdateTag,
  onDeleteTag,
  onTagsChanged,
}: ManageNoteTagsDialogProps) {
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [colorDraft, setColorDraft] = useState('');
  const [fieldErrors, setFieldErrors] = useState<NoteTagFieldErrors>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingTagId, setSavingTagId] = useState<number | null>(null);
  const [pendingDeleteTag, setPendingDeleteTag] = useState<ApiNoteTagSummary | null>(null);
  const [deletingTagId, setDeletingTagId] = useState<number | null>(null);

  if (!isOpen) {
    return null;
  }

  const startEditing = (tag: ApiNoteTagSummary) => {
    setEditingTagId(tag.id);
    setNameDraft(tag.name);
    setColorDraft(tag.colorHex);
    setFieldErrors({});
    setActionError(null);
  };

  const cancelEditing = () => {
    setEditingTagId(null);
    setNameDraft('');
    setColorDraft('');
    setFieldErrors({});
    setActionError(null);
  };

  const saveEditingTag = async (tag: ApiNoteTagSummary) => {
    const trimmedName = nameDraft.trim();
    const nextErrors: NoteTagFieldErrors = {};

    if (!trimmedName) {
      nextErrors.name = 'Tag name is required.';
    } else if (tags.some((candidate) => (
      candidate.id !== tag.id && normalizeTagName(candidate.name) === normalizeTagName(trimmedName)
    ))) {
      nextErrors.name = 'A tag with that name already exists.';
    }

    if (!isAllowedNoteTagColor(colorDraft)) {
      nextErrors.colorHex = 'Choose one of the available tag colors.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setActionError(null);
      return;
    }

    try {
      setSavingTagId(tag.id);
      setFieldErrors({});
      setActionError(null);
      await onUpdateTag(tag.id, {
        name: trimmedName,
        colorHex: colorDraft,
      });
      await onTagsChanged('update');
      cancelEditing();
    } catch (error) {
      if (error instanceof ApiValidationError) {
        setFieldErrors(error.fieldErrors as NoteTagFieldErrors);
        setActionError(error.message);
      } else if (error instanceof Error && error.message.trim()) {
        setActionError(error.message);
      } else {
        setActionError('Could not update tag right now.');
      }
    } finally {
      setSavingTagId(null);
    }
  };

  const confirmDeleteTag = async () => {
    if (!pendingDeleteTag || deletingTagId != null) {
      return;
    }

    try {
      setDeletingTagId(pendingDeleteTag.id);
      setActionError(null);
      await onDeleteTag(pendingDeleteTag.id);
      await onTagsChanged('delete');

      if (editingTagId === pendingDeleteTag.id) {
        cancelEditing();
      }

      setPendingDeleteTag(null);
    } catch (error) {
      if (error instanceof Error && error.message.trim()) {
        setActionError(error.message);
      } else {
        setActionError('Could not delete tag right now.');
      }
    } finally {
      setDeletingTagId(null);
    }
  };

  return (
    <>
      <AppDialog
        isOpen
        onClose={onClose}
        canClose={savingTagId == null && deletingTagId == null}
        contentClassName="w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-t-[32px] border border-border bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300 sm:rounded-[32px] sm:slide-in-from-bottom-0"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                <Tag size={20} className="text-brand-strong" />
              </div>
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Note tags</p>
                <AppDialogTitle className="mt-1 text-2xl font-semibold text-text">
                  Manage tags
                </AppDialogTitle>
              </div>
            </div>
            <AppDialogClose asChild>
              <button
                type="button"
                onClick={onClose}
                disabled={savingTagId != null || deletingTagId != null}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close tag management"
              >
                <X size={20} className="text-text-muted" />
              </button>
            </AppDialogClose>
          </div>

          {loadError ? (
            <div className="mt-5 rounded-[22px] border border-danger/30 bg-danger-soft px-4 py-4 text-sm text-danger">
              {loadError}
            </div>
          ) : null}

          {actionError ? (
            <div className="mt-5 rounded-[22px] border border-danger/30 bg-danger-soft px-4 py-4 text-sm text-danger">
              {actionError}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="rounded-[24px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
                Loading tags...
              </div>
            ) : tags.length === 0 ? (
              <div className="rounded-[24px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
                No tags yet. Create one from a note editor.
              </div>
            ) : (
              tags.map((tag) => {
                const isEditing = editingTagId === tag.id;
                const isSaving = savingTagId === tag.id;
                const isDeleting = deletingTagId === tag.id;

                return (
                  <div
                    key={tag.id}
                    className="rounded-[20px] border border-border bg-surface-alt p-4"
                  >
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={`manage-tag-name-${tag.id}`} className={fieldLabelClassName}>
                            Name
                          </label>
                          <input
                            id={`manage-tag-name-${tag.id}`}
                            value={nameDraft}
                            onChange={(event) => {
                              setNameDraft(event.target.value);
                              setFieldErrors((current) => ({ ...current, name: undefined }));
                              setActionError(null);
                            }}
                            className={inputClassName}
                            disabled={isSaving}
                          />
                          {fieldErrors.name ? <p className={fieldErrorClassName}>{fieldErrors.name}</p> : null}
                        </div>

                        <div>
                          <p className={fieldLabelClassName}>Color</p>
                          <TagColorSwatches
                            value={colorDraft}
                            onChange={(nextColor) => {
                              setColorDraft(nextColor);
                              setFieldErrors((current) => ({ ...current, colorHex: undefined }));
                              setActionError(null);
                            }}
                            disabled={isSaving}
                          />
                          {fieldErrors.colorHex ? <p className={fieldErrorClassName}>{fieldErrors.colorHex}</p> : null}
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-full px-5"
                            onClick={cancelEditing}
                            disabled={isSaving}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="rounded-full px-5"
                            onClick={() => void saveEditingTag(tag)}
                            disabled={isSaving}
                          >
                            <span className="inline-flex items-center gap-2">
                              <Save size={14} />
                              {isSaving ? 'Saving...' : 'Save'}
                            </span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <NoteTagChip tag={tag} size="md" />
                          <p className="mt-2 text-xs text-text-muted">
                            {tag.usageCount} {tag.usageCount === 1 ? 'note' : 'notes'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(tag)}
                            disabled={savingTagId != null || deletingTagId != null}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Pencil size={14} />
                            Rename
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteTag(tag)}
                            disabled={savingTagId != null || deletingTagId != null}
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-danger/35 bg-surface px-4 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <Trash2 size={14} />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </AppDialog>

      <ConfirmModal
        isOpen={pendingDeleteTag != null}
        title="Delete tag"
        description={pendingDeleteTag
          ? `Delete "${pendingDeleteTag.name}"? Existing notes will no longer show this tag.`
          : ''}
        confirmLabel="Delete tag"
        isConfirming={pendingDeleteTag != null && deletingTagId === pendingDeleteTag.id}
        onClose={() => setPendingDeleteTag(null)}
        onConfirm={confirmDeleteTag}
      />
    </>
  );
}
