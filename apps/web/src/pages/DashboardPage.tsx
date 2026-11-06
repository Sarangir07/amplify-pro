import { Link } from 'react-router';
import { AppLayout } from '../components/AppLayout';
import { SystemStatus } from '../components/SystemStatus';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <h1>{user?.name ? `Welcome, ${user.name}` : 'Welcome'}</h1>
      <p className="intro">
        {user?.email && `You’re signed in as ${user.email}. `}
        <Link to="/users">View users</Link>
      </p>
      <SystemStatus />
    </AppLayout>
  );
}
