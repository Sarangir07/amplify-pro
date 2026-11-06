import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../services/api';
import { getUsers } from '../services/users';
import type { User } from '../types/user';

export type UsersState =
  | { state: 'loading' }
  | { state: 'loaded'; users: User[] }
  | { state: 'failed'; message: string };

/** Loads the user list when the page opens, and again whenever `reload` is called. */
export function useUsers() {
  const [result, setResult] = useState<UsersState>({ state: 'loading' });
  const latestLoad = useRef(0);

  const reload = useCallback(async () => {
    const load = ++latestLoad.current;
    setResult({ state: 'loading' });

    try {
      const users = await getUsers();
      if (load === latestLoad.current) {
        setResult({ state: 'loaded', users });
      }
    } catch (error) {
      if (load === latestLoad.current) {
        setResult({
          state: 'failed',
          message:
            error instanceof ApiError ? error.message : 'Unexpected error',
        });
      }
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { result, reload };
}
