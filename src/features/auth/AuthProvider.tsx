import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import keycloak from './keycloak';
import { getProfile, type ProfileReadResponseDTO } from '../../api/api';

interface AuthContextValue {
  initialized: boolean;
  authenticated: boolean;
  isBootstrappingProfile: boolean;
  hasBootstrappedProfile: boolean;
  bootstrapError: string | null;
  profile: ProfileReadResponseDTO | null;
  username: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

let keycloakInitPromise: Promise<boolean> | null = null;

async function initKeycloakOnce() {
  if (!keycloakInitPromise) {
    keycloakInitPromise = keycloak.init({
      onLoad: 'check-sso',
      checkLoginIframe: false,
    });
  }

  return keycloakInitPromise;
}

async function bootstrapProfile() {
  return getProfile();
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isBootstrappingProfile, setIsBootstrappingProfile] = useState(false);
  const [hasBootstrappedProfile, setHasBootstrappedProfile] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileReadResponseDTO | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const isAuthenticated = await initKeycloakOnce();

        if (!isMounted) {
          return;
        }

        setAuthenticated(isAuthenticated);
      } catch (error) {
        console.error('Auth initialization failed:', error);

        if (!isMounted) {
          return;
        }

        setAuthenticated(false);
        setBootstrapError('Could not initialize sign-in right now.');
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const runBootstrap = async () => {
      if (!initialized || !authenticated) {
        if (isMounted) {
          setProfile(null);
          setHasBootstrappedProfile(false);
          setBootstrapError(null);
          setIsBootstrappingProfile(false);
        }
        return;
      }

      try {
        setIsBootstrappingProfile(true);
        setBootstrapError(null);
        const profileResponse = await bootstrapProfile();

        if (!isMounted) {
          return;
        }

        setProfile(profileResponse);
        setHasBootstrappedProfile(true);
      } catch (error) {
        console.error('Profile bootstrap failed:', error);

        if (!isMounted) {
          return;
        }

        setHasBootstrappedProfile(false);
        setBootstrapError('Could not finish setting up your account.');
      } finally {
        if (isMounted) {
          setIsBootstrappingProfile(false);
        }
      }
    };

    void runBootstrap();

    return () => {
      isMounted = false;
    };
  }, [authenticated, initialized]);

  const value = useMemo<AuthContextValue>(() => ({
    initialized,
    authenticated,
    isBootstrappingProfile,
    hasBootstrappedProfile,
    bootstrapError,
    profile,
    username: String(keycloak.tokenParsed?.preferred_username ?? ''),
    login: async () => {
      await keycloak.login({
        redirectUri: `${window.location.origin}/library`,
      });
    },
    logout: async () => {
      await keycloak.logout({
        redirectUri: `${window.location.origin}/`,
      });
    },
    retryBootstrap: async () => {
      try {
        setIsBootstrappingProfile(true);
        setBootstrapError(null);
        const profileResponse = await bootstrapProfile();
        setProfile(profileResponse);
        setHasBootstrappedProfile(true);
      } catch (error) {
        console.error('Profile bootstrap retry failed:', error);
        setHasBootstrappedProfile(false);
        setBootstrapError('Could not finish setting up your account.');
      } finally {
        setIsBootstrappingProfile(false);
      }
    },
  }), [authenticated, bootstrapError, hasBootstrappedProfile, initialized, isBootstrappingProfile, profile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
