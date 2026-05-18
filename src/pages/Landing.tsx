import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import mobileSession from '../assets/screenshots/mobile/mobile_session_2.png';
import mothIcon from '../assets/moth_icon_light.png';
import { ThemeToggle } from '../features/theme/ThemeToggle';
import { useAuth } from '../features/auth/useAuth';

const heroCapabilities = ['Focus timer', 'Word lookup', 'Saved notes', 'XP progress'];

interface LandingActionButtonProps {
  initialized: boolean;
  authenticated: boolean;
  isBootstrappingProfile: boolean;
  bootstrapError: string | null;
  username: string | null | undefined;
  login: () => Promise<void> | void;
  retryBootstrap: () => Promise<void> | void;
  label: string;
  compact?: boolean;
  showError?: boolean;
}

function LandingActionButton({
  initialized,
  authenticated,
  isBootstrappingProfile,
  bootstrapError,
  username,
  login,
  retryBootstrap,
  label,
  compact = false,
  showError = false,
}: LandingActionButtonProps) {
  const sizeClassName = compact ? 'h-10 rounded-full px-4 text-sm' : 'h-12 rounded-full px-7';

  if (!initialized) {
    return (
      <Button disabled className={sizeClassName}>
        {compact ? 'Checking...' : 'Checking sign-in...'}
      </Button>
    );
  }

  if (authenticated && bootstrapError) {
    return (
      <div className={showError ? 'flex flex-col items-start gap-2' : ''}>
        <Button type="button" onClick={() => void retryBootstrap()} className={sizeClassName}>
          Retry setup
        </Button>
        {showError ? <p className="max-w-sm text-sm text-danger">{bootstrapError}</p> : null}
      </div>
    );
  }

  if (authenticated) {
    return (
      <Button disabled={isBootstrappingProfile} className={sizeClassName}>
        {isBootstrappingProfile ? 'Setting up...' : compact ? 'Continue' : `Continuing as ${username || 'reader'}...`}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      onClick={() => void login()}
      className={`${sizeClassName} !bg-brand !text-text-on-brand shadow-[0_18px_42px_rgba(216,122,90,0.22)] hover:!bg-brand-hover`}
    >
      <span className="inline-flex items-center gap-2">
        {label}
        <ArrowRight size={17} aria-hidden="true" />
      </span>
    </Button>
  );
}

function PhonePreview() {
  return (
    <div id="product-preview" className="relative mx-auto w-full max-w-[18.5rem] scroll-mt-24 sm:max-w-[21rem]">
      <div className="absolute -left-8 top-6 z-20 hidden rounded-[18px] border border-border bg-surface/95 px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur md:block">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-text-subtle">Session</p>
        <p className="mt-1 text-sm font-semibold text-text">Timer, notes, lookup</p>
      </div>

      <figure className="relative">
        <div className="relative aspect-[9/19] overflow-hidden rounded-[2.1rem] border-[9px] border-[#17120f] bg-[#17120f] shadow-[0_30px_80px_rgba(0,0,0,0.42)] sm:rounded-[2.35rem]">
          <img
            src={mobileSession}
            alt="Mobile Bookmark reading session showing a focus timer, note controls, word lookup, reading audio, and looked-up words."
            width={919}
            height={1935}
            loading="eager"
            className="h-full w-full rounded-[1.55rem] object-cover object-top sm:rounded-[1.75rem]"
          />
        </div>
        <figcaption className="sr-only">Real mobile screenshot of a Bookmark reading session.</figcaption>
      </figure>

      <div className="absolute -bottom-2 right-[-1.4rem] z-20 hidden rounded-[18px] border border-border bg-surface/95 px-4 py-3 shadow-[0_18px_44px_rgba(0,0,0,0.18)] backdrop-blur sm:block lg:right-[-5.4rem]">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-text-subtle">Mobile web</p>
        <p className="mt-1 text-sm font-semibold text-text">Real screen capture</p>
      </div>
    </div>
  );
}

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
    <div className="page-bg-radial min-h-screen overflow-x-hidden text-text">
      <a
        href="#main"
        className="sr-only z-[60] rounded-full bg-surface px-4 py-2 text-sm font-medium text-text shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      >
        Skip to content
      </a>

      <header className="border-b border-border bg-bg/86 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            aria-label="Bookmark home"
          >
            <img
              src={mothIcon}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-[12px] bg-surface object-cover shadow-[0_10px_24px_rgba(216,122,90,0.16)]"
            />
            <span className="min-w-0">
              <span className="block text-[0.66rem] font-semibold uppercase tracking-[0.32em] text-text-subtle">
                Reading app
              </span>
              <span className="block font-['Fraunces',Georgia,serif] text-xl font-semibold leading-none text-text">
                Bookmark
              </span>
            </span>
          </a>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <LandingActionButton
              initialized={initialized}
              authenticated={authenticated}
              isBootstrappingProfile={isBootstrappingProfile}
              bootstrapError={bootstrapError}
              username={username}
              login={login}
              retryBootstrap={retryBootstrap}
              label="Sign in"
              compact
            />
          </div>
        </div>
      </header>

      <main id="main" className="relative">
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.78fr)] lg:px-8">
          <div className="max-w-2xl">
            <h1 className="mt-7 font-['Fraunces',Georgia,serif] text-[4.5rem] font-semibold leading-[0.9] tracking-[-0.02em] text-text sm:text-[6.5rem] lg:text-[7.5rem]">
              Bookmark
            </h1>
            <p className="mt-5 max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.03em] text-text sm:text-4xl">
              Read with focus. Remember what matters.
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
              Set a reading timer, look up words, save notes, and turn what you collect into practice. Bookmark keeps
              the useful parts of reading close without pulling you out of the book.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <LandingActionButton
                initialized={initialized}
                authenticated={authenticated}
                isBootstrappingProfile={isBootstrappingProfile}
                bootstrapError={bootstrapError}
                username={username}
                login={login}
                retryBootstrap={retryBootstrap}
                label="Start Reading"
                showError
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {heroCapabilities.map((capability) => (
                <span
                  key={capability}
                  className="rounded-full border border-border bg-surface/66 px-3 py-1.5 text-sm text-text-muted"
                >
                  {capability}
                </span>
              ))}
            </div>
          </div>

          <PhonePreview />
        </section>
      </main>
    </div>
  );
}
