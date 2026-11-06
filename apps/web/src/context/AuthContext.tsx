import { Hub } from 'aws-amplify/utils';
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { setUnauthorizedHandler } from '../services/api';
import {
  getSignedInUser,
  isAuthConfigured,
  logOutUser,
  type AuthUser,
} from '../services/auth';

export type AuthStatus =
  | 'not-configured'
  | 'loading'
  | 'signed-in'
  | 'signed-out';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** True after the API rejected the session, so the login page can explain why. */
  sessionExpired: boolean;
  /** Re-reads the session from Amplify. Call this after logging in. */
  refreshUser: () => Promise<void>;
  logOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

/** Makes the signed-in user and the session actions available to every component. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{
    status: AuthStatus;
    user: AuthUser | null;
  }>({
    status: isAuthConfigured ? 'loading' : 'not-configured',
    user: null,
  });
  const [sessionExpired, setSessionExpired] = useState(false);
  const latestCheck = useRef(0);

  const refreshUser = useCallback(async () => {
    if (!isAuthConfigured) {
      return;
    }

    // If checks overlap, only the most recent one may update the state.
    const check = ++latestCheck.current;
    const user = await getSignedInUser();
    if (check !== latestCheck.current) {
      return;
    }

    setSession({ status: user ? 'signed-in' : 'signed-out', user });
    if (user) {
      setSessionExpired(false);
    }
  }, []);

  const logOut = useCallback(async () => {
    try {
      await logOutUser();
    } finally {
      await refreshUser();
    }
  }, [refreshUser]);

  useEffect(() => {
    void refreshUser();

    // Keeps the app in step when Amplify ends a session by itself. A failed token
    // renewal doesn't always end the session, so check rather than assume.
    const stopListening = Hub.listen('auth', ({ payload }) => {
      if (
        payload.event === 'signedOut' ||
        payload.event === 'tokenRefresh_failure'
      ) {
        void refreshUser();
      }
    });

    setUnauthorizedHandler(() => {
      setSessionExpired(true);
      void logOut().catch(() => {});
    });

    return () => {
      stopListening();
      setUnauthorizedHandler(undefined);
    };
  }, [logOut, refreshUser]);

  const value = useMemo(
    () => ({ ...session, sessionExpired, refreshUser, logOut }),
    [session, sessionExpired, refreshUser, logOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
