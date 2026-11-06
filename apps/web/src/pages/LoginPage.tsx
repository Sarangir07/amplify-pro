import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alert } from '../components/Alert';
import { AuthLayout } from '../components/AuthLayout';
import { FormField } from '../components/FormField';
import { useAuth } from '../hooks/useAuth';
import { useAuthRouteState } from '../hooks/useAuthRouteState';
import { useFormAction } from '../hooks/useFormAction';
import {
  logIn,
  requestPasswordReset,
  resendVerificationCode,
} from '../services/auth';
import { validateEmail } from '../utils/validation';

export function LoginPage() {
  const navigate = useNavigate();
  const routeState = useAuthRouteState();
  const { refreshUser, sessionExpired } = useAuth();
  const { pending, error, run } = useFormAction();

  const [email, setEmail] = useState(routeState.email ?? '');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [unsupported, setUnsupported] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const invalidEmail = validateEmail(email);
    const invalidPassword = password ? undefined : 'Enter your password.';
    setEmailError(invalidEmail);
    setPasswordError(invalidPassword);
    setUnsupported(false);
    if (invalidEmail || invalidPassword) {
      return;
    }

    await run(async () => {
      const result = await logIn(email, password);

      switch (result) {
        case 'signed-in':
          // Once the status changes, GuestRoute redirects to the right page.
          await refreshUser();
          break;
        case 'needs-email-verification':
          // Their earlier code may have expired, so try to send a fresh one.
          await resendVerificationCode(email).catch(() => {});
          void navigate('/verify-email', {
            state: {
              email,
              notice: 'Please verify your email. We sent you a new code.',
            },
          });
          break;
        case 'needs-password-reset':
          await requestPasswordReset(email);
          void navigate('/reset-password', {
            state: {
              email,
              notice: 'You need to reset your password. We sent you a code.',
            },
          });
          break;
        case 'unsupported-step':
          setUnsupported(true);
          break;
      }
    });
  }

  return (
    <AuthLayout
      title="Log in"
      footer={
        <>
          <Link to="/forgot-password" state={{ email }}>
            Forgot your password?
          </Link>
          <p>
            New here? <Link to="/signup">Create an account</Link>
          </p>
        </>
      }
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate>
        {sessionExpired && (
          <Alert tone="error">
            Your session has expired. Please log in again.
          </Alert>
        )}
        {routeState.notice && <Alert tone="success">{routeState.notice}</Alert>}
        {error && <Alert tone="error">{error}</Alert>}
        {unsupported && (
          <Alert tone="error">
            This account needs a login step this app doesn’t support yet.
          </Alert>
        )}

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
        />

        <button type="submit" className="button button--full" disabled={pending}>
          {pending ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </AuthLayout>
  );
}
