import { useEffect } from 'react';
import { ArrowRight, BookOpen, Brain, Sparkles, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../features/auth/useAuth';

export default function Landing() {
  const navigate = useNavigate();
  const {
    initialized,
    authenticated,
    isBootstrappingProfile,
    hasBootstrappedProfile,
    bootstrapError,
    login,
    retryBootstrap,
    username,
  } = useAuth();

  useEffect(() => {
    if (initialized && authenticated && hasBootstrappedProfile && !isBootstrappingProfile && !bootstrapError) {
      void navigate('/library', { replace: true });
    }
  }, [authenticated, bootstrapError, hasBootstrappedProfile, initialized, isBootstrappingProfile, navigate]);

  return (
    <div className="page-bg-radial min-h-screen overflow-hidden px-5 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface/80 px-4 py-2 shadow-[0_10px_24px_rgba(31,41,55,0.05)] backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-soft)_0%,var(--color-accent-soft)_100%)]">
              <Brain size={20} className="text-brand-strong" />
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-text-subtle">Lexipal</p>
              <p className="text-sm font-medium text-text">A reading companion</p>
            </div>
          </div>
        </header>

        <main className="relative mt-10">
          <div className="pointer-events-none absolute left-[8%] top-[-2rem] h-40 w-40 rounded-full bg-brand-soft blur-3xl" />
          <div className="pointer-events-none absolute right-[6%] top-[16%] h-48 w-48 rounded-full bg-surface-muted blur-3xl" />
          <div className="pointer-events-none absolute bottom-[8%] left-[26%] h-44 w-44 rounded-full bg-accent-soft blur-3xl" />

          <section className="relative overflow-hidden rounded-[42px] border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.95)_0%,rgba(250,244,242,0.94)_48%,rgba(255,255,255,0.95)_100%)] p-7 shadow-[0_28px_70px_rgba(31,41,55,0.08)] backdrop-blur-sm dark:bg-[linear-gradient(180deg,rgba(78,82,106,0.96)_0%,rgba(66,70,88,0.95)_48%,rgba(47,50,64,0.96)_100%)] sm:p-10 lg:p-12">
            <div className="pointer-events-none absolute right-[-3rem] top-[-3rem] h-40 w-40 rounded-full bg-brand-soft opacity-90 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-4rem] left-[-3rem] h-44 w-44 rounded-full bg-surface-muted opacity-80 blur-3xl" />
            <div className="pointer-events-none absolute inset-y-10 right-10 hidden w-48 rounded-full bg-[radial-gradient(circle,var(--color-accent-soft)_0%,transparent_72%)] blur-2xl lg:block" />

            <div className="relative z-10">
              <div className="mx-auto max-w-3xl text-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-brand-soft px-4 py-2 text-sm font-medium text-brand-strong">
                  <Sparkles size={16} />
                  Modern vocabulary tracking for readers
                </div>

                <h1 className="mt-6 text-[2.9rem] font-semibold tracking-[-0.07em] text-text sm:text-[3.8rem] lg:text-[4.7rem]">
                  Build a personal vocabulary from the books you already love.
                </h1>

                <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
                  Look up words as you read, save the ones worth keeping, and grow a Codex you can revisit whenever a
                  good word deserves a second glance.
                </p>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  {!initialized ? (
                    <Button disabled className="rounded-full px-6">Checking sign-in...</Button>
                  ) : authenticated ? (
                    bootstrapError ? (
                      <>
                        <Button onClick={() => void retryBootstrap()} className="rounded-full px-6">
                          Retry setup
                        </Button>
                        <p className="basis-full text-sm text-danger">{bootstrapError}</p>
                      </>
                    ) : (
                      <Button disabled={isBootstrappingProfile} className="rounded-full px-6">
                        {isBootstrappingProfile ? 'Setting up your app...' : `Continuing as ${username || 'reader'}...`}
                      </Button>
                    )
                  ) : (
                    <Button onClick={() => void login()} className="rounded-full px-8 shadow-[0_16px_32px_rgba(76,167,132,0.18)]">
                      <span className="inline-flex items-center gap-2">
                        Sign in
                        <ArrowRight size={18} />
                      </span>
                    </Button>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-2 text-sm text-text-muted">
                  <span className="rounded-full bg-surface/86 px-3 py-1.5 shadow-[0_10px_22px_rgba(31,41,55,0.04)]">Reading sessions</span>
                  <span className="rounded-full bg-surface/86 px-3 py-1.5 shadow-[0_10px_22px_rgba(31,41,55,0.04)]">Word lookup</span>
                  <span className="rounded-full bg-surface/86 px-3 py-1.5 shadow-[0_10px_22px_rgba(31,41,55,0.04)]">Codex review</span>
                  <span className="rounded-full bg-surface/86 px-3 py-1.5 shadow-[0_10px_22px_rgba(31,41,55,0.04)]">XP progress</span>
                </div>
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-3">
                <article className="rounded-[30px] border border-border bg-surface p-6 shadow-[0_16px_34px_rgba(31,41,55,0.05)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-text-subtle">Read with focus</p>
                      <h2 className="mt-3 text-xl font-semibold text-text">Keep the flow of reading intact</h2>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-brand-soft">
                      <BookOpen size={22} className="text-brand-strong" />
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-text-muted">
                    Look up a word in the moment, capture it if it matters, and keep moving through your book without
                    losing your place.
                  </p>
                </article>

                <article className="rounded-[28px] border border-border bg-brand-soft p-5 shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
                  <Brain size={20} className="text-brand-strong" />
                  <h3 className="mt-4 text-lg font-semibold text-text">Capture in context</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    Save words while you are already reading, with definitions, pronunciation, and examples.
                  </p>
                </article>

                <article className="rounded-[28px] border border-border bg-accent-soft p-5 shadow-[0_14px_28px_rgba(31,41,55,0.04)]">
                  <Trophy size={20} className="text-accent-strong" />
                  <h3 className="mt-4 text-lg font-semibold text-text">Review with momentum</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    Build consistency with lightweight practice, visible progress, and a growing personal vocabulary.
                  </p>
                </article>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
