import { useEffect, useState } from 'react';
import { ArrowRight, Copy, Plus, UsersRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getMyBookCircles, type BookCircleReadResponseDTO } from '../api/api';
import { BottomNav } from '../components/BottomNav';
import { Button } from '../components/Button';
import { CreateCircleModal } from '../features/bookCircles/CreateCircleModal';
import { JoinCircleModal } from '../features/bookCircles/JoinCircleModal';
import {
  copyTextToClipboard,
  formatCircleDate,
  formatCircleMeetingRelativeDate,
  getVisibilityLabel,
} from '../features/bookCircles/utils';

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

export default function Circles() {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<BookCircleReadResponseDTO[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadCircles = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        const response = await getMyBookCircles();

        if (isMounted) {
          setCircles(response);
        }
      } catch (error) {
        console.error('Error loading circles:', error);

        if (isMounted) {
          setErrorMessage('Could not load your circles right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadCircles();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCopyCode = async (inviteCode: string) => {
    try {
      await copyTextToClipboard(inviteCode);
      toast.success('Invite code copied.');
    } catch (error) {
      console.error('Error copying invite code:', error);
      toast.error('Could not copy the invite code.');
    }
  };

  return (
    <div className="page-bg min-h-screen pb-28 lg:pl-60 lg:pb-0">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <section className="rounded-[32px] border border-border bg-surface p-6 shadow-[0_20px_48px_rgba(15,23,42,0.07)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[0.72rem] font-medium uppercase tracking-[0.32em] text-text-subtle">Shared reading</p>
              <h1 className="mt-2 text-[1.9rem] font-semibold leading-tight tracking-[-0.05em] text-text sm:text-[2.4rem]">
                BookCircles
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                Create a reading room, invite friends with a six-letter code, and keep everyone moving through the same book together.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => setIsJoinOpen(true)}>
                Join with code
              </Button>
              <Button type="button" className="rounded-full px-5" onClick={() => setIsCreateOpen(true)}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={16} />
                  Create circle
                </span>
              </Button>
            </div>
          </div>
        </section>

        <div className="mt-6">
          {isLoading ? (
            <div className="rounded-[28px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <p className="text-sm text-text-muted">Loading your circles...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-[28px] border border-danger/30 bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <p className="text-lg font-semibold text-danger">{errorMessage}</p>
              <p className="mt-2 text-sm text-text-muted">Try again in a moment.</p>
            </div>
          ) : circles.length === 0 ? (
            <div className="rounded-[32px] border border-border bg-surface px-6 py-16 text-center shadow-[0_14px_28px_rgba(31,41,55,0.05)]">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-soft">
                <UsersRound size={34} className="text-brand-strong" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-text">You&apos;re not in any book circles yet</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-muted">
                Start one with a book from your library or join a friend&apos;s circle with an invite code.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button type="button" className="rounded-full px-5" onClick={() => setIsCreateOpen(true)}>
                  Create circle
                </Button>
                <Button type="button" variant="outline" className="rounded-full px-5" onClick={() => setIsJoinOpen(true)}>
                  Join with code
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {circles.map((circle) => (
                <article
                  key={circle.id}
                  className="rounded-[28px] border border-border bg-surface p-6 text-left shadow-[0_14px_28px_rgba(31,41,55,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-alt"
                >
                  <Link
                    to={`/circles/${circle.id}`}
                    className="block rounded-[20px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-2xl font-semibold tracking-[-0.03em] text-text">{circle.bookTitle}</p>
                        <p className="mt-1 truncate text-sm text-text-muted">{circle.bookAuthor}</p>
                      </div>
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-brand-soft">
                        <UsersRound size={20} className="text-brand-strong" />
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <CircleChip label={getVisibilityLabel(circle.visibility)} tone="muted" />
                      {circle.callerIsOwner ? <CircleChip label="Owner" tone="brand" /> : null}
                      <CircleChip label={`${circle.currentMemberCount} / ${circle.memberCap}`} tone="accent" />
                    </div>

                    {circle.nextMeetingDate ? (
                      <div className="mt-4 inline-flex rounded-full bg-brand-soft px-3 py-1.5 text-xs font-medium text-brand-strong">
                        Next: {formatCircleMeetingRelativeDate(circle.nextMeetingDate)}
                      </div>
                    ) : null}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[20px] bg-surface-muted p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Created</p>
                        <p className="mt-2 text-sm font-medium text-text">{formatCircleDate(circle.createdAt)}</p>
                      </div>
                      <div className="rounded-[20px] bg-surface-muted p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Owner</p>
                        <p className="mt-2 text-sm font-medium text-text">{circle.ownerNickname?.trim() || 'Anonymous'}</p>
                      </div>
                    </div>

                    <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-strong">
                      <span>Open circle</span>
                      <ArrowRight size={14} />
                    </div>
                  </Link>

                  {circle.callerIsOwner ? (
                    <div className="mt-5 flex items-center justify-between gap-3 rounded-[22px] border border-border bg-surface-alt px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[0.18em] text-text-subtle">Invite code</p>
                        <p className="mt-1 text-lg font-semibold tracking-[0.24em] text-text">{circle.inviteCode}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleCopyCode(circle.inviteCode)}
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-surface-muted"
                      >
                        <Copy size={14} />
                        Copy
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />

      <CreateCircleModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(circle) => {
          setIsCreateOpen(false);
          void navigate(`/circles/${circle.id}`);
        }}
      />

      <JoinCircleModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        onJoined={(circle) => {
          setIsJoinOpen(false);
          void navigate(`/circles/${circle.id}`);
        }}
      />
    </div>
  );
}
