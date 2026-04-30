import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Copy, Lock, UsersRound } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ApiResponseError,
  clearBookCircleNextMeeting,
  closeBookCircle,
  getBookCircle,
  leaveBookCircle,
  removeBookCircleMember,
  type BookCircleMemberSummaryDTO,
  type BookCircleReadResponseDTO,
} from '../api/api';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProgressBar } from '../components/ProgressBar';
import { CircleChatPanel } from '../features/bookCircles/CircleChatPanel';
import { MemberDetailsPanel } from '../features/bookCircles/MemberDetailsPanel';
import { NextMeetingModal } from '../features/bookCircles/NextMeetingModal';
import { PortraitImage } from '../features/portraits/portraitAssets';
import {
  canDrillIntoMember,
  copyTextToClipboard,
  formatCircleDateTime,
  formatCircleMeetingDateTime,
  formatProgressLabel,
  getCircleMeetingTargetLabel,
  getCurrentCircleUserId,
  getMemberDisplayName,
  getVisibilityDescription,
} from '../features/bookCircles/utils';
import { useAuth } from '../features/auth/useAuth';

const POLL_INTERVAL_MS = 30_000;

type CircleDetailsTab = 'overview' | 'chat';

type CirclePendingAction =
  | { type: 'close' }
  | { type: 'leave' }
  | { type: 'clear-meeting' }
  | { type: 'remove-member'; member: BookCircleMemberSummaryDTO }
  | null;

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

