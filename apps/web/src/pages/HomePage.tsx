import { Link } from 'react-router';
import { SystemStatus } from '../components/SystemStatus';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { status } = useAuth();

  return (
    <main className="page">
      <h1>Amplify Project</h1>
      <p className="intro">
        The frontend is running. This page checks its connections to the backend.
      </p>

      <SystemStatus />

      <div className="actions">
        {status === 'signed-in' && (
          <Link to="/dashboard" className="button">
            Go to dashboard
          </Link>
        )}
        {status === 'signed-out' && (
          <>
            <Link to="/login" className="button">
              Log in
            </Link>
            <Link to="/signup" className="button button--secondary">
              Create an account
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
