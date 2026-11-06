import { useEffect, useState } from 'react';
import { env } from '../config/env';
import { ApiError, getHealth } from '../services/api';

export type ApiHealth =
  | { state: 'not-configured' }
  | { state: 'checking' }
  | { state: 'connected' }
  | { state: 'failed'; message: string };

/** Calls GET /health once when the component appears and reports the result. */
export function useApiHealth(): ApiHealth {
  const [health, setHealth] = useState<ApiHealth>(
    env.apiUrl ? { state: 'checking' } : { state: 'not-configured' },
  );

  useEffect(() => {
    if (!env.apiUrl) {
      return;
    }

    let cancelled = false;
    getHealth()
      .then(() => {
        if (!cancelled) {
          setHealth({ state: 'connected' });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setHealth({
            state: 'failed',
            message:
              error instanceof ApiError ? error.message : 'Unexpected error',
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return health;
}