function CircleDetailsTabs({
  active,
  membersLabel,
  chatLabel,
  onChange,
}: {
  active: CircleDetailsTab;
  membersLabel: string;
  chatLabel: string;
  onChange: (nextTab: CircleDetailsTab) => void;
}) {
  const tabs: Array<{ key: CircleDetailsTab; label: string; meta: string }> = [
    { key: 'overview', label: 'Overview', meta: membersLabel },
    { key: 'chat', label: 'Chat', meta: chatLabel },
  ];

  return (
    <div className="flex w-full gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 shadow-[0_8px_18px_rgba(31,41,55,0.04)] sm:w-fit">
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab.key)}
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-brand text-text-on-brand shadow-[0_6px_14px_rgba(154,74,66,0.24)]'
                : 'text-text-muted hover:text-text'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`text-xs ${isActive ? 'text-text-on-brand/80' : 'text-text-subtle'}`}>
              {tab.meta}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function CircleDetails() {
  const navigate = useNavigate();
  const { circleId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const [circle, setCircle] = useState<BookCircleReadResponseDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<CirclePendingAction>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const isRefreshingRef = useRef(false);
  const isActionSubmittingRef = useRef(false);
  const isMountedRef = useRef(false);
  const activeTab: CircleDetailsTab = searchParams.get('tab') === 'chat' ? 'chat' : 'overview';

  useEffect(() => {
    isActionSubmittingRef.current = isActionSubmitting;
  }, [isActionSubmitting]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCircle = useCallback(async (
    mode: 'initial' | 'refresh',
    options?: { force?: boolean },
  ) => {
    const force = options?.force === true;

    if (!circleId) {
      if (isMountedRef.current && mode === 'initial') {
        setErrorMessage('Missing circle id.');
        setIsLoading(false);
      }
      return false;
    }

    if (mode === 'refresh') {
      if (isRefreshingRef.current || (isActionSubmittingRef.current && !force)) {
        return false;
      }
      isRefreshingRef.current = true;
    }

    try {
      if (mode === 'initial') {
        setIsLoading(true);
        setErrorMessage(null);
      }

      const response = await getBookCircle(circleId);

      if (isMountedRef.current) {
        setCircle(response);
      }

      return true;
    } catch (error) {
      console.error('Error loading circle:', error);

      if (!isMountedRef.current) {
        return false;
      }

      if (
        mode === 'refresh'
        && error instanceof ApiResponseError
        && (error.status === 403 || error.status === 404)
      ) {
        toast.error(error.message);
        void navigate('/circles', { replace: true });
        return false;
      }

      if (mode === 'initial') {
        if (error instanceof ApiResponseError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('Could not load this circle right now.');
        }
      }

      return false;
    } finally {
      if (mode === 'initial') {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      } else {
        isRefreshingRef.current = false;
      }
    }
  }, [circleId, navigate]);

  useEffect(() => {
    const clearPollInterval = () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const startPollInterval = () => {
      clearPollInterval();
      intervalRef.current = window.setInterval(() => {
        void loadCircle('refresh');
      }, POLL_INTERVAL_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadCircle('refresh');
        startPollInterval();
      } else {
        clearPollInterval();
      }
    };

    void loadCircle('initial');

    if (document.visibilityState === 'visible') {
      startPollInterval();
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearPollInterval();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadCircle]);

  const currentUserId = useMemo(() => {
    return circle ? getCurrentCircleUserId(circle, profile) : null;
  }, [circle, profile]);

  const selectedMember = useMemo(() => {
    if (!circle || selectedMemberId == null) {
      return null;
    }

    return circle.members.find((member) => member.userId === selectedMemberId) ?? null;
  }, [circle, selectedMemberId]);

  if (circle && selectedMemberId != null && !selectedMember) {
    setSelectedMemberId(null);
  }

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

  const handleTabChange = (nextTab: CircleDetailsTab) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams);
  };

  const handleMeetingSaved = (updatedCircle: BookCircleReadResponseDTO) => {
    const hadMeeting = circle?.nextMeetingDate != null;
    setCircle(updatedCircle);
    setIsMeetingModalOpen(false);
    toast.success(hadMeeting ? 'Next meeting updated.' : 'Next meeting scheduled.');
  };

  const handleChatClosed = useCallback((reason: string) => {
    setCircle((currentCircle) => currentCircle
      ? { ...currentCircle, status: 'CLOSED' }
      : currentCircle);
    toast.error(reason);
    void loadCircle('refresh', { force: true });
  }, [loadCircle]);

  const handleChatAccessRevoked = useCallback((reason: string) => {
    toast.error(reason);
    void navigate('/circles', { replace: true });
  }, [navigate]);

  const handleConfirmAction = async () => {
    if (!circle || !pendingAction || isActionSubmitting) {
      return;
    }

    try {
      setIsActionSubmitting(true);

      if (pendingAction.type === 'close') {
        await closeBookCircle(circle.id);
        toast.success('Circle closed.');
        void navigate('/circles', { replace: true });
        return;
      }

      if (pendingAction.type === 'leave') {
        await leaveBookCircle(circle.id);
        toast.success('You left the circle.');
        void navigate('/circles', { replace: true });
        return;
      }

      if (pendingAction.type === 'clear-meeting') {
        const updatedCircle = await clearBookCircleNextMeeting(circle.id);

        if (isMountedRef.current) {
          setCircle(updatedCircle);
        }

        toast.success('Next meeting cancelled.');
        return;
      }

      await removeBookCircleMember(circle.id, pendingAction.member.userId);
      const refreshed = await loadCircle('refresh', { force: true });

      if (refreshed) {
        toast.success('Member removed from the circle.');
      } else {
        toast.success('Member removed. Refresh the page if the roster still looks outdated.');
      }
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

  const pendingActionTitle = pendingAction?.type === 'close'
    ? 'Close circle'
    : pendingAction?.type === 'leave'
      ? 'Leave circle'
      : pendingAction?.type === 'clear-meeting'
        ? 'Cancel meeting'
      : pendingAction?.type === 'remove-member'
        ? 'Remove member'
        : '';

  const pendingActionDescription = pendingAction?.type === 'close'
    ? 'Closing the circle stops new joins and removes it from your active circles list. Existing reading data stays preserved.'
    : pendingAction?.type === 'leave'
      ? 'You will be removed from this circle, but your personal copy of the book will stay in your library.'
      : pendingAction?.type === 'clear-meeting'
        ? 'This removes the scheduled next meeting for everyone in the circle until you set a new one.'
      : pendingAction?.type === 'remove-member'
        ? `Removing ${pendingAction.member.userNickname?.trim() || 'this member'} deletes their active membership and permanently blocks them from rejoining this circle.`
        : '';

  const pendingActionConfirmLabel = pendingAction?.type === 'close'
    ? 'Close circle'
    : pendingAction?.type === 'leave'
      ? 'Leave circle'
      : pendingAction?.type === 'clear-meeting'
        ? 'Cancel meeting'
      : pendingAction?.type === 'remove-member'
        ? 'Remove member'
        : '';

  const pendingActionConfirmingLabel = pendingAction?.type === 'close'
    ? 'Closing...'
    : pendingAction?.type === 'leave'
      ? 'Leaving...'
      : pendingAction?.type === 'clear-meeting'
        ? 'Cancelling...'
      : pendingAction?.type === 'remove-member'
        ? 'Removing...'
        : '';

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
          <Link
            to="/circles"
            className="mt-4 inline-flex text-sm text-text-muted transition-colors hover:text-text"
          >
            Go back to circles
          </Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <Link
          to="/circles"
          className="inline-flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={16} />
          Back to circles
        </Link>

        <div className="mt-5 grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,320px)_minmax(0,1fr)] xl:items-start">
          <aside className="space-y-4 xl:sticky xl:top-6">
            <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-6">
              <p className="text-[0.68rem] uppercase tracking-[0.32em] text-text-subtle">BookCircle</p>
              <h1 className="mt-2 break-words text-2xl font-semibold leading-tight tracking-[-0.04em] text-text sm:text-[1.75rem]">
                {circle.bookTitle}
              </h1>
              <p className="mt-1 text-sm text-text-muted">{circle.bookAuthor}</p>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-subtle">Members</dt>
                  <dd className="font-semibold text-text">
                    {circle.currentMemberCount} / {circle.memberCap}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-subtle">Owner</dt>
                  <dd className="min-w-0 truncate font-semibold text-text">
                    {circle.ownerNickname?.trim() || 'Anonymous'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-text-subtle">Created</dt>
                  <dd className="font-semibold text-text">{formatCircleDateTime(circle.createdAt)}</dd>
                </div>
              </dl>

              <p className="mt-4 rounded-[18px] bg-surface-muted p-3 text-xs leading-relaxed text-text-muted">
                {getVisibilityDescription(circle.visibility)}
              </p>
            </section>

            <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Next meeting</p>
                  <h2 className="mt-1 text-xl font-semibold text-text">Reading checkpoint</h2>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft">
                  <CalendarDays size={18} className="text-brand-strong" />
                </div>
              </div>

              {circle.nextMeetingDate ? (
                <>
                  <div className="mt-5 rounded-[22px] bg-surface-muted p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Scheduled for</p>
                    <p className="mt-2 text-base font-semibold text-text">
                      {formatCircleMeetingDateTime(circle.nextMeetingDate)}
                    </p>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-border bg-surface-alt p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Read before meeting</p>
                    <p className="mt-2 text-sm font-medium text-text">
                      {getCircleMeetingTargetLabel(circle)}
                    </p>
                  </div>

                  {circle.callerIsOwner ? (
                    <div className="mt-5 flex flex-col gap-3">
                      <Button
                        type="button"
                        className="w-full rounded-full"
                        onClick={() => setIsMeetingModalOpen(true)}
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full rounded-full border-danger/35 text-danger hover:bg-danger-soft"
                        onClick={() => setPendingAction({ type: 'clear-meeting' })}
                      >
                        Cancel meeting
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <>
                  <p className="mt-4 text-sm leading-relaxed text-text-muted">
                    No meeting scheduled yet.
                  </p>
                  {circle.callerIsOwner ? (
                    <Button
                      type="button"
                      className="mt-5 w-full rounded-full"
                      onClick={() => setIsMeetingModalOpen(true)}
                    >
                      Schedule next meeting
                    </Button>
                  ) : null}
                </>
              )}
            </section>

            {circle.callerIsOwner ? (
              <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-text-subtle">Invite code</p>
                <p className="mt-3 text-2xl font-semibold tracking-[0.24em] text-text sm:text-3xl">
                  {circle.inviteCode}
                </p>
                <Button
                  type="button"
                  className="mt-4 w-full rounded-full"
                  onClick={() => void handleCopyCode()}
                >
                  <span className="inline-flex items-center gap-2">
                    <Copy size={16} />
                    Copy code
                  </span>
                </Button>
              </section>
            ) : (
              <section className="rounded-[28px] border border-border bg-surface p-5 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-6">
                <p className="text-sm font-medium text-text">Circle membership</p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">
                  Your library copy stays with you even if you leave this circle.
                </p>
              </section>
            )}

            {circle.callerIsOwner ? (
              <Button
                type="button"
                className="w-full rounded-full border-danger/10 bg-danger text-white shadow-[0_12px_24px_rgba(218,87,87,0.2)] hover:bg-danger/90"
                onClick={() => setPendingAction({ type: 'close' })}
              >
                Close circle
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-full border-danger/35 text-danger hover:bg-danger-soft"
                onClick={() => setPendingAction({ type: 'leave' })}
              >
                Leave circle
              </Button>
            )}
          </aside>

          <div className="space-y-4">
            <CircleDetailsTabs
              active={activeTab}
              membersLabel={`${circle.currentMemberCount}/${circle.memberCap}`}
              chatLabel={circle.status === 'ACTIVE' ? 'Live' : 'Closed'}
              onChange={handleTabChange}
            />

            {activeTab === 'chat' ? (
              <CircleChatPanel
                circle={circle}
                currentUserId={currentUserId}
                onChatClosed={handleChatClosed}
                onAccessRevoked={handleChatAccessRevoked}
              />
            ) : (
              <section className="rounded-[28px] border border-border bg-surface p-4 shadow-[0_16px_34px_rgba(31,41,55,0.06)] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Members</p>
                    <h2 className="mt-1 text-xl font-semibold text-text sm:text-2xl">Circle roster</h2>
                    <p className="mt-1 text-xs text-text-muted sm:text-sm">
                      {circle.currentMemberCount} of {circle.memberCap} seats filled
                    </p>
                  </div>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-accent-soft">
                    <UsersRound size={18} className="text-accent-strong" />
                  </div>
                </div>

                <ul className="mt-4 flex flex-col gap-1">
                  {sortedMembers.map((member) => {
                    const isCurrentUser = currentUserId != null && currentUserId === member.userId;
                    const canRemoveMember = circle.callerIsOwner && member.role !== 'OWNER';
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

                    const memberPortrait = member.selectedPortrait
                      ?? (isCurrentUser ? profile?.selectedPortrait : null);
                    const isHidden = member.progressPercentage == null;

                    const progressContent = isHidden ? (
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-text-subtle">
                        <Lock size={12} />
                        Hidden
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between gap-3 text-xs text-text-muted">
                          <span>
                            {member.readPages ?? 0} / {member.totalPages ?? 0} pages
                          </span>
                          <span className="text-sm font-semibold text-text">
                            {formatProgressLabel(member.progressPercentage)}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <ProgressBar
                            current={member.readPages ?? 0}
                            total={member.totalPages ?? 1}
                            height="sm"
                          />
                        </div>
                      </div>
                    );

                    const rowContent = (
                      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                        <PortraitImage
                          assetKey={memberPortrait?.assetKey}
                          name={memberPortrait?.name ?? memberName}
                          className="h-10 w-10 shrink-0 shadow-[0_8px_18px_rgba(31,41,55,0.12)] ring-2 ring-surface sm:h-11 sm:w-11"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold text-text sm:text-base">
                              {memberName}
                            </p>
                            {member.role === 'OWNER' ? <CircleChip label="Owner" tone="brand" /> : null}
                            {isCurrentUser ? <CircleChip label="You" tone="accent" /> : null}
                          </div>
                          <p className="mt-1 text-[0.72rem] text-text-subtle sm:text-xs">
                            Joined {formatCircleDateTime(member.joinedAt)}
                          </p>

                          <div className="mt-3 sm:hidden">{progressContent}</div>
                        </div>

                        <div className="ml-auto hidden w-[200px] shrink-0 sm:block lg:w-[220px]">
                          {progressContent}
                        </div>
                      </div>
                    );

                    if (!canOpenDetails) {
                      return (
                        <li key={member.userId}>
                          <div
                            title="Progress hidden by circle owner."
                            className="rounded-[20px] px-3 py-3 sm:px-4 sm:py-3.5"
                          >
                            {rowContent}
                          </div>
                        </li>
                      );
                    }

                    return (
                      <li key={member.userId}>
                        <div className="sm:flex sm:items-center sm:gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId(member.userId)}
                            className="w-full flex-1 rounded-[20px] px-3 py-3 text-left transition-colors hover:bg-surface-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-4 sm:py-3.5"
                          >
                            {rowContent}
                          </button>

                          {canRemoveMember ? (
                            <div className="px-3 pb-3 sm:px-0 sm:pb-0 sm:pr-4">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full rounded-full border-danger/35 text-danger hover:bg-danger-soft sm:w-auto sm:min-w-[112px]"
                                onClick={() => setPendingAction({
                                  type: 'remove-member',
                                  member,
                                })}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </div>
        </div>
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
        onClose={() => setSelectedMemberId(null)}
      />

      <NextMeetingModal
        circle={circle}
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        onSaved={handleMeetingSaved}
      />

      <ConfirmModal
        isOpen={pendingAction != null}
        title={pendingActionTitle}
        description={pendingActionDescription}
        confirmLabel={pendingActionConfirmLabel}
        confirmingLabel={pendingActionConfirmingLabel}
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
