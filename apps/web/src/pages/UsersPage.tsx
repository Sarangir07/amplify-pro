import { Alert } from '../components/Alert';
import { AppLayout } from '../components/AppLayout';
import { useUsers } from '../hooks/useUsers';

export function UsersPage() {
  const { result, reload } = useUsers();

  return (
    <AppLayout>
      <h1>Users</h1>
      <p className="intro">Records from the API’s protected /users endpoint.</p>

      <section className="card">
        {result.state === 'loading' && <p role="status">Loading users…</p>}

        {result.state === 'failed' && (
          <>
            <Alert tone="error">{result.message}</Alert>
            <button
              type="button"
              className="button button--secondary"
              onClick={() => void reload()}
            >
              Try again
            </button>
          </>
        )}

        {result.state === 'loaded' && result.users.length === 0 && (
          <p>No user records yet.</p>
        )}

        {result.state === 'loaded' && result.users.length > 0 && (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                </tr>
              </thead>
              <tbody>
                {result.users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name || '—'}</td>
                    <td>{user.email || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppLayout>
  );
}
