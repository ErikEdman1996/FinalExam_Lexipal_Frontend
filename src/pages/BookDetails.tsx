import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Archive, ArrowLeft, ChevronDown, Clock, FileText, Pencil, Play, RotateCcw, Settings2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { BookCover } from '../components/BookCover';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { NoteModal } from '../components/NoteModal';
import { useBooks } from '../features/books/useBooks';
import { ManageNoteTagsDialog, NoteTagChip, useNoteTags } from '../features/noteTags';
import { formatDateValue } from '../utils/formatting';
import {
  deleteBook,
  deleteNote,
  getActiveSessionByBook,
  getBook,
  getNotesByBook,
  getSessionsByBook,
  updateBook,
  updateNote,
  type ApiBook,
  type ApiNote,
  type ApiNoteTagSummary,
  type ApiSession,
  type NoteTagMatch,
  type UpdateNotePayload,
} from '../api/api';

type BookDetailsTab = 'overview' | 'sessions' | 'notes';

interface SessionData {
  id: string;
  date: string;
  timestamp: string;
  createdAtMs: number;
  durationSeconds: number;
  pagesRead: number;
  startPage: number;
  endPage: number;
  reflection: string;
}

interface SessionMonthGroup {
  key: string;
  label: string;
  sessions: SessionData[];
  totalDurationSeconds: number;
  totalPagesRead: number;
}

function formatSessionDate(timestamp: string | null | undefined) {
  return formatDateValue(timestamp, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatNoteCreatedAt(timestamp: string) {
  return formatDateValue(new Date(timestamp.replace(' ', 'T')), {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }, timestamp || 'Unknown date');
}

const UNTAGGED_NOTE_STRIPE_COLOR = '#6B6259';

function getTimestampMs(timestamp: string) {
  const parsedTimestamp = new Date(timestamp.replace(' ', 'T')).getTime();

  return Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp;
}

function sortNotesByPosition(notes: ApiNote[]) {
  return [...notes].sort((left, right) => {
    if (left.pageNumber !== right.pageNumber) {
      return left.pageNumber - right.pageNumber;
    }

    const createdAtDifference = getTimestampMs(right.createdAt) - getTimestampMs(left.createdAt);

    return createdAtDifference !== 0 ? createdAtDifference : right.id - left.id;
  });
}

function getPrimaryNoteTag(note: ApiNote) {
  return note.tags[0] ?? null;
}

function getNoteStripeBackground(note: ApiNote) {
  if (note.tags.length === 0) {
    return UNTAGGED_NOTE_STRIPE_COLOR;
  }

  if (note.tags.length === 1) {
    return note.tags[0].colorHex;
  }

  const stripeSize = 100 / note.tags.length;
  const colorStops = note.tags.flatMap((tag, index) => {
    const start = index * stripeSize;
    const end = (index + 1) * stripeSize;

    return [`${tag.colorHex} ${start}%`, `${tag.colorHex} ${end}%`];
  });

  return `linear-gradient(to bottom, ${colorStops.join(', ')})`;
}

function getNoteContextLabel(note: ApiNote) {
  return note.chapterLabel?.trim() || 'Saved passage';
}

function mapApiSessionToSessionData(session: ApiSession): SessionData {
  const completedTimestamp = session.completedAt ?? session.sessionDate;
  const parsedDate = new Date(completedTimestamp);

  return {
    id: String(session.id),
    date: formatSessionDate(completedTimestamp),
    timestamp: completedTimestamp,
    createdAtMs: Number.isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime(),
    durationSeconds: Math.max(0, session.durationSeconds),
    pagesRead: Math.max(0, session.pagesRead || session.endPage - session.startPage),
    startPage: session.startPage,
    endPage: session.endPage,
    reflection: session.reflection?.trim() || '',
  };
}

function formatDuration(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function padDurationUnit(value: number) {
  return String(value).padStart(2, '0');
}

function formatCompactDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${padDurationUnit(minutes)}m`;
  }

  return `${minutes}m ${padDurationUnit(seconds)}s`;
}

function formatSessionMonth(timestamp: string) {
  return formatDateValue(timestamp, {
    month: 'short',
    year: 'numeric',
  });
}

function getSessionMonthKey(session: SessionData) {
  const date = new Date(session.timestamp);

  if (Number.isNaN(date.getTime())) {
    return 'unknown';
  }

  return `${date.getFullYear()}-${padDurationUnit(date.getMonth() + 1)}`;
}

function groupSessionsByMonth(sessions: SessionData[]) {
  const groups = new Map<string, SessionMonthGroup>();

  sessions.forEach((session) => {
    const key = getSessionMonthKey(session);
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.sessions.push(session);
      existingGroup.totalDurationSeconds += session.durationSeconds;
      existingGroup.totalPagesRead += session.pagesRead;
      return;
    }

    groups.set(key, {
      key,
      label: key === 'unknown' ? 'Unknown date' : formatSessionMonth(session.timestamp),
      sessions: [session],
      totalDurationSeconds: session.durationSeconds,
      totalPagesRead: session.pagesRead,
    });
  });

  return Array.from(groups.values());
}

function formatSessionPace(session: SessionData) {
  const minutes = session.durationSeconds / 60;

  if (minutes <= 0 || session.pagesRead <= 0) {
    return '0 pp/min';
  }

  return `${(session.pagesRead / minutes).toFixed(1)} pp/min`;
}

function calculateCompletionPercentage(book: ApiBook) {
  if (book.totalPages <= 0) {
    return 0;
  }

  return (book.readPages / book.totalPages) * 100;
}

interface SessionsSummaryStatProps {
  label: string;
  value: string | number;
}

function SessionsSummaryStat({ label, value }: SessionsSummaryStatProps) {
  return (
    <div className="min-w-0 rounded-[12px] border border-border bg-surface-alt px-3 py-3">
      <p className="truncate text-[0.62rem] font-medium uppercase text-text-subtle">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

interface SessionDetailMetricProps {
  label: string;
  value: string | number;
  variant?: 'default' | 'accent';
}

function SessionDetailMetric({
  label,
  value,
  variant = 'default',
}: SessionDetailMetricProps) {
  return (
    <div className={`rounded-[12px] px-3 py-3 text-center ${variant === 'accent' ? 'bg-brand-soft/45' : 'bg-surface-alt'}`}>
      <p className="truncate text-[0.62rem] font-medium uppercase text-text-subtle">{label}</p>
      <p className={`mt-1 truncate text-sm font-semibold ${variant === 'accent' ? 'text-brand-strong' : 'text-text'}`}>{value}</p>
    </div>
  );
}

interface SessionExpandedDetailsProps {
  session: SessionData;
  isMobile?: boolean;
}

function SessionExpandedDetails({
  session,
  isMobile = false,
}: SessionExpandedDetailsProps) {
  if (isMobile) {
    return (
      <div className="border-t border-border px-2.5 pb-2.5 pt-2.5">
        <div className="grid grid-cols-3 gap-2">
          <SessionDetailMetric label="Duration" value={formatCompactDuration(session.durationSeconds)} />
          <SessionDetailMetric label="Pages" value={session.pagesRead} variant="accent" />
          <SessionDetailMetric label="Range" value={`${session.startPage}-${session.endPage}`} />
        </div>

        {session.reflection ? (
          <div className="mt-2 rounded-[12px] border border-border bg-surface-muted/55 px-3 py-2.5">
            <p className="text-[0.62rem] font-medium uppercase text-text-subtle">Reflection</p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm italic leading-6 text-text">
              "{session.reflection}"
            </p>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="border-t border-border bg-surface px-4 py-3">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.22fr)]">
        <div className="rounded-[12px] border border-border bg-surface-muted/45 px-4 py-3">
          <p className="text-[0.68rem] font-medium uppercase text-text-subtle">Reflection</p>
          <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${session.reflection ? 'italic text-text' : 'text-text-muted'}`}>
            {session.reflection ? `"${session.reflection}"` : 'No reflection recorded.'}
          </p>
        </div>

        <div className="self-start">
          <SessionDetailMetric label="Pace" value={formatSessionPace(session)} />
        </div>
      </div>
    </div>
  );
}

