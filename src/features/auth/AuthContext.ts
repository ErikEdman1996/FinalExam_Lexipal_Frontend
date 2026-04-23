import { createContext } from 'react';
import type { ProfileReadResponseDTO } from '../../api/api';

export interface AuthContextValue {
  initialized: boolean;
  authenticated: boolean;
  isBootstrappingProfile: boolean;
  hasBootstrappedProfile: boolean;
  bootstrapError: string | null;
  profile: ProfileReadResponseDTO | null;
  needsOnboarding: boolean;
  username: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
  setProfile: (profile: ProfileReadResponseDTO) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
