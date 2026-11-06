import { useLocation } from 'react-router';

/** Details the auth pages pass to each other when moving between pages. */
export interface AuthRouteState {
  /** Prefills the email field, so the user doesn't have to type it again. */
  email?: string;
  /** A success or information message to show at the top of the next page. */
  notice?: string;
  /** Where to go after logging in, set when a protected page redirected here. */
  from?: string;
}

export function useAuthRouteState(): AuthRouteState {
  const { state } = useLocation();
  return (state as AuthRouteState | null) ?? {};
}