interface SessionsTabProps {
  sessions: SessionData[];
  bookTotalPages: number;
  expandedSessionId: string | null;
  onToggleSession: (sessionId: string) => void;
}

function SessionsTab({
  sessions,
  bookTotalPages,
  expandedSessionId,
  onToggleSession,
}: SessionsTabProps) {
  const sessionGroups = useMemo(() => groupSessionsByMonth(sessions), [sessions]);
  const sessionSummary = useMemo(
    () => sessions.reduce(
      (summary, session) => ({
        totalDurationSeconds: summary.totalDurationSeconds + session.durationSeconds,
        totalPagesRead: summary.totalPagesRead + session.pagesRead,
      }),
      { totalDurationSeconds: 0, totalPagesRead: 0 },
    ),
    [sessions],
  );

  return (
    <section className="px-4 pb-6 md:rounded-[28px] md:border md:border-border md:bg-surface md:p-6 md:shadow-[0_16px_32px_rgba(31,41,55,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Sessions</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Reading sessions</h2>
          <p className="mt-2 text-sm text-text-muted">
            Prior reading sessions for this book, newest first.
          </p>
          <div className="mt-5 hidden items-center gap-3 text-sm font-medium text-text-muted md:flex">
            <span>
              <span className="font-semibold text-text">{sessions.length}</span> sessions
            </span>
            <span className="h-1 w-1 rounded-full bg-text-subtle" aria-hidden="true" />
            <span>
              <span className="font-semibold text-text">{formatCompactDuration(sessionSummary.totalDurationSeconds)}</span> total
            </span>
            <span className="h-1 w-1 rounded-full bg-text-subtle" aria-hidden="true" />
            <span>
              <span className="font-semibold text-text">{sessionSummary.totalPagesRead} / {bookTotalPages}</span> pp
            </span>
          </div>
        </div>

      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 md:hidden">
        <SessionsSummaryStat label="Sessions" value={sessions.length} />
        <SessionsSummaryStat label="Total" value={formatCompactDuration(sessionSummary.totalDurationSeconds)} />
        <SessionsSummaryStat label="Pages" value={`${sessionSummary.totalPagesRead} / ${bookTotalPages}`} />
      </div>

      {sessions.length === 0 ? (
        <div className="mt-5 rounded-[20px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
          No sessions yet. Start reading from Overview to build your history.
        </div>
      ) : (
        <>
          <div className="mt-5 hidden overflow-hidden rounded-[14px] border border-border bg-surface-alt md:block">
            <div className="grid grid-cols-[minmax(10rem,1.45fr)_minmax(5rem,0.68fr)_minmax(3.5rem,0.42fr)_minmax(5.25rem,0.62fr)_2rem] gap-3 border-b border-border bg-surface px-4 py-2.5 text-[0.64rem] font-medium uppercase text-text-subtle">
              <span>Date</span>
              <span className="text-right">Duration</span>
              <span className="text-right">Pages</span>
              <span className="text-right">Range</span>
              <span />
            </div>

            {sessionGroups.map((group) => (
              <div key={group.key} className="border-b border-border last:border-b-0">
                <div className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-text">{group.label}</h3>
                  <p className="text-xs font-medium text-text-subtle">
                    {group.sessions.length} sess. - {group.totalPagesRead} pp
                  </p>
                </div>

                <div className="divide-y divide-border">
                  {group.sessions.map((session) => {
                    const isExpanded = expandedSessionId === session.id;
                    const hasReflection = session.reflection.length > 0;

                    return (
                      <article key={session.id} className={isExpanded ? 'bg-surface/70' : 'bg-surface-alt'}>
                        <button
                          type="button"
                          onClick={() => onToggleSession(session.id)}
                          aria-expanded={isExpanded}
                          className="grid w-full grid-cols-[minmax(10rem,1.45fr)_minmax(5rem,0.68fr)_minmax(3.5rem,0.42fr)_minmax(5.25rem,0.62fr)_2rem] items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasReflection ? 'bg-brand' : 'bg-transparent'}`}
                              aria-hidden="true"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-text">{session.date}</span>
                              <span className="mt-0.5 block truncate text-xs text-text-subtle">
                                {session.startPage}-{session.endPage} pp
                              </span>
                            </span>
                          </span>
                          <span className="text-right text-sm font-medium tabular-nums text-text-muted">
                            {formatCompactDuration(session.durationSeconds)}
                          </span>
                          <span className="text-right text-sm font-semibold tabular-nums text-text">
                            {session.pagesRead}
                          </span>
                          <span className="text-right text-sm font-medium tabular-nums text-text-muted">
                            {session.startPage}-{session.endPage}
                          </span>
                          <span className="flex justify-end">
                            <ChevronDown
                              size={16}
                              className={`text-text-subtle transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              aria-hidden="true"
                            />
                          </span>
                        </button>

                        {isExpanded ? (
                          <SessionExpandedDetails session={session} />
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-5 md:hidden">
            {sessionGroups.map((group) => (
              <section key={group.key}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-text">{group.label}</h3>
                  <p className="shrink-0 text-[0.68rem] font-medium text-text-subtle">
                    {group.sessions.length} sess. - {group.totalPagesRead} pp
                  </p>
                </div>

                <div className="mt-2 space-y-2">
                  {group.sessions.map((session) => {
                    const isExpanded = expandedSessionId === session.id;
                    const hasReflection = session.reflection.length > 0;

                    return (
                      <article
                        key={session.id}
                        className={`overflow-hidden rounded-[16px] border transition-colors ${
                          isExpanded ? 'border-brand bg-surface shadow-[inset_0_0_0_1px_rgba(216,122,90,0.18)]' : 'border-border bg-surface-alt'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleSession(session.id)}
                          aria-expanded={isExpanded}
                          className="w-full touch-manipulation px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                        >
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${hasReflection ? 'bg-brand' : 'bg-transparent'}`}
                                  aria-hidden="true"
                                />
                                <p className="truncate text-sm font-semibold text-text">{session.date}</p>
                              </div>
                              <p className="mt-1 pl-3.5 text-xs font-medium tabular-nums text-text-muted">
                                {formatCompactDuration(session.durationSeconds)} - {session.pagesRead} pp
                              </p>
                            </div>
                            <div className="flex items-center pt-0.5">
                              <ChevronDown
                                size={15}
                                className={`shrink-0 text-text-subtle transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                              />
                            </div>
                          </div>
                        </button>

                        {isExpanded ? (
                          <SessionExpandedDetails session={session} isMobile />
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

interface NotesFilterStripProps {
  tags: ApiNoteTagSummary[];
  activeTagIds: number[];
  tagMatch: NoteTagMatch;
  noteCount: number;
  isUpdating: boolean;
  isLoadingTags: boolean;
  onToggleTag: (tagId: number) => void;
  onTagMatchChange: (tagMatch: NoteTagMatch) => void;
  onClear: () => void;
}

function NotesFilterStrip({
  tags,
  activeTagIds,
  tagMatch,
  noteCount,
  isUpdating,
  isLoadingTags,
  onToggleTag,
  onTagMatchChange,
  onClear,
}: NotesFilterStripProps) {
  const activeIdSet = new Set(activeTagIds);
  const hasActiveFilters = activeTagIds.length > 0;

  return (
    <div className="mt-5 flex flex-col gap-3 border-y border-border py-3 md:flex-row md:items-center md:justify-between">
      <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 md:pb-0">
        <span className="hidden shrink-0 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-text-subtle md:inline-flex">
          Filter
        </span>
        <button
          type="button"
          onClick={onClear}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors ${
            hasActiveFilters
              ? 'border-border bg-surface text-text-muted hover:bg-surface-muted hover:text-text'
              : 'border-brand bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.22)]'
          }`}
          aria-pressed={!hasActiveFilters}
        >
          <span>All</span>
          <span className={hasActiveFilters ? 'text-text-subtle' : 'text-text-on-brand/75'}>{noteCount}</span>
        </button>

        {isLoadingTags ? (
          <span className="shrink-0 text-xs text-text-muted">Loading tags...</span>
        ) : tags.length === 0 ? (
          <span className="shrink-0 text-xs text-text-muted">No tags yet.</span>
        ) : (
          tags.map((tag) => {
            const isActive = activeIdSet.has(tag.id);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className={`inline-flex h-8 max-w-[11rem] shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-surface text-text shadow-[0_8px_18px_rgba(31,41,55,0.08)]'
                    : 'border-border bg-surface-alt text-text-muted hover:bg-surface-muted hover:text-text'
                }`}
                style={{
                  borderColor: isActive ? tag.colorHex : undefined,
                }}
                aria-pressed={isActive}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.colorHex }} />
                <span className="truncate">{tag.name}</span>
                <span className="text-text-subtle">{tag.usageCount}</span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {isUpdating ? (
          <span className="text-xs font-medium text-text-subtle">Updating...</span>
        ) : null}

        {activeTagIds.length > 1 ? (
          <div className="flex h-8 rounded-full border border-border bg-surface-alt p-0.5">
            {(['ANY', 'ALL'] as const).map((option) => {
              const isActive = tagMatch === option;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onTagMatchChange(option)}
                  className={`rounded-full px-3 text-xs font-semibold transition-colors ${
                    isActive ? 'bg-brand text-text-on-brand' : 'text-text-muted hover:text-text'
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        ) : null}

      </div>
    </div>
  );
}

interface CompactNoteTagsProps {
  note: ApiNote;
  maxVisible?: number;
}

function CompactNoteTags({ note, maxVisible = 1 }: CompactNoteTagsProps) {
  if (note.tags.length === 0) {
    return (
      <span className="inline-flex max-w-full items-center rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text-subtle">
        Untagged
      </span>
    );
  }

  const visibleTags = note.tags.slice(0, maxVisible);
  const hiddenTagCount = note.tags.length - visibleTags.length;

  return (
    <span className="inline-flex min-w-0 max-w-full flex-wrap items-center gap-1.5">
      {visibleTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex max-w-[9rem] items-center gap-1.5 rounded-full border bg-surface px-2.5 py-1 text-xs font-medium text-text-muted"
          style={{ borderColor: tag.colorHex }}
          title={tag.name}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: tag.colorHex }} />
          <span className="truncate">{tag.name}</span>
        </span>
      ))}
      {hiddenTagCount > 0 ? (
        <span className="inline-flex rounded-full border border-border bg-surface px-2 py-1 text-xs font-medium text-text-subtle">
          +{hiddenTagCount}
        </span>
      ) : null}
    </span>
  );
}

interface NoteExpandedDetailsProps {
  note: ApiNote;
  isDeleting: boolean;
  isMobile?: boolean;
  onEdit: (note: ApiNote) => void;
  onDelete: (note: ApiNote) => void;
}

function NoteExpandedDetails({
  note,
  isDeleting,
  isMobile = false,
  onEdit,
  onDelete,
}: NoteExpandedDetailsProps) {
  if (!isMobile) {
    return (
      <div className="border-t border-border bg-surface px-4 py-3">
        <div className="flex flex-col gap-3 rounded-[12px] border border-border bg-surface-alt px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-text-subtle">Tags</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {note.tags.length > 0 ? (
                note.tags.map((tag) => <NoteTagChip key={tag.id} tag={tag} />)
              ) : (
                <span className="text-xs font-medium text-text-subtle">Untagged</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(note)}
              disabled={isDeleting}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Pencil size={13} />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDelete(note)}
              disabled={isDeleting}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-danger/35 bg-surface px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Trash2 size={13} />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-brand/20 px-3 pb-3 pt-3">
      <div className="rounded-[12px] border border-border bg-surface-alt px-4 py-3">
        <p className="text-[0.66rem] font-semibold uppercase tracking-[0.18em] text-text-subtle">Details</p>
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-subtle">Page</span>
            <span className="font-semibold tabular-nums text-text">p. {note.pageNumber}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-subtle">Chapter</span>
            <span className="min-w-0 truncate text-right font-medium text-text">{getNoteContextLabel(note)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-text-subtle">Saved</span>
            <span className="text-right text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
              {formatNoteCreatedAt(note.createdAt)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {note.tags.length > 0 ? (
            note.tags.map((tag) => <NoteTagChip key={tag.id} tag={tag} />)
          ) : (
            <span className="text-xs font-medium text-text-subtle">Untagged</span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onEdit(note)}
            disabled={isDeleting}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(note)}
            disabled={isDeleting}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-danger/35 bg-surface px-3 text-sm font-medium text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 size={13} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface NotesTabProps {
  notes: ApiNote[];
  availableTags: ApiNoteTagSummary[];
  selectedTagIds: number[];
  tagMatch: NoteTagMatch;
  isNotesLoading: boolean;
  isTagsLoading: boolean;
  notesError: string | null;
  tagLoadError: string | null;
  deletingNoteId: number | null;
  expandedNoteId: number | null;
  onToggleNote: (noteId: number) => void;
  onToggleTag: (tagId: number) => void;
  onTagMatchChange: (tagMatch: NoteTagMatch) => void;
  onClearTagFilters: () => void;
  onManageTags: () => void;
  onEditNote: (note: ApiNote) => void;
  onDeleteNote: (note: ApiNote) => void;
}

function NotesTab({
  notes,
  availableTags,
  selectedTagIds,
  tagMatch,
  isNotesLoading,
  isTagsLoading,
  notesError,
  tagLoadError,
  deletingNoteId,
  expandedNoteId,
  onToggleNote,
  onToggleTag,
  onTagMatchChange,
  onClearTagFilters,
  onManageTags,
  onEditNote,
  onDeleteNote,
}: NotesTabProps) {
  const sortedNotes = useMemo(() => sortNotesByPosition(notes), [notes]);

  return (
    <section className="md:rounded-[28px] md:border md:border-border md:bg-surface md:p-6 md:shadow-[0_16px_32px_rgba(31,41,55,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-text-subtle">Saved passages</p>
          <h2 className="mt-2 text-2xl font-semibold text-text">Notes</h2>
          <p className="mt-2 hidden text-sm text-text-muted md:block">
            Notes are added during active reading sessions and stay attached to this book.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onManageTags}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface px-3 text-sm font-medium text-text transition-colors hover:bg-surface-alt"
            aria-label="Manage tags"
          >
            <Settings2 size={14} />
            <span className="hidden sm:inline">Manage tags</span>
          </button>
        </div>
      </div>

      {notesError ? (
        <div className="mt-5 rounded-[16px] border border-danger/30 bg-danger-soft px-4 py-4 text-sm text-danger">
          {notesError}
        </div>
      ) : null}

      {tagLoadError ? (
        <div className="mt-5 rounded-[16px] border border-danger/30 bg-danger-soft px-4 py-4 text-sm text-danger">
          {tagLoadError}
        </div>
      ) : null}

      <NotesFilterStrip
        tags={availableTags}
        activeTagIds={selectedTagIds}
        tagMatch={tagMatch}
        noteCount={notes.length}
        isUpdating={isNotesLoading && notes.length > 0}
        isLoadingTags={isTagsLoading}
        onToggleTag={onToggleTag}
        onTagMatchChange={onTagMatchChange}
        onClear={onClearTagFilters}
      />

      {isNotesLoading && notes.length === 0 ? (
        <div className="mt-5 rounded-[20px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
          Loading notes...
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="mt-5 rounded-[20px] border border-border bg-surface-alt px-4 py-8 text-center text-sm text-text-muted">
          {selectedTagIds.length > 0
            ? 'No notes match the selected tags.'
            : 'No notes for this book yet. Add one during an active reading session.'}
        </div>
      ) : (
        <>
          <div className="mt-5 hidden overflow-hidden rounded-[16px] border border-border bg-surface-alt md:block">
            <div className="divide-y divide-border">
              {sortedNotes.map((note) => {
                const isExpanded = expandedNoteId === note.id;
                const isDeleting = deletingNoteId === note.id;

                return (
                  <article
                    key={note.id}
                    className={isExpanded ? 'bg-surface/70 shadow-[inset_0_0_0_1px_rgba(216,122,90,0.55)]' : 'bg-surface-alt'}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleNote(note.id)}
                      aria-expanded={isExpanded}
                      className="grid w-full grid-cols-[0.35rem_minmax(0,1fr)_2rem] gap-x-3 px-4 py-3 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                    >
                      <span
                        className="h-full min-h-14 w-1 rounded-full"
                        style={{ background: getNoteStripeBackground(note) }}
                        aria-hidden="true"
                      />
                      <span className="min-w-0">
                        <span className="grid grid-cols-[auto_minmax(6rem,0.75fr)_minmax(18rem,1.35fr)_minmax(7.5rem,auto)] items-center gap-4">
                          <span className="text-sm font-semibold tabular-nums text-text">p. {note.pageNumber}</span>
                          <span className="min-w-0 truncate text-sm font-medium text-text-muted">
                            {getNoteContextLabel(note)}
                          </span>
                          <span className="min-w-0">
                            <CompactNoteTags note={note} maxVisible={4} />
                          </span>
                          <span className="text-right text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-text-subtle">
                            {formatNoteCreatedAt(note.createdAt)}
                          </span>
                        </span>
                        <span
                          className="mt-3 block min-w-0 overflow-hidden break-words text-sm leading-relaxed text-text"
                          style={isExpanded
                            ? undefined
                            : {
                                display: '-webkit-box',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                              }}
                        >
                          {note.quotedText}
                        </span>
                      </span>
                      <span className="flex justify-end pt-0.5">
                        <ChevronDown
                          size={16}
                          className={`text-text-subtle transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </span>
                    </button>

                    {isExpanded ? (
                      <NoteExpandedDetails
                        note={note}
                        isDeleting={isDeleting}
                        onEdit={onEditNote}
                        onDelete={onDeleteNote}
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div className="mt-4 space-y-2 md:hidden">
            {sortedNotes.map((note) => {
              const isExpanded = expandedNoteId === note.id;
              const isDeleting = deletingNoteId === note.id;
              const primaryTag = getPrimaryNoteTag(note);

              return (
                <article
                  key={note.id}
                  className={`overflow-hidden rounded-[16px] border transition-colors ${
                    isExpanded
                      ? 'border-brand bg-surface shadow-[inset_0_0_0_1px_rgba(216,122,90,0.18)]'
                      : 'border-border bg-surface-alt'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleNote(note.id)}
                    aria-expanded={isExpanded}
                    className="grid w-full grid-cols-[0.25rem_minmax(0,1fr)] gap-3 px-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand"
                  >
                    <span
                      className="h-full min-h-16 w-1 rounded-full"
                      style={{ background: getNoteStripeBackground(note) }}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className="flex items-start justify-between gap-3">
                        <span className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium text-text-muted">
                          <span className="font-semibold tabular-nums text-text">p. {note.pageNumber}</span>
                          <span className="text-text-subtle">-</span>
                          <span className="max-w-[8rem] truncate">{getNoteContextLabel(note)}</span>
                          <span
                            className="inline-flex max-w-[8rem] items-center rounded-full border bg-surface px-2 py-0.5 text-[0.68rem] font-semibold text-text-muted"
                            style={{ borderColor: primaryTag?.colorHex ?? undefined }}
                          >
                            <span className="truncate">{primaryTag?.name ?? 'Untagged'}</span>
                          </span>
                        </span>
                        <ChevronDown
                          size={15}
                          className={`shrink-0 text-text-subtle transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </span>
                      <span
                        className="mt-2 block overflow-hidden break-words text-sm leading-relaxed text-text"
                        style={isExpanded
                          ? undefined
                          : {
                              display: '-webkit-box',
                              WebkitBoxOrient: 'vertical',
                              WebkitLineClamp: 3,
                            }}
                      >
                        {note.quotedText}
                      </span>
                    </span>
                  </button>

                  {isExpanded ? (
                    <NoteExpandedDetails
                      note={note}
                      isDeleting={isDeleting}
                      isMobile
                      onEdit={onEditNote}
                      onDelete={onDeleteNote}
                    />
                  ) : null}
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

interface BookDetailsTabsProps {
  active: BookDetailsTab;
  notesCount: number;
  sessionCount: number;
  onChange: (next: BookDetailsTab) => void;
}

function BookDetailsTabs({
  active,
  notesCount,
  sessionCount,
  onChange,
}: BookDetailsTabsProps) {
  const tabs: Array<{ key: BookDetailsTab; label: string; count: number }> = [
    { key: 'overview', label: 'Overview', count: 0 },
    { key: 'sessions', label: 'Sessions', count: sessionCount },
    { key: 'notes', label: 'Notes', count: notesCount },
  ];

  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 shadow-[0_8px_18px_rgba(31,41,55,0.04)] sm:w-fit">
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-brand text-text-on-brand shadow-[0_6px_14px_rgba(154,74,66,0.24)]'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span>{tab.label}</span>
            {tab.key === 'overview' ? null : (
              <span className={`text-xs ${isActive ? 'text-text-on-brand/80' : 'text-text-subtle'}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function BookDetails() {
  const { bookId } = useParams();

  return <BookDetailsContent key={bookId ?? 'missing-book'} bookId={bookId} />;
}

function BookDetailsContent({ bookId }: { bookId?: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshBooks, refreshLibraryItems, removeBook, upsertBook } = useBooks();
  const [book, setBook] = useState<ApiBook | null>(null);
  const [activeDraft, setActiveDraft] = useState<ApiSession | null>(null);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [notes, setNotes] = useState<ApiNote[]>([]);
  const [editingNote, setEditingNote] = useState<ApiNote | null>(null);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<ApiNote | null>(null);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [tagMatch, setTagMatch] = useState<NoteTagMatch>('ANY');
  const [isLoading, setIsLoading] = useState(true);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isUpdatingArchiveStatus, setIsUpdatingArchiveStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const noteTags = useNoteTags();
  const activeTab: BookDetailsTab = searchParams.get('tab') === 'sessions'
    ? 'sessions'
    : searchParams.get('tab') === 'notes'
      ? 'notes'
      : 'overview';

  useEffect(() => {
    let isMounted = true;

    const loadBookDetails = async () => {
      if (!bookId) {
        if (isMounted) {
          setErrorMessage('Missing book id.');
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [bookResponse, sessionsResponse, activeDraftResponse] = await Promise.all([
          getBook(bookId),
          getSessionsByBook(bookId),
          getActiveSessionByBook(bookId),
        ]);

        const completedSessions = sessionsResponse
          .map(mapApiSessionToSessionData)
          .sort((left, right) => right.createdAtMs - left.createdAtMs);

        if (isMounted) {
          setBook(bookResponse);
          setActiveDraft(activeDraftResponse);
          setSessions(completedSessions);
        }
      } catch (error) {
        console.error('Error loading book details:', error);

        if (isMounted) {
          setErrorMessage('Could not load book details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadBookDetails();

    return () => {
      isMounted = false;
    };
  }, [bookId]);

  const refreshNotes = useCallback(async () => {
    if (!bookId) {
      setNotes([]);
      setNotesError(null);
      setIsNotesLoading(false);
      return;
    }

    try {
      setIsNotesLoading(true);
      setNotesError(null);
      const notesResponse = await getNotesByBook(bookId, {
        tagIds: selectedTagIds,
        tagMatch,
      });
      setNotes(notesResponse);
    } catch (error) {
      console.error('Error loading notes:', error);
      setNotesError('Could not load notes right now.');
    } finally {
      setIsNotesLoading(false);
    }
  }, [bookId, selectedTagIds, tagMatch]);

  useEffect(() => {
    void refreshNotes();
  }, [refreshNotes]);

  const applySelectedTagIds = (nextTagIds: number[]) => {
    const uniqueTagIds = Array.from(new Set(nextTagIds));
    setSelectedTagIds(uniqueTagIds);
    setExpandedNoteId(null);

    if (uniqueTagIds.length < 2) {
      setTagMatch('ANY');
    }
  };

  const handleToggleTagFilter = (tagId: number) => {
    if (selectedTagIds.includes(tagId)) {
      applySelectedTagIds(selectedTagIds.filter((selectedTagId) => selectedTagId !== tagId));
      return;
    }

    applySelectedTagIds([...selectedTagIds, tagId]);
  };

  const handleClearTagFilters = () => {
    applySelectedTagIds([]);
  };

  const handleDeleteBook = async () => {
    if (!bookId || isDeleting) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteBook(bookId);
      removeBook(bookId);
      void refreshBooks({ silent: true }).catch((error) => {
        console.error('Error refreshing books after delete:', error);
      });
      void refreshLibraryItems({ silent: true }).catch((error) => {
        console.error('Error refreshing library items after delete:', error);
      });
      void navigate('/library');
    } catch (error) {
      console.error('Error deleting book:', error);
      setErrorMessage('Could not delete this book right now.');
      setIsDeleting(false);
    }
  };

  const handleArchiveStatusToggle = async () => {
    if (!book || isUpdatingArchiveStatus) {
      return;
    }

    const isArchived = book.status === 'ARCHIVED';

    try {
      setIsUpdatingArchiveStatus(true);
      const updatedBook = await updateBook(book.id, {
        status: isArchived ? 'ACTIVE' : 'ARCHIVED',
      });
      setBook(updatedBook);
      upsertBook(updatedBook);
      void refreshBooks({ silent: true }).catch((error) => {
        console.error('Error refreshing books after archive status update:', error);
      });
      void refreshLibraryItems({ silent: true }).catch((error) => {
        console.error('Error refreshing library items after archive status update:', error);
      });

      if (!isArchived) {
        void navigate('/library');
      }
    } catch (error) {
      console.error('Error updating archive status:', error);
      setErrorMessage('Could not update this book right now.');
    } finally {
      setIsUpdatingArchiveStatus(false);
    }
  };

  const handleUpdateNote = async ({
    quotedText,
    pageNumber,
    chapterLabel,
    tagIds,
  }: {
    quotedText: string;
    pageNumber: number;
    chapterLabel?: string;
    tagIds?: number[];
  }) => {
    if (!editingNote) {
      throw new Error('Note not found.');
    }

    const payload: UpdateNotePayload = {};
    const nextChapterLabel = chapterLabel?.trim() ?? '';
    const currentChapterLabel = editingNote.chapterLabel?.trim() ?? '';
    const currentTagIds = editingNote.tags.map((tag) => tag.id);
    const nextTagIds = tagIds ?? currentTagIds;

    payload.tagIds = nextTagIds;

    if (quotedText !== editingNote.quotedText) {
      payload.quotedText = quotedText;
    }

    if (pageNumber !== editingNote.pageNumber) {
      payload.pageNumber = pageNumber;
    }

    if (nextChapterLabel !== currentChapterLabel) {
      payload.chapterLabel = nextChapterLabel || null;
    }

    await updateNote(editingNote.id, payload);
    await noteTags.refreshTags().catch((error) => {
      console.error('Error refreshing note tags after note update:', error);
    });
    await refreshNotes();

    setEditingNote(null);
  };

  const handleDeleteNote = async () => {
    if (!pendingDeleteNote || deletingNoteId != null) {
      return;
    }

    try {
      setDeletingNoteId(pendingDeleteNote.id);
      setNotesError(null);
      await deleteNote(pendingDeleteNote.id);

      if (editingNote?.id === pendingDeleteNote.id) {
        setEditingNote(null);
      }

      if (expandedNoteId === pendingDeleteNote.id) {
        setExpandedNoteId(null);
      }

      await noteTags.refreshTags().catch((error) => {
        console.error('Error refreshing note tags after note delete:', error);
      });
      await refreshNotes();
      setPendingDeleteNote(null);
    } catch (error) {
      console.error('Error deleting note:', error);
      setNotesError('Could not delete this note right now.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  const handleDeleteTag = async (tagId: number) => {
    const nextSelectedTagIds = selectedTagIds.filter((selectedTagId) => selectedTagId !== tagId);

    await noteTags.deleteTag(tagId);
    applySelectedTagIds(nextSelectedTagIds);

    if (nextSelectedTagIds.length === selectedTagIds.length) {
      await refreshNotes();
    }
  };

  const handleTabChange = (nextTab: BookDetailsTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams);
  };

  const handleToggleSession = (sessionId: string) => {
    setExpandedSessionId((currentSessionId) => (currentSessionId === sessionId ? null : sessionId));
  };

  const handleToggleNote = (noteId: number) => {
    setExpandedNoteId((currentNoteId) => (currentNoteId === noteId ? null : noteId));
  };

  const completionPercentage = useMemo(
    () => (book ? calculateCompletionPercentage(book) : 0),
    [book],
  );

  const activeDraftCurrentPage = activeDraft
    ? Math.max(activeDraft.endPage, activeDraft.startPage)
    : 0;

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-text-muted sm:px-6 lg:px-8">
          Loading book details...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !book) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-danger">{errorMessage ?? 'Book not found.'}</p>
          <Link
            to="/library"
            className="mt-4 inline-flex text-sm text-text-muted transition-colors hover:text-text"
          >
            Go back to Library
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <motion.div
      className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link
          to="/library"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={16} />
          Back to library
        </Link>

        <div className="mt-5 flex justify-start">
          <BookDetailsTabs
            active={activeTab}
            notesCount={notes.length}
            sessionCount={sessions.length}
            onChange={handleTabChange}
          />
        </div>

        <div className="mt-6 space-y-6">
          {activeTab === 'overview' ? (
            <>
            <section className="rounded-[32px] border border-border bg-surface p-6 shadow-[0_18px_36px_rgba(31,41,55,0.07)] sm:p-7">
              <p className="text-[0.72rem] uppercase tracking-[0.3em] text-text-subtle">Book details</p>
              <div className="mt-3 flex items-start gap-4 sm:gap-5">
                <BookCover
                  title={book.title}
                  author={book.author}
                  coverImageUrl={book.coverImageUrl}
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-semibold tracking-[-0.04em] text-text sm:text-4xl">
                    {book.title}
                  </h1>
                  <p className="mt-2 text-base text-text-muted">{book.author}</p>
                </div>
              </div>
              <div className="mt-6 rounded-[26px] border border-border bg-surface-alt p-5">
                <div className="flex items-center justify-between text-sm text-text-muted">
                  <span>{book.readPages} / {book.totalPages} pages</span>
                  <span>{Math.round(completionPercentage)}%</span>
                </div>
                <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-500"
                    style={{ width: `${Math.max(completionPercentage, 4)}%` }}
                  />
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  onClick={() => {
                    void navigate(`/book/${book.id}/session/new`);
                  }}
                  className="rounded-full px-6 shadow-[0_12px_24px_rgba(76,167,132,0.18)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Play size={16} />
                    {activeDraft ? 'Resume Session' : 'Start Session'}
                  </span>
                </Button>
                <button
                  onClick={() => void handleArchiveStatusToggle()}
                  disabled={isUpdatingArchiveStatus}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-border-strong bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {book.status === 'ARCHIVED' ? <RotateCcw size={16} /> : <Archive size={16} />}
                  <span>
                    {isUpdatingArchiveStatus
                      ? 'Saving...'
                      : book.status === 'ARCHIVED'
                        ? 'Restore'
                        : 'Archive'}
                  </span>
                </button>
                <button
                  onClick={() => void handleDeleteBook()}
                  disabled={isDeleting}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-danger/35 bg-surface text-danger transition-colors hover:bg-danger-soft disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Delete book"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </section>

            {activeDraft ? (
              <section className="rounded-[28px] border border-brand/20 bg-brand-soft/60 p-5 shadow-[0_16px_32px_rgba(31,41,55,0.06)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-brand-strong">Active Draft</p>
                    <h2 className="mt-2 text-2xl font-semibold text-text">Resume your in-progress session</h2>
                    <p className="mt-2 text-sm text-text-muted">
                      Started {formatSessionDate(activeDraft.sessionDate)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-surface p-4 text-center">
                    <Clock size={16} className="mx-auto mb-2 text-brand-strong" />
                    <p className="text-base font-semibold text-text">{formatDuration(activeDraft.durationSeconds)}</p>
                    <p className="mt-1 text-xs text-text-muted">Time logged</p>
                  </div>
                  <div className="rounded-[20px] bg-surface p-4 text-center">
                    <FileText size={16} className="mx-auto mb-2 text-accent-strong" />
                    <p className="text-base font-semibold text-text">{activeDraftCurrentPage}</p>
                    <p className="mt-1 text-xs text-text-muted">Current page</p>
                  </div>
                </div>
              </section>
            ) : null}
            </>
          ) : null}

          {activeTab === 'sessions' ? (
            <SessionsTab
              sessions={sessions}
              bookTotalPages={book.totalPages}
              expandedSessionId={expandedSessionId}
              onToggleSession={handleToggleSession}
            />
          ) : null}

          {activeTab === 'notes' ? (
            <NotesTab
              notes={notes}
              availableTags={noteTags.tags}
              selectedTagIds={selectedTagIds}
              tagMatch={tagMatch}
              isNotesLoading={isNotesLoading}
              isTagsLoading={noteTags.isLoading}
              notesError={notesError}
              tagLoadError={noteTags.errorMessage}
              deletingNoteId={deletingNoteId}
              expandedNoteId={expandedNoteId}
              onToggleNote={handleToggleNote}
              onToggleTag={handleToggleTagFilter}
              onTagMatchChange={setTagMatch}
              onClearTagFilters={handleClearTagFilters}
              onManageTags={() => setIsTagManagerOpen(true)}
              onEditNote={setEditingNote}
              onDeleteNote={setPendingDeleteNote}
            />
          ) : null}
        </div>
      </div>

      <BottomNav />

      <NoteModal
        isOpen={editingNote != null}
        heading="Edit Note"
        submitLabel="Save note"
        bookTotalPages={book.totalPages}
        initialQuotedText={editingNote?.quotedText ?? ''}
        initialPageNumber={editingNote?.pageNumber ?? null}
        initialChapterLabel={editingNote?.chapterLabel ?? ''}
        initialTagIds={editingNote?.tags.map((tag) => tag.id) ?? []}
        availableTags={noteTags.tags}
        isTagsLoading={noteTags.isLoading}
        tagLoadError={noteTags.errorMessage}
        submitTagIdsWhenEmpty
        onCreateTag={noteTags.createTag}
        onClose={() => setEditingNote(null)}
        onSubmit={handleUpdateNote}
      />

      <ManageNoteTagsDialog
        isOpen={isTagManagerOpen}
        tags={noteTags.tags}
        isLoading={noteTags.isLoading}
        loadError={noteTags.errorMessage}
        onClose={() => setIsTagManagerOpen(false)}
        onUpdateTag={noteTags.updateTag}
        onDeleteTag={handleDeleteTag}
        onTagsChanged={async (reason) => {
          await noteTags.refreshTags().catch((error) => {
            console.error('Error refreshing note tags after tag change:', error);
          });

          if (reason === 'update') {
            await refreshNotes();
          }
        }}
      />

      <ConfirmModal
        isOpen={pendingDeleteNote != null}
        title="Delete note"
        description={pendingDeleteNote
          ? `Delete this saved passage from page ${pendingDeleteNote.pageNumber}? This action cannot be undone.`
          : ''}
        confirmLabel="Delete note"
        isConfirming={pendingDeleteNote != null && deletingNoteId === pendingDeleteNote.id}
        onClose={() => setPendingDeleteNote(null)}
        onConfirm={handleDeleteNote}
      />
    </motion.div>
  );
}
