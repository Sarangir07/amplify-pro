import type { AuthStatus } from '../context/AuthContext';
import { useApiHealth, type ApiHealth } from '../hooks/useApiHealth';
import { useAuth } from '../hooks/useAuth';
import { StatusItem, type StatusTone } from './StatusItem';

function describeApi(health: ApiHealth): { value: string; tone: StatusTone } {
  switch (health.state) {
    case 'not-configured':
      return { value: 'VITE_API_URL is not set', tone: 'warning' };
    case 'checking':
      return { value: 'Checking…', tone: 'neutral' };
    case 'connected':
      return { value: 'Connected', tone: 'good' };
    case 'failed':
      return { value: health.message, tone: 'bad' };
  }
}

function describeAuth(status: AuthStatus): { value: string; tone: StatusTone } {
  switch (status) {
    case 'not-configured':
      return { value: 'Cognito variables are not set', tone: 'warning' };
    case 'loading':
      return { value: 'Checking…', tone: 'neutral' };
    case 'signed-in':
      return { value: 'Signed in', tone: 'good' };
    case 'signed-out':
      return { value: 'Configured, signed out', tone: 'good' };
  }
}

/** A card showing whether the frontend can reach the API and Cognito. */
export function SystemStatus() {
  const health = useApiHealth();
  const { status } = useAuth();

  return (
    <section className="card" aria-labelledby="status-heading">
      <h2 id="status-heading">System status</h2>
      <ul className="status-list">
        <StatusItem label="Frontend" value="Running" tone="good" />
        <StatusItem label="API" {...describeApi(health)} />
        <StatusItem label="Authentication" {...describeAuth(status)} />
      </ul>
    </section>
  );
}
