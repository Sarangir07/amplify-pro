import { useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { useAuth } from '../hooks/useAuth';
import { Alert } from './Alert';

/** The shared frame around signed-in pages: navigation, the user and log out. */
export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logOutFailed, setLogOutFailed] = useState(false);

  async function handleLogOut() {
    setLoggingOut(true);
    setLogOutFailed(false);
    try {
      await logOut();
    } catch {
      setLogOutFailed(true);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/dashboard" className="brand brand--header">
            Amplify Project
          </Link>
          <nav aria-label="Main">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/users">Users</NavLink>
          </nav>
          <div className="app-header-user">
            <span className="app-header-name">{user?.name ?? user?.email}</span>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void handleLogOut()}
              disabled={loggingOut}
            >
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
      </header>
      <main className="page page--wide">
        {logOutFailed && (
          <Alert tone="error">We couldn’t log you out. Please try again.</Alert>
        )}
        {children}
      </main>
    </>
  );
}
