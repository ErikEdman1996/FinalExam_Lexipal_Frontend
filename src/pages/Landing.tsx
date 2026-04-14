import { useEffect } from 'react';
import { ArrowRight, BookOpen, Brain, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../features/auth/AuthProvider';

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
      navigate('/library', { replace: true });
    }
  }, [authenticated, bootstrapError, hasBootstrappedProfile, initialized, isBootstrappingProfile, navigate]);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#E7F8F0_0%,rgba(231,248,240,0)_28%),radial-gradient(circle_at_top_right,#E6F0FF_0%,rgba(230,240,255,0)_30%),linear-gradient(180deg,#FBFDFB_0%,#F4F8FF_52%,#FFF8EC_100%)] px-5 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(36,52,71,0.08)] bg-white/80 px-4 py-2 shadow-[0_10px_24px_rgba(31,41,55,0.05)] backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#DFF5EA_0%,#D9ECFF_100%)]">
              <Brain size={20} className="text-[#2F7D5F]" />
            </div>
            <div>
              <p className="text-[0.7rem] uppercase tracking-[0.3em] text-[#8A94A6]">Lexipal</p>
              <p className="text-sm font-medium text-[#22324A]">Vocabulary for readers</p>
            </div>
          </div>
        </header>

        <main className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative overflow-hidden rounded-[40px] border border-[rgba(36,52,71,0.08)] bg-white/86 p-7 shadow-[0_24px_60px_rgba(31,41,55,0.08)] backdrop-blur-sm sm:p-9">
            <div className="pointer-events-none absolute right-[-4rem] top-[-4rem] h-48 w-48 rounded-full bg-[#E5F6EF] blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-5rem] left-[-4rem] h-52 w-52 rounded-full bg-[#E8F0FF] blur-3xl" />

            <div className="relative z-10">
              <p className="text-sm uppercase tracking-[0.32em] text-[#8A94A6]">Read. Save. Review.</p>
              <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-[#22324A] sm:text-5xl lg:text-6xl">
                Build a personal word system from the books you already love.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#52606D] sm:text-lg">
                Lexipal turns reading sessions into a living vocabulary loop. Capture new words,
                organize them in your Codex, and train them through challenge-based review.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {!initialized ? (
                  <Button disabled className="rounded-full px-6">Checking sign-in...</Button>
                ) : authenticated ? (
                  bootstrapError ? (
                    <>
                      <Button onClick={() => void retryBootstrap()} className="rounded-full px-6">
                        Retry setup
                      </Button>
                      <p className="basis-full text-sm text-[#A14B43]">{bootstrapError}</p>
                    </>
                  ) : (
                    <Button disabled={isBootstrappingProfile} className="rounded-full px-6">
                      {isBootstrappingProfile ? 'Setting up your app...' : `Continuing as ${username || 'reader'}...`}
                    </Button>
                  )
                ) : (
                  <Button onClick={() => void login()} className="rounded-full px-6 shadow-[0_14px_30px_rgba(76,167,132,0.18)]">
                    <span className="inline-flex items-center gap-2">
                      Sign in with Keycloak
                      <ArrowRight size={18} />
                    </span>
                  </Button>
                )}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <article className="rounded-[26px] border border-[rgba(75,147,209,0.10)] bg-[#F8FBFF] p-5">
                  <BookOpen size={20} className="text-[#4B93D1]" />
                  <h2 className="mt-4 text-lg font-semibold text-[#22324A]">Reading sessions</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">
                    Track pages, reflections, and captured vocabulary while you read.
                  </p>
                </article>
                <article className="rounded-[26px] border border-[rgba(47,125,95,0.10)] bg-[#F5FBF8] p-5">
                  <Brain size={20} className="text-[#2F7D5F]" />
                  <h2 className="mt-4 text-lg font-semibold text-[#22324A]">Codex capture</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">
                    Save words with definitions, synonyms, and word class metadata.
                  </p>
                </article>
                <article className="rounded-[26px] border border-[rgba(199,134,46,0.10)] bg-[#FFF9F0] p-5">
                  <Trophy size={20} className="text-[#C7862E]" />
                  <h2 className="mt-4 text-lg font-semibold text-[#22324A]">Challenge review</h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#6A7687]">
                    Turn saved vocabulary into practice sessions with persistent XP and attempt history.
                  </p>
                </article>
              </div>
            </div>
          </section>

          <section className="rounded-[40px] border border-[rgba(36,52,71,0.08)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(248,251,255,0.96)_50%,rgba(255,248,238,0.98)_100%)] p-7 shadow-[0_24px_60px_rgba(31,41,55,0.06)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-[#8A94A6]">App Flow</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#22324A]">A cleaner way into the app</h2>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#FFF1D7_0%,#FFE7BD_100%)]">
                <ArrowRight size={20} className="text-[#B7772B]" />
              </div>
            </div>

            <ol className="mt-6 space-y-3">
              <li className="rounded-[24px] border border-[rgba(36,52,71,0.06)] bg-white/85 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Step 1</p>
                <p className="mt-2 text-sm leading-relaxed text-[#52606D]">Sign in through Keycloak from the public landing page.</p>
              </li>
              <li className="rounded-[24px] border border-[rgba(36,52,71,0.06)] bg-white/85 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Step 2</p>
                <p className="mt-2 text-sm leading-relaxed text-[#52606D]">Lexipal immediately calls `GET /profile/me` with your bearer token.</p>
              </li>
              <li className="rounded-[24px] border border-[rgba(36,52,71,0.06)] bg-white/85 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Step 3</p>
                <p className="mt-2 text-sm leading-relaxed text-[#52606D]">If needed, the backend creates your user automatically on that first authenticated load.</p>
              </li>
              <li className="rounded-[24px] border border-[rgba(36,52,71,0.06)] bg-white/85 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.22em] text-[#8A94A6]">Step 4</p>
                <p className="mt-2 text-sm leading-relaxed text-[#52606D]">After bootstrap, the protected app opens with Library, Codex, Challenges, and Profile ready to use.</p>
              </li>
            </ol>
          </section>
        </main>
      </div>
    </div>
  );
}
