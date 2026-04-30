import { useEffect, useState } from 'react';
import { ArrowUpRight, BookCopy, Clock3, StickyNote, X } from 'lucide-react';
import { ApiResponseError, getCircleMemberDetails, type CircleMemberDetailResponseDTO } from '../../api/api';
import { Button } from '../../components/Button';
import { AppDialog, AppDialogClose, AppDialogTitle } from '../../components/dialog/AppDialog';
import {
  formatCircleDate,
  formatCircleDateTime,
  formatDurationLabel,
  formatProgressLabel,
} from './utils';

type DetailTab = 'sessions' | 'notes';

interface MemberDetailsPanelProps {
  circleId: number;
  isOpen: boolean;
  memberLabel: string;
  targetUserId: number | null;
  onClose: () => void;
}

function StatusChip({ label, tone }: { label: string; tone: 'brand' | 'accent' | 'muted' }) {
  const toneClassName = tone === 'brand'
    ? 'bg-brand-soft text-brand-strong'
    : tone === 'accent'
      ? 'bg-accent-soft text-accent-strong'
      : 'bg-surface-muted text-text-muted';

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${toneClassName}`}>
      {label}
    </span>
  );
}

export function MemberDetailsPanel({
  circleId,
  isOpen,
  memberLabel,
  targetUserId,
  onClose,
}: MemberDetailsPanelProps) {
  if (!isOpen || targetUserId == null) {
    return null;
  }

  return (
    <MemberDetailsPanelContent
      key={`${circleId}:${targetUserId}`}
      circleId={circleId}
      memberLabel={memberLabel}
      targetUserId={targetUserId}
      onClose={onClose}
    />
  );
}

function MemberDetailsPanelContent({
  circleId,
  memberLabel,
  targetUserId,
  onClose,
}: Omit<MemberDetailsPanelProps, 'isOpen'> & { targetUserId: number }) {
  const [details, setDetails] = useState<CircleMemberDetailResponseDTO | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('sessions');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDetails = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setDetails(null);
        const response = await getCircleMemberDetails(circleId, targetUserId);

        if (isMounted) {
          setDetails(response);
        }
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiResponseError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Could not load member details right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      isMounted = false;
    };
  }, [circleId, targetUserId]);

  return (
    <AppDialog
      isOpen
      onClose={onClose}
      variant="sheet"
      contentClassName="relative ml-auto flex h-[92vh] w-full max-w-2xl flex-col rounded-t-[32px] border border-border bg-surface shadow-[0_24px_64px_rgba(15,23,42,0.18)] animate-in slide-in-from-bottom duration-300 sm:h-full sm:rounded-none sm:rounded-l-[32px] sm:slide-in-from-right"
    >
        <div className="border-b border-border px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.72rem] uppercase tracking-[0.28em] text-text-subtle">Circle member</p>
              <AppDialogTitle className="mt-2 text-2xl font-semibold text-text">
                {details?.userNickname?.trim() || memberLabel}
              </AppDialogTitle>
              <p className="mt-2 text-sm text-text-muted">
                Reading sessions and saved notes for this circle book.
              </p>
            </div>
            <AppDialogClose asChild>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-surface-muted"
                aria-label="Close member detail panel"
              >
                <X size={18} className="text-text-muted" />
              </button>
            </AppDialogClose>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
          {isLoading ? (
            <div className="rounded-[26px] border border-border bg-surface-alt px-4 py-12 text-center text-sm text-text-muted">
              Loading member details...
            </div>
          ) : errorMessage ? (
            <div className="rounded-[24px] border border-danger/30 bg-danger-soft px-4 py-4 text-sm text-danger">
              {errorMessage}
            </div>
          ) : !details ? null : (
            <div className="space-y-6">
              <section className="rounded-[28px] border border-border bg-surface-alt p-5 shadow-[0_12px_28px_rgba(31,41,55,0.05)]">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip
                    label={details.role === 'OWNER' ? 'Owner' : 'Member'}
                    tone={details.role === 'OWNER' ? 'brand' : 'muted'}
                  />
                  <StatusChip
                    label={details.bookStatus.toLowerCase()}
                    tone={details.bookStatus === 'ACTIVE' ? 'accent' : 'muted'}
                  />
                </div>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-3xl font-semibold text-text">
                      {details.readPages} / {details.totalPages}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      Pages read in {details.bookTitle} by {details.bookAuthor}
                    </p>
                  </div>
                  <p className="text-lg font-medium text-brand-strong">
                    {formatProgressLabel(details.progressPercentage)}
                  </p>
                </div>

                <div className="mt-4 h-3 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand transition-[width] duration-300"
                    style={{ width: `${Math.max(0, Math.min(100, details.progressPercentage))}%` }}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[20px] bg-surface p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Joined</p>
                    <p className="mt-2 text-sm font-medium text-text">{formatCircleDate(details.joinedAt)}</p>
                  </div>
                  <div className="rounded-[20px] bg-surface p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Sessions</p>
                    <p className="mt-2 text-sm font-medium text-text">{details.sessions.length}</p>
                  </div>
                  <div className="rounded-[20px] bg-surface p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Notes</p>
                    <p className="mt-2 text-sm font-medium text-text">{details.notes.length}</p>
                  </div>
                </div>
              </section>

              <div className="flex w-full gap-1 rounded-full border border-border bg-surface-muted p-1 sm:w-fit">
                {([
                  { key: 'sessions', label: 'Sessions', count: details.sessions.length },
                  { key: 'notes', label: 'Notes', count: details.notes.length },
                ] as const).map((tab) => {
                  const isActive = activeTab === tab.key;

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-brand text-text-on-brand shadow-[0_8px_18px_rgba(154,74,66,0.24)]'
                          : 'text-text-muted hover:text-text'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  );
                })}
              </div>

              {activeTab === 'sessions' ? (
                details.sessions.length === 0 ? (
                  <div className="rounded-[24px] border border-border bg-surface-alt px-4 py-10 text-center text-sm text-text-muted">
                    No reading sessions yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {details.sessions.map((session) => {
                      const hasLongReflection = (session.reflection?.length ?? 0) > 180;

                      return (
                        <article
                          key={session.sessionId}
                          className="rounded-[26px] border border-border bg-surface p-5 shadow-[0_12px_28px_rgba(31,41,55,0.05)]"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-text">{formatCircleDateTime(session.sessionDate)}</p>
                              <p className="mt-1 text-sm text-text-muted">
                                {session.completedAt
                                  ? `Completed ${formatCircleDateTime(session.completedAt)}`
                                  : 'Still in progress'}
                              </p>
                            </div>
                            <StatusChip
                              label={session.status === 'COMPLETED' ? 'Completed' : 'In progress'}
                              tone={session.status === 'COMPLETED' ? 'accent' : 'muted'}
                            />
                          </div>

                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-[18px] bg-surface-alt p-4">
                              <div className="flex items-center gap-2 text-text-muted">
                                <Clock3 size={16} />
                                <span className="text-xs uppercase tracking-[0.18em]">Duration</span>
                              </div>
                              <p className="mt-2 text-sm font-medium text-text">{formatDurationLabel(session.durationSeconds)}</p>
                            </div>
                            <div className="rounded-[18px] bg-surface-alt p-4">
                              <div className="flex items-center gap-2 text-text-muted">
                                <BookCopy size={16} />
                                <span className="text-xs uppercase tracking-[0.18em]">Pages</span>
                              </div>
                              <p className="mt-2 text-sm font-medium text-text">
                                {session.startPage} {'\u2192'} {session.endPage ?? 'in progress'}
                              </p>
                            </div>
                            <div className="rounded-[18px] bg-surface-alt p-4">
                              <div className="flex items-center gap-2 text-text-muted">
                                <ArrowUpRight size={16} />
                                <span className="text-xs uppercase tracking-[0.18em]">Words</span>
                              </div>
                              <p className="mt-2 text-sm font-medium text-text">{session.capturedWordCount}</p>
                            </div>
                          </div>

                          <div className="mt-4 rounded-[20px] bg-surface-alt p-4">
                            <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Reflection</p>
                            {!session.reflection ? (
                              <p className="mt-2 text-sm text-text-muted">No reflection saved for this session.</p>
                            ) : hasLongReflection ? (
                              <details className="mt-2 group">
                                <summary className="cursor-pointer list-none text-sm font-medium text-brand-strong">
                                  Show reflection
                                </summary>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
                                  {session.reflection}
                                </p>
                              </details>
                            ) : (
                              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
                                {session.reflection}
                              </p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )
              ) : details.notes.length === 0 ? (
                <div className="rounded-[24px] border border-border bg-surface-alt px-4 py-10 text-center text-sm text-text-muted">
                  No notes yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {details.notes.map((note) => (
                    <article
                      key={note.noteId}
                      className="rounded-[26px] border border-border bg-surface p-5 shadow-[0_12px_28px_rgba(31,41,55,0.05)]"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Saved note</p>
                          <p className="mt-2 text-sm text-text-muted">
                            Page {note.pageNumber}
                            {note.chapterLabel ? ` - ${note.chapterLabel}` : ''}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-alt">
                          <StickyNote size={16} className="text-text-muted" />
                        </div>
                      </div>

                      <blockquote className="mt-4 rounded-[20px] bg-surface-alt px-4 py-4 text-base leading-relaxed text-text">
                        &ldquo;{note.quotedText}&rdquo;
                      </blockquote>

                      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                        <span>{formatCircleDateTime(note.createdAt)}</span>
                        {note.sourceSessionId != null ? (
                          <span className="rounded-full bg-surface-alt px-3 py-1">
                            Session #{note.sourceSessionId}
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border px-6 py-4 sm:px-7">
          <Button type="button" variant="outline" className="w-full rounded-full" onClick={onClose}>
            Close
          </Button>
        </div>
    </AppDialog>
  );
}
