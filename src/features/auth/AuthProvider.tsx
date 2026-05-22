import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import keycloak from './keycloak';
import { getProfile, type ProfileReadResponseDTO } from '../../api/api';
import { AuthContext, type AuthContextValue } from './AuthContext';
import { getViteStringEnv } from '../../utils/env';

let keycloakInitPromise: Promise<boolean> | null = null;
const BACKEND_CLIENT_ID = getViteStringEnv('VITE_KEYCLOAK_BACKEND_CLIENT_ID', 'Lexipal_Backend');

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

function getBackendRoles(): string[] {
  const tokenParsed = keycloak.tokenParsed as Record<string, unknown> | undefined;
  const resourceAccess = tokenParsed?.resource_access;

  if (resourceAccess == null || typeof resourceAccess !== 'object') {
    return [];
  }

  const backendAccess = (resourceAccess as Record<string, unknown>)[BACKEND_CLIENT_ID];

  if (backendAccess == null || typeof backendAccess !== 'object') {
    return [];
  }

  const roles = (backendAccess as Record<string, unknown>).roles;

  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role): role is string => typeof role === 'string');
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isBootstrappingProfile, setIsBootstrappingProfile] = useState(false);
  const [hasBootstrappedProfile, setHasBootstrappedProfile] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileReadResponseDTO | null>(null);

  const clearAuthState = useCallback(() => {
    setAuthenticated(false);
    setProfile(null);
    setHasBootstrappedProfile(false);
    setBootstrapError(null);
    setIsBootstrappingProfile(false);
  }, []);

  const refreshProfile = useCallback(async () => {
    const profileResponse = await getProfile();
    setProfile(profileResponse);
    setHasBootstrappedProfile(true);
    return profileResponse;
  }, []);

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
    const endAuthSession = () => {
      keycloak.clearToken();
      clearAuthState();
    };

    const handleTokenExpired = () => {
      void keycloak.updateToken(30)
        .then((refreshed) => {
          if (refreshed) {
            setAuthenticated(true);
          }
        })
        .catch((error) => {
          console.error('Auth token refresh failed:', error);
          endAuthSession();
        });
    };

    const handleAuthEnded = () => {
      clearAuthState();
    };

    keycloak.onTokenExpired = handleTokenExpired;
    keycloak.onAuthRefreshError = endAuthSession;
    keycloak.onAuthLogout = handleAuthEnded;

    return () => {
      if (keycloak.onTokenExpired === handleTokenExpired) {
        keycloak.onTokenExpired = undefined;
      }

      if (keycloak.onAuthRefreshError === endAuthSession) {
        keycloak.onAuthRefreshError = undefined;
      }

      if (keycloak.onAuthLogout === handleAuthEnded) {
        keycloak.onAuthLogout = undefined;
      }
    };
  }, [clearAuthState]);

  useEffect(() => {
    let isMounted = true;

    const runBootstrap = async () => {
      if (!initialized || !authenticated) {
        if (isMounted) {
          clearAuthState();
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
  }, [authenticated, clearAuthState, initialized]);

  const value = useMemo<AuthContextValue>(() => {
    const roles = getBackendRoles();

    return {
    initialized,
    authenticated,
    isBootstrappingProfile,
    hasBootstrappedProfile,
    bootstrapError,
    profile,
    needsOnboarding:
      profile != null && (profile.needsOnboarding || profile.nickname == null || profile.nickname.trim() === ''),
    username: String(keycloak.tokenParsed?.preferred_username ?? ''),
    roles,
    isAdmin: roles.includes('admin'),
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
    refreshProfile,
    setProfile,
    };
  }, [
    authenticated,
    bootstrapError,
    hasBootstrappedProfile,
    initialized,
    isBootstrappingProfile,
    profile,
    refreshProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
