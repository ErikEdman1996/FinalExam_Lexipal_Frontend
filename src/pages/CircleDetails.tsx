import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Copy, Lock, UsersRound } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ApiResponseError,
  closeBookCircle,
  getBookCircle,
  leaveBookCircle,
  type BookCircleMemberSummaryDTO,
  type BookCircleReadResponseDTO,
} from '../api/api';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProgressBar } from '../components/ProgressBar';
import { MemberDetailsPanel } from '../features/bookCircles/MemberDetailsPanel';
import {
  canDrillIntoMember,
  copyTextToClipboard,
  formatCircleDate,
  formatProgressLabel,
  getCurrentCircleUserId,
  getMemberDisplayName,
  getVisibilityDescription,
  getVisibilityLabel,
} from '../features/bookCircles/utils';
import { useAuth } from '../features/auth/AuthProvider';

type PendingAction = 'close' | 'leave' | null;

function CircleChip({
  label,
  tone,
}: {
  label: string;
  tone: 'brand' | 'accent' | 'muted';
}) {
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

export default function CircleDetails() {
  const navigate = useNavigate();
  const { circleId } = useParams();
  const { profile } = useAuth();
  const [circle, setCircle] = useState<BookCircleReadResponseDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedMember, setSelectedMember] = useState<BookCircleMemberSummaryDTO | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCircle = async () => {
      if (!circleId) {
        if (isMounted) {
          setErrorMessage('Missing circle id.');
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await getBookCircle(circleId);

        if (isMounted) {
          setCircle(response);
        }
      } catch (error) {
        console.error('Error loading circle:', error);

        if (!isMounted) {
          return;
        }

        if (error instanceof ApiResponseError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Could not load this circle right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCircle();

    return () => {
      isMounted = false;
    };
  }, [circleId]);

  const currentUserId = useMemo(() => {
    return circle ? getCurrentCircleUserId(circle, profile) : null;
  }, [circle, profile]);

  const sortedMembers = useMemo(() => {
    if (!circle) {
      return [];
    }

    return [...circle.members].sort((left, right) => {
      if (left.role === 'OWNER' && right.role !== 'OWNER') {
        return -1;
      }

      if (left.role !== 'OWNER' && right.role === 'OWNER') {
        return 1;
      }

      return left.joinedAt.localeCompare(right.joinedAt);
    });
  }, [circle]);

  const handleCopyCode = async () => {
    if (!circle?.inviteCode) {
      return;
    }

    try {
      await copyTextToClipboard(circle.inviteCode);
      toast.success('Invite code copied.');
    } catch (error) {
      console.error('Error copying invite code:', error);
      toast.error('Could not copy the invite code.');
    }
  };

  const handleConfirmAction = async () => {
    if (!circle || !pendingAction || isActionSubmitting) {
      return;
    }

    try {
      setIsActionSubmitting(true);

      if (pendingAction === 'close') {
        await closeBookCircle(circle.id);
        toast.success('Circle closed.');
      } else {
        await leaveBookCircle(circle.id);
        toast.success('You left the circle.');
      }

      navigate('/circles', { replace: true });
    } catch (error) {
      console.error('Error completing circle action:', error);

      if (error instanceof ApiResponseError) {
        toast.error(error.message);
      } else {
        toast.error('Could not complete that action right now.');
      }
    } finally {
      setIsActionSubmitting(false);
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center text-text-muted sm:px-6 lg:px-8">
          Loading circle...
        </div>
        <BottomNav />
      </div>
    );
  }

  if (errorMessage || !circle) {
    return (
      <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <p className="text-lg text-danger">{errorMessage ?? 'Circle not found.'}</p>
          <button
            type="button"
            onClick={() => navigate('/circles')}
            className="mt-4 text-sm text-text-muted transition-colors hover:text-text"
          >
            Go back to circles
          </button>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen pb-24 lg:pl-60 lg:pb-0">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <button
          type="button"
          onClick={() => navigate('/circles')}
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={16} />
          Back to circles
        </button>

        <section className="mt-5 rounded-[32px] border border-border bg-surface p-6 shadow-[0_18px_36px_rgba(31,41,55,0.07)] sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-[0.72rem] uppercase tracking-[0.32em] text-text-subtle">BookCircle</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-text sm:text-4xl">
                {circle.bookTitle}
              </h1>
              <p className="mt-2 text-base text-text-muted">{circle.bookAuthor}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                <CircleChip label={getVisibilityLabel(circle.visibility)} tone="muted" />
                <CircleChip label={circle.status.toLowerCase()} tone={circle.status === 'ACTIVE' ? 'accent' : 'muted'} />
                {circle.callerIsOwner ? <CircleChip label="Owner" tone="brand" /> : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[22px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Members</p>
                  <p className="mt-2 text-2xl font-semibold text-text">{circle.currentMemberCount} / {circle.memberCap}</p>
                </div>
                <div className="rounded-[22px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Owner</p>
                  <p className="mt-2 text-lg font-semibold text-text">{circle.ownerNickname?.trim() || 'Anonymous'}</p>
                </div>
                <div className="rounded-[22px] bg-surface-muted p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Created</p>
                  <p className="mt-2 text-lg font-semibold text-text">{formatCircleDate(circle.createdAt)}</p>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-border bg-surface-alt p-4">
                <p className="text-sm font-medium text-text">Visibility</p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  {getVisibilityDescription(circle.visibility)}
                </p>
              </div>
            </div>

            <div className="w-full max-w-sm space-y-4">
              {circle.callerIsOwner ? (
                <div className="rounded-[26px] border border-border bg-surface-alt p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Invite code</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[0.28em] text-text">{circle.inviteCode}</p>
                  <Button type="button" className="mt-4 w-full rounded-full" onClick={() => void handleCopyCode()}>
                    <span className="inline-flex items-center gap-2">
                      <Copy size={16} />
                      Copy code
                    </span>
                  </Button>
                </div>
              ) : (
                <div className="rounded-[26px] border border-border bg-surface-alt p-5">
                  <p className="text-sm font-medium text-text">Circle membership</p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    Your library copy stays with you even if you leave this circle.
                  </p>
                </div>
              )}

              {circle.callerIsOwner ? (
                <Button
                  type="button"
                  className="w-full rounded-full border-danger/10 bg-danger text-white shadow-[0_12px_24px_rgba(218,87,87,0.2)] hover:bg-danger/90"
                  onClick={() => setPendingAction('close')}
                >
                  Close circle
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full border-danger/35 text-danger hover:bg-danger-soft"
                  onClick={() => setPendingAction('leave')}
                >
                  Leave circle
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.06)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Members</p>
              <h2 className="mt-2 text-2xl font-semibold text-text">Circle roster</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                Click a member to inspect sessions and notes when visibility rules allow it.
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-accent-soft">
              <UsersRound size={20} className="text-accent-strong" />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {sortedMembers.map((member) => {
              const isCurrentUser = currentUserId != null && currentUserId === member.userId;
              const canOpenDetails = canDrillIntoMember({
                callerIsOwner: circle.callerIsOwner,
                currentUserId,
                targetUserId: member.userId,
                visibility: circle.visibility,
              });

              const memberName = getMemberDisplayName({
                currentUserId,
                fallbackNickname: member.userNickname,
                targetUserId: member.userId,
              });

              const content = (
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold text-text">{memberName}</p>
                      <CircleChip label={member.role === 'OWNER' ? 'Owner' : 'Member'} tone={member.role === 'OWNER' ? 'brand' : 'muted'} />
                      {isCurrentUser ? <CircleChip label="You" tone="accent" /> : null}
                    </div>
                    <p className="mt-2 text-sm text-text-muted">Joined {formatCircleDate(member.joinedAt)}</p>
                  </div>

                  <div className="w-full max-w-md">
                    {member.progressPercentage == null ? (
                      <div className="rounded-[20px] border border-border bg-surface-alt px-4 py-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-text">
                          <Lock size={16} className="text-text-subtle" />
                          Hidden by owner
                        </div>
                        <p className="mt-2 text-sm text-text-muted">
                          Roster details stay visible, but peer progress is private in this circle.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-[20px] border border-border bg-surface-alt px-4 py-4">
                        <div className="flex items-center justify-between gap-3 text-sm text-text-muted">
                          <span>{member.readPages} / {member.totalPages} pages</span>
                          <span className="font-medium text-text">{formatProgressLabel(member.progressPercentage)}</span>
                        </div>
                        <div className="mt-3">
                          <ProgressBar current={member.readPages ?? 0} total={member.totalPages ?? 1} height="lg" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );

              if (!canOpenDetails) {
                return (
                  <div
                    key={member.userId}
                    title="Progress hidden by circle owner."
                    className="rounded-[26px] border border-border bg-surface-alt p-5"
                  >
                    {content}
                  </div>
                );
              }

              return (
                <button
                  key={member.userId}
                  type="button"
                  onClick={() => setSelectedMember(member)}
                  className="w-full rounded-[26px] border border-border bg-surface-alt p-5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface"
                >
                  {content}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <BottomNav />

      <MemberDetailsPanel
        circleId={circle.id}
        isOpen={selectedMember != null}
        memberLabel={selectedMember
          ? getMemberDisplayName({
            currentUserId,
            fallbackNickname: selectedMember.userNickname,
            targetUserId: selectedMember.userId,
          })
          : 'Member'}
        targetUserId={selectedMember?.userId ?? null}
        onClose={() => setSelectedMember(null)}
      />

      <ConfirmModal
        isOpen={pendingAction != null}
        title={pendingAction === 'close' ? 'Close circle' : 'Leave circle'}
        description={pendingAction === 'close'
          ? 'Closing the circle stops new joins and removes it from your active circles list. Existing reading data stays preserved.'
          : 'You will be removed from this circle, but your personal copy of the book will stay in your library.'}
        confirmLabel={pendingAction === 'close' ? 'Close circle' : 'Leave circle'}
        confirmingLabel={pendingAction === 'close' ? 'Closing...' : 'Leaving...'}
        isConfirming={isActionSubmitting}
        onClose={() => {
          if (!isActionSubmitting) {
            setPendingAction(null);
          }
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
