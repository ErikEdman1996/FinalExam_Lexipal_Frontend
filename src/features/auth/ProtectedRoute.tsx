import { Navigate, Outlet } from 'react-router-dom';
import { Button } from '../../components/Button';
import { BooksProvider } from '../books/BooksProvider';
import { DailyQuestProvider } from '../dailyQuests/DailyQuestProvider';
import { XpGainProvider } from '../xp/XpGainProvider';
import { NicknameOnboardingScreen } from '../onboarding/NicknameOnboardingScreen';
import { useAuth } from './useAuth';

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_52%,#FFF8EE_100%)] px-5 py-10">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center text-center">
        <div className="rounded-[32px] border border-[rgba(36,52,71,0.08)] bg-white/92 px-8 py-10 shadow-[0_20px_40px_rgba(31,41,55,0.08)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[#8A94A6]">Bookmark</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#22324A]">Preparing your app</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6A7687]">{message}</p>
        </div>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const {
    initialized,
    authenticated,
    isBootstrappingProfile,
    hasBootstrappedProfile,
    bootstrapError,
    needsOnboarding,
    retryBootstrap,
    logout,
  } = useAuth();

  if (!initialized) {
    return <AuthLoadingScreen message="Checking your sign-in status..." />;
  }

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  if (isBootstrappingProfile || !hasBootstrappedProfile) {
    if (bootstrapError) {
      return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#F7FBF8_0%,#F6F9FF_52%,#FFF8EE_100%)] px-5 py-10">
          <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
            <div className="rounded-[32px] border border-[rgba(36,52,71,0.08)] bg-white/92 px-8 py-10 text-center shadow-[0_20px_40px_rgba(31,41,55,0.08)]">
              <p className="text-sm uppercase tracking-[0.24em] text-[#8A94A6]">Account Setup</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#22324A]">We hit a setup issue</h1>
              <p className="mt-3 text-sm leading-relaxed text-[#6A7687]">{bootstrapError}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button onClick={() => void retryBootstrap()}>Try again</Button>
                <Button variant="outline" onClick={() => void logout()}>Sign out</Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <AuthLoadingScreen message="Creating your Bookmark profile and syncing your app access..." />;
  }

  if (needsOnboarding) {
    return <NicknameOnboardingScreen />;
  }

  return (
    <XpGainProvider>
      <DailyQuestProvider>
        <BooksProvider>
          <Outlet />
        </BooksProvider>
      </DailyQuestProvider>
    </XpGainProvider>
  );
}
