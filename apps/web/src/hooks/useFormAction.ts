import { useCallback, useState } from 'react';
import { getAuthErrorMessage } from '../utils/authErrors';

/**
 * Tracks one form's Cognito request: whether it's in progress, and a friendly
 * message if it fails. Every auth page uses this instead of repeating the logic.
 */
export function useFormAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  const run = useCallback(async (action: () => Promise<void>) => {
    setPending(true);
    setError(undefined);
    try {
      await action();
    } catch (caught) {
      setError(getAuthErrorMessage(caught));
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, run };
}
