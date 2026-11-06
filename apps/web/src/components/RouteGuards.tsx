import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { useAuthRouteState } from '../hooks/useAuthRouteState';
import type { AuthRouteState } from '../hooks/useAuthRouteState';

function AuthNotConfigured() {
  return (
    <main className="page page--narrow">
      <div className="card">
        <h1 className="card-title">Authentication isn’t set up</h1>
        <p className="card-intro">
          Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID in
          apps/web/.env.local, then restart the frontend.
        </p>
      </div>
    </main>
  );
}

function CheckingSession() {
  return (
    <main className="page page--narrow">
      <p className="card-intro" role="status">
        Checking your session…
      </p>
    </main>
  );
}

/**
 * For signed-in pages: sends everyone else to login, remembering where they were
 * headed. This only controls what's displayed. The API's token check is what
 * actually protects the data.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'not-configured') {
    return <AuthNotConfigured />;
  }
  if (status === 'loading') {
    return <CheckingSession />;
  }
  if (status === 'signed-out') {
    const state: AuthRouteState = {
      from: location.pathname + location.search,
    };
    return <Navigate to="/login" replace state={state} />;
  }
  return <Outlet />;
}

/**
 * For login and sign-up pages: sends signed-in users onward. This is also what
 * performs the redirect after a successful login.
 */
export function GuestRoute() {
  const { status } = useAuth();
  const { from } = useAuthRouteState();

  if (status === 'not-configured') {
    return <AuthNotConfigured />;
  }
  if (status === 'loading') {
    return <CheckingSession />;
  }
  if (status === 'signed-in') {
    return <Navigate to={from ?? '/dashboard'} replace />;
  }
  return <Outlet />;
}
