import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import {
  fieldErrorClassName,
  fieldHintClassName,
  fieldLabelClassName,
} from '../../components/form/inputStyles';
import { Button } from '../../components/Button';
import {
  MAX_READING_LIST_GENRE_LENGTH,
  MAX_READING_LIST_GENRES,
  normalizeGenre,
  readingListInputClassName,
} from './utils';

interface GenreEditorProps {
  id: string;
  label?: string;
  genres: string[];
  onGenresChange: (genres: string[]) => void;
  error?: string;
  onErrorClear?: () => void;
  disabled?: boolean;
}

export function GenreEditor({
  id,
  label = 'Genres',
  genres,
  onGenresChange,
  error,
  onErrorClear,
  disabled = false,
}: GenreEditorProps) {
  const [draft, setDraft] = useState('');
  const [draftError, setDraftError] = useState<string | null>(null);

  const clearErrors = () => {
    setDraftError(null);
    onErrorClear?.();
  };

  const addGenre = () => {
    const trimmed = draft.trim();

    if (!trimmed) {
      setDraftError('Enter a genre before adding it.');
      return;
    }

    if (trimmed.length > MAX_READING_LIST_GENRE_LENGTH) {
      setDraftError(`Genres must be ${MAX_READING_LIST_GENRE_LENGTH} characters or fewer.`);
      return;
    }

    if (genres.length >= MAX_READING_LIST_GENRES) {
      setDraftError(`Choose up to ${MAX_READING_LIST_GENRES} genres.`);
      return;
    }

    const normalized = normalizeGenre(trimmed);
    const isDuplicate = genres.some((genre) => normalizeGenre(genre) === normalized);

    if (isDuplicate) {
      setDraftError(`Duplicate genre: ${normalized}`);
      return;
    }

    onGenresChange([...genres, trimmed]);
    setDraft('');
    clearErrors();
  };

  const removeGenre = (target: string) => {
    onGenresChange(genres.filter((genre) => genre !== target));
    clearErrors();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    addGenre();
  };

  const message = draftError ?? error;

  return (
    <div>
      <label htmlFor={id} className={fieldLabelClassName}>
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            clearErrors();
          }}
          onKeyDown={handleKeyDown}
          maxLength={MAX_READING_LIST_GENRE_LENGTH + 1}
          className={readingListInputClassName}
          placeholder="Fantasy"
          autoComplete="off"
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0 rounded-full px-4"
          onClick={addGenre}
          disabled={disabled}
        >
          <span className="inline-flex items-center gap-2">
            <Plus size={14} />
            Add
          </span>
        </Button>
      </div>

      <p className={fieldHintClassName}>Optional, up to {MAX_READING_LIST_GENRES} genres.</p>

      {genres.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {genres.map((genre) => (
            <span
              key={genre}
              className="inline-flex max-w-full items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-strong"
            >
              <span className="truncate">{genre}</span>
              <button
                type="button"
                onClick={() => removeGenre(genre)}
                disabled={disabled}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Remove ${genre}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {message ? <p className={fieldErrorClassName}>{message}</p> : null}
    </div>
  );
}
